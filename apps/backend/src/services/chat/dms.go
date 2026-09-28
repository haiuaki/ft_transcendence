package chat

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func StartDM(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed.", http.StatusMethodNotAllowed)
			return
		}

		var req StartDMRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		myEmail := r.Context().Value(auth.UserEmailKey).(string)
		var myID, targetID string

		err := dbPool.QueryRow(r.Context(), "SELECT id FROM users WHERE email = $1", myEmail).Scan(&myID)
		if err != nil {
			http.Error(w, "Sender not found.", http.StatusUnauthorized)
			return
		}

		err = dbPool.QueryRow(r.Context(), "SELECT id FROM users WHERE username = $1", req.TargetUsername).Scan(&targetID)
		if err != nil {
			http.Error(w, "Target user not found.", http.StatusNotFound)
			return
		}

		if myID == targetID {
			http.Error(w, "You cannot DM yourself.", http.StatusBadRequest)
			return
		}

		var existingChannelID int
		checkSQL := `
			SELECT c.id FROM channels c
			JOIN channel_members cm1 ON c.id = cm1.channel_id
			JOIN channel_members cm2 ON c.id = cm2.channel_id
			WHERE c.type = 'DIRECT' AND cm1.user_id = $1 AND cm2.user_id = $2
		`
		err = dbPool.QueryRow(r.Context(), checkSQL, myID, targetID).Scan(&existingChannelID)

		w.Header().Set("Content-Type", "application/json")

		if err == nil {
			// A DM already exists, return the existing channel ID
			json.NewEncoder(w).Encode(DMResponse{
				ChannelID: existingChannelID,
				Message:   "Existing DM found.",
			})
			return
		}

		// If no DM exists, create a new invisible 'DIRECT' channel
		var newChannelID int
		err = dbPool.QueryRow(r.Context(), "INSERT INTO channels (name, type) VALUES ('DM', 'DIRECT') RETURNING id").Scan(&newChannelID)
		if err != nil {
			http.Error(w, "Failed to create DM channel.", http.StatusInternalServerError)
			return
		}

		// Add both users to the channel, setting them to 'ACTIVE' so WebSockets allow them to chat
		insertMemberSQL := `
			INSERT INTO channel_members (channel_id, user_id, status)
			VALUES ($1, $2, 'ACTIVE')
		`
		dbPool.Exec(r.Context(), insertMemberSQL, newChannelID, myID)
		dbPool.Exec(r.Context(), insertMemberSQL, newChannelID, targetID)

		json.NewEncoder(w).Encode(DMResponse{
			ChannelID: newChannelID,
			Message:   fmt.Sprintf("New DM created with %s.", req.TargetUsername),
		})
	}
}
