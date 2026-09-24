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

func CreateRoom(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

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
