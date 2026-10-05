package chat

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func GetRooms(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := `
			SELECT
				c.id, c.name, c.type, c.model_type, c.max_capacity,
				c.owner_id, c.created_at,
				COUNT(cm.user_id)::INTEGER as active_members
			FROM channels c
			LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.status = 'ACTIVE'
			WHERE c.type != 'DIRECT'
			GROUP BY c.id
			ORDER BY c.created_at DESC
		`

		rows, err := dbPool.Query(context.Background(), query)
		if err != nil {
			log.Println("Database error fetching rooms.", err)
			http.Error(w, "Failed to fetch rooms.", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var rooms []RoomResponse

		for rows.Next() {
			var room RoomResponse
			if err := rows.Scan(
				&room.ID, &room.Name, &room.Type, &room.ModelType, &room.MaxCapacity,
				&room.OwnerID, &room.CreatedAt, &room.ActiveMembers,
			); err != nil {
				log.Println("Error scanning room row:", err)
				continue
			}
			rooms = append(rooms, room)
		}

		if rooms == nil {
			rooms = []RoomResponse{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rooms)
	}
}

func CreateRoom(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		// Enforce Physics: Stand the user up from any room they are currently sitting in
		standUpSQL := `
			WITH updated_member AS (
				UPDATE channel_members 
				SET status = 'LEFT' 
				WHERE user_id = (SELECT id FROM users WHERE email = $1) 
				AND status = 'ACTIVE'
				AND channel_id IN (SELECT id FROM channels WHERE type != 'DIRECT')
				RETURNING user_id, joined_at
			),
			aggregated_time AS (
				SELECT user_id, SUM(EXTRACT(EPOCH FROM (NOW() - joined_at))::INTEGER) as total_added_time
				FROM updated_member
				GROUP BY user_id
			),
			updated_user AS (
				UPDATE users
				SET cumulative_time_seconds = cumulative_time_seconds + at.total_added_time
				FROM aggregated_time at
				WHERE users.id = at.user_id
				RETURNING users.id, at.total_added_time
			)
			INSERT INTO daily_user_analytics (user_id, date, time_spent_seconds)
			SELECT id, CURRENT_DATE, total_added_time FROM updated_user
			ON CONFLICT (user_id, date)
			DO UPDATE SET time_spent_seconds = daily_user_analytics.time_spent_seconds + EXCLUDED.time_spent_seconds
		`
		dbPool.Exec(context.Background(), standUpSQL, email)

		var req CreateRoomRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		req.Name = strings.TrimSpace(req.Name)
		if len(req.Name) < 3 || len(req.Name) > 30 {
			http.Error(w, "Room name must be between 3 and 30 characters.", http.StatusBadRequest)
			return
		}

		if req.Type != "PUBLIC" && req.Type != "PRIVATE" {
			req.Type = "PUBLIC" // Default to public if garbage was sent
		}

		if req.Type == "PRIVATE" && req.Password == "" {
			http.Error(w, "Private rooms require a password.", http.StatusBadRequest)
			return
		}

		var passwordHash *string
		if req.Type == "PRIVATE" {
			hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
			if err != nil {
				http.Error(w, "Failed to secure room password.", http.StatusInternalServerError)
				return
			}
			hashStr := string(hash)
			passwordHash = &hashStr
		}

		maxSeats, modelExists := ModelCapacities[req.Model]
		if !modelExists {
			req.Model = "CLUSTER"
			maxSeats = 3
		}

		var newRoomID int
		insertRoomSQL := `
			INSERT INTO channels (name, type, password_hash, model_type, max_capacity, owner_id)
			VALUES ($1, $2, $3, $4, $5, (SELECT id FROM users WHERE email = $6))
			RETURNING id
		`

		err := dbPool.QueryRow(context.Background(), insertRoomSQL, req.Name, req.Type, passwordHash, req.Model, maxSeats, email).Scan(&newRoomID)
		if err != nil {
			log.Println("Error creating a room:", err)
			http.Error(w, "Failed to create room.", http.StatusInternalServerError)
			return
		}

		insertMemberSQL := `
			INSERT INTO channel_members (channel_id, user_id, role, status)
			VALUES ($1, (SELECT id FROM users WHERE email = $2), 'OWNER', 'ACTIVE')
		`

		_, err = dbPool.Exec(context.Background(), insertMemberSQL, newRoomID, email)
		if err != nil {
			log.Println("Error adding owner to room members:", err)
		}

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]int{"room_id": newRoomID})
	}
}

func UpdateRoom(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		var req UpdateRoomRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		// Security Check: Ensure the user is the owner
		var isOwner bool
		ownerCheckSQL := `
			SELECT EXISTS (
				SELECT 1 FROM channels
				WHERE id = $1 AND owner_id = (SELECT id FROM users WHERE email = $2)
			)
		`
		if err := dbPool.QueryRow(context.Background(), ownerCheckSQL, req.ChannelID, email).Scan(&isOwner); err != nil || !isOwner {
			http.Error(w, "Only the owner can edit this room.", http.StatusForbidden)
			return
		}

		if req.Name != "" {
			req.Name = strings.TrimSpace(req.Name)
			if len(req.Name) < 3 || len(req.Name) > 30 {
				http.Error(w, "Room name must be between 3 and 30 characters.", http.StatusBadRequest)
				return
			}
		}

		if req.Type != "" && req.Type != "PUBLIC" && req.Type != "PRIVATE" {
			http.Error(w, "Invalid room type.", http.StatusBadRequest)
			return
		}

		if req.Type == "PRIVATE" && req.Password == "" {
			http.Error(w, "Private rooms require a password.", http.StatusBadRequest)
			return
		}

		// Prepare dynamic update
		var passwordHash *string
		if req.Type == "PRIVATE" {
			hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
			if err != nil {
				http.Error(w, "Failed to secure room password.", http.StatusInternalServerError)
				return
			}
			hashStr := string(hash)
			passwordHash = &hashStr
		}

		updateSQL := `
			UPDATE channels
			SET
				name = COALESCE(NULLIF($1, ''), name),
				type = COALESCE(NULLIF($2, ''), type),
				password_hash = CASE 
									WHEN $2 = 'PRIVATE' THEN $3 
									WHEN $2 = 'PUBLIC' THEN NULL 
									ELSE password_hash 
								END
			WHERE id = $4
		`

		_, err := dbPool.Exec(context.Background(), updateSQL, req.Name, req.Type, passwordHash, req.ChannelID)
		if err != nil {
			log.Println("Database error updating room:", err)
			http.Error(w, "Failed to update room.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Room updated successfully."))
	}
}

func DeleteRoom(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		var req DeleteRoomRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		var isOwner bool
		ownerCheckSQL := `
			SELECT (owner_id = (SELECT id FROM users WHERE email = $2))
			FROM channels
			WHERE id = $1
		`
		err := dbPool.QueryRow(context.Background(), ownerCheckSQL, req.ChannelID, email).Scan(&isOwner)
		if err != nil {
			http.Error(w, "Room not found.", http.StatusNotFound)
			return
		}

		if !isOwner {
			http.Error(w, "Only the owner can delete this room.", http.StatusForbidden)
			return
		}

		deleteSQL := `DELETE FROM channels WHERE id = $1`
		_, err = dbPool.Exec(context.Background(), deleteSQL, req.ChannelID)
		if err != nil {
			log.Println("Database error deleting room:", err)
			http.Error(w, "Failed to delete room.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Room successfully deleted."))
	}
}
