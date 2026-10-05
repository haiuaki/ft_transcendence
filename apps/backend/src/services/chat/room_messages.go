package chat

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func GetRoomMessages(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract room_id from the query parameters
		roomIDStr := r.URL.Query().Get("room_id")
		roomID, err := strconv.Atoi(roomIDStr)
		if err != nil {
			http.Error(w, "Invalid Room ID.", http.StatusBadRequest)
			return
		}

		// Extract before_id for cursor-based pagination, if provided
		var beforeID *int
		if beforeIDStr := r.URL.Query().Get("before_id"); beforeIDStr != "" {
			if id, err := strconv.Atoi(beforeIDStr); err == nil {
				beforeID = &id
			}
		}

		// Enforce spatial consistency: verify the user is an active member of the specified room
		userEmail := r.Context().Value(auth.UserEmailKey).(string)
		var isActive bool
		checkSQL := `
			SELECT EXISTS (
				SELECT 1 FROM channel_members cm
				JOIN users u ON cm.user_id = u.id
				WHERE cm.channel_id = $1 AND u.email = $2 AND cm.status = 'ACTIVE'
			)
		`
		if err := dbPool.QueryRow(r.Context(), checkSQL, roomID, userEmail).Scan(&isActive); err != nil || !isActive {
			http.Error(w, "Forbidden: You must join the room to view history.", http.StatusForbidden)
			return
		}

		// Retrieve up to 50 preceding messages, ordering oldest-to-newest for UI rendering
		historySQL := `
			SELECT * FROM (
				SELECT m.id, u.username, m.content, m.created_at
				FROM messages m
				JOIN users u ON m.sender_id = u.id
				WHERE m.channel_id = $1 
				AND ($2::INTEGER IS NULL OR m.id < $2::INTEGER)
				ORDER BY m.id DESC
				LIMIT 50
			) AS recent_messages
			ORDER BY created_at ASC;
		`

		rows, err := dbPool.Query(r.Context(), historySQL, roomID, beforeID)
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

		// Prevent returning 'null' in JSON if the room has no history
		if messages == nil {
			messages = []MessageResponse{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}
