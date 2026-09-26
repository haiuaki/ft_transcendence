package chat

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func GetRooms(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := `
			SELECT
				c.id, c.name, c.type, c.owner_id, c.created_at,
				COUNT(cm.user_id)::INTEGER as active_members
			FROM channels c
			LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.status = 'ACTIVE'
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
			if err := rows.Scan(&room.ID, &room.Name, &room.Type, &room.OwnerID, &room.CreatedAt, &room.ActiveMembers); err != nil {
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
			UPDATE channel_members 
			SET status = 'LEFT' 
			WHERE user_id = (SELECT id FROM users WHERE email = $1) 
			  AND status = 'ACTIVE'
		`
		dbPool.Exec(context.Background(), standUpSQL, email)

		var req CreateRoomRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			http.Error(w, "Room name is required.", http.StatusBadRequest)
			return
		}

		if req.Type != "PUBLIC" && req.Type != "PRIVATE" {
			req.Type = "PUBLIC" // Default to public if garbage was sent
		}

		var passwordHash *string
		if req.Type == "PRIVATE" && req.Password != "" {
			hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
			if err != nil {
				http.Error(w, "Failed to secure room password.", http.StatusInternalServerError)
				return
			}
			hashStr := string(hash)
			passwordHash = &hashStr
		}

		var newRoomID int
		insertRoomSQL := `
			INSERT INTO channels (name, type, password_hash, owner_id)
			VALUES ($1, $2, $3, (SELECT id FROM users WHERE email = $4))
			RETURNING id
		`

		err := dbPool.QueryRow(context.Background(), insertRoomSQL, req.Name, req.Type, passwordHash, email).Scan(&newRoomID)
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
		w.Write([]byte("Room created successfully."))
	}
}

func JoinRoom(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		// Enforce Physics: Stand the user up from any room they are currently sitting in
		standUpSQL := `
			UPDATE channel_members 
			SET status = 'LEFT' 
			WHERE user_id = (SELECT id FROM users WHERE email = $1) 
			  AND status = 'ACTIVE'
		`
		dbPool.Exec(context.Background(), standUpSQL, email)

		var req JoinRoomRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		var roomType string
		var passwordHash *string
		roomQuery := `SELECT type, password_hash FROM channels WHERE id = $1`

		err := dbPool.QueryRow(context.Background(), roomQuery, req.ChannelID).Scan(&roomType, &passwordHash)
		if err != nil {
			http.Error(w, "Room not found.", http.StatusNotFound)
			return
		}

		var existingRole string
		memberQuery := `
			SELECT role FROM channel_members
			WHERE channel_id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)
		`

		err = dbPool.QueryRow(context.Background(), memberQuery, req.ChannelID, email).Scan(&existingRole)
		if err == nil {
			// SCENARIO A: The user is already in the database for this room
			if existingRole == "BANNED" {
				http.Error(w, "You are banned from this room.", http.StatusForbidden)
				return
			}

			// They are not allowed in the room -> Update their status to 'ACTIVE'
			updateSQL := `
				UPDATE channel_members
				SET status = 'ACTIVE'
				WHERE channel_id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)
			`
			dbPool.Exec(context.Background(), updateSQL, req.ChannelID, email)

			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Sat back down in the room."))
			return
		}

		// SCENARIO B: The user is new to the room
		if roomType == "PRIVATE" {
			if req.Password == "" || passwordHash == nil {
				http.Error(w, "Password required for this room.", http.StatusUnauthorized)
				return
			}

			if err := bcrypt.CompareHashAndPassword([]byte(*passwordHash), []byte(req.Password)); err != nil {
				http.Error(w, "Incorrect room password.", http.StatusUnauthorized)
				return
			}
		}

		// Insert them as a new MEMBER who is ACTIVE
		insertSQL := `
			INSERT INTO channel_members (channel_id, user_id, role, status)
			VALUES ($1, (SELECT id FROM users WHERE email = $2), 'MEMBER', 'ACTIVE')
		`

		_, err = dbPool.Exec(context.Background(), insertSQL, req.ChannelID, email)
		if err != nil {
			log.Println("Database error joining room:", err)
			http.Error(w, "Failed to join room.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Successfully joined the room."))
	}
}

func LeaveRoom(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		var req LeaveRoomRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		updateSQL := `
			UPDATE channel_members
			SET status = 'LEFT'
			WHERE channel_id = $1
				AND user_id = (SELECT id FROM users WHERE email = $2)
				AND status = 'ACTIVE'
		`

		result, err := dbPool.Exec(context.Background(), updateSQL, req.ChannelID, email)
		if err != nil {
			log.Println("Database error leaving room:", err)
			http.Error(w, "Failed to leave room.", http.StatusInternalServerError)
			return
		}

		if result.RowsAffected() == 0 {
			http.Error(w, "You are not active in this room.", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Successfully left the room."))
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

func GetRoomMessages(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get `room_id` from the URL (e.g., `?room_id=1`)
		roomIDStr := r.URL.Query().Get("room_id")
		roomID, err := strconv.Atoi(roomIDStr)
		if err != nil {
			http.Error(w, "Invalid Room ID.", http.StatusBadRequest)
			return
		}

		// Make sure the user is sitting in the room
		userEmail := r.Context().Value(auth.UserEmailKey).(string)
		var isActive bool
		checkSQL := `
			SELECT EXISTS (
				SELECT 1 FROM channel_members cm
				JOIN users u ON cm.user_id = u.id
				WHERE cm.channel_id = $1 AND u.email = $2 AND cm.status = 'ACTIVE'
			)
		`
		if err := dbPool.QueryRow(r.Context(), checkSQL, roomID, userEmail).Scan(&isActive); err != nil {
			http.Error(w, "Forbidden: you must join the room to view history.", http.StatusForbidden)
			return
		}

		// Fetch the 50 newest messages and order them older-to-newest for UI
		historySQL := `
			SELECT * FROM (
				SELECT m.id, u.username, m.content, m.created_at
				FROM messages m
				JOIN users u ON m.sender_id = u.id
				WHERE m.channel_id = $1
				ORDER BY m.created_at DESC
				LIMIT 50
			) AS recent_mssages
			ORDER BY created_at ASC;
		`

		rows, err := dbPool.Query(r.Context(), historySQL, roomID)
		if err != nil {
			http.Error(w, "Failed to retrieve messages.", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var messages []MessageResponse
		for rows.Next() {
			var msg MessageResponse
			if err := rows.Scan(&msg.ID, &msg.Username, &msg.Content, &msg.CreatedAt); err == nil {
				messages = append(messages, msg)
			}
		}

		// Prevent returning 'null' in JSON if the room is empty
		if messages == nil {
			messages = []MessageResponse{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}
