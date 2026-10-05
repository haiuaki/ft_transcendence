package chat

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func JoinRoom(dbPool *pgxpool.Pool) http.HandlerFunc {
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

		var req JoinRoomRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		var roomType string
		var passwordHash *string
		var maxCapacity *int
		roomQuery := `SELECT type, password_hash, max_capacity FROM channels WHERE id = $1`

		err := dbPool.QueryRow(context.Background(), roomQuery, req.ChannelID).Scan(&roomType, &passwordHash, &maxCapacity)
		if err != nil {
			http.Error(w, "Room not found.", http.StatusNotFound)
			return
		}

		// Enforce capacity limits if this isn't a direct message and capacity exists
		if roomType != "DIRECT" && maxCapacity != nil {
			var currentCount int
			countSQL := `SELECT COUNT(*) FROM channel_members WHERE channel_id = $1 AND status = 'ACTIVE'`
			dbPool.QueryRow(context.Background(), countSQL, req.ChannelID).Scan(&currentCount)

			if currentCount >= *maxCapacity {
				http.Error(w, "This room is currently full.", http.StatusForbidden)
				return
			}
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

			// They previously left the room -> reactivate their seat
			updateSQL := `
				UPDATE channel_members
				SET status = 'ACTIVE', joined_at = NOW()
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

		// Pre-flight: verify user is actually active in the room before running the analytics CTE
		var isActive bool
		checkSQL := `
			SELECT EXISTS (
				SELECT 1 FROM channel_members
				WHERE channel_id = $1
					AND user_id = (SELECT id FROM users WHERE email = $2)
					AND status = 'ACTIVE'
			)
		`
		if err := dbPool.QueryRow(context.Background(), checkSQL, req.ChannelID, email).Scan(&isActive); err != nil || !isActive {
			http.Error(w, "You are not active in this room.", http.StatusNotFound)
			return
		}

		updateSQL := `
			WITH updated_member AS (
				UPDATE channel_members
				SET status = 'LEFT'
				WHERE channel_id = $1
					AND user_id = (SELECT id FROM users WHERE email = $2)
					AND status = 'ACTIVE'
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

		_, err := dbPool.Exec(context.Background(), updateSQL, req.ChannelID, email)
		if err != nil {
			log.Println("Database error leaving room:", err)
			http.Error(w, "Failed to leave room.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Successfully left the room."))
	}
}
