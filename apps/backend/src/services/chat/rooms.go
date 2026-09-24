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
