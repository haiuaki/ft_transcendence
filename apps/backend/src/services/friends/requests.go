package friends

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func GetFriendRequests(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		// Only want to see who added us (friend_id = u.id) and we want to see their details
		// (u.id = user_id)
		requestsSQL := `
			SELECT u.username, u.avatar_url, u.status
			FROM friendships f
			JOIN users u ON f.user_id = u.id
			WHERE f.friend_id = (SELECT id FROM users WHERE email = $1)
			AND f.status = 'PENDING'
		`

		rows, err := dbPool.Query(context.Background(), requestsSQL, email)
		if err != nil {
			log.Println("Database error fetching friend requests:", err)
			http.Error(w, "Failed to fetch friend requests.", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		requests := []FriendResponse{}
		for rows.Next() {
			var r FriendResponse
			if err := rows.Scan(&r.Username, &r.AvatarURL, &r.Status); err != nil {
				continue
			}
			requests = append(requests, r)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(requests)
	}
}

func AcceptFriend(dbPool *pgxpool.Pool, notifier Notifier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		myEmail := r.Context().Value(auth.UserEmailKey).(string)

		var req FriendRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		if req.FriendUsername == "" {
			http.Error(w, "Friend username is required.", http.StatusBadRequest)
			return
		}

		// Also returns the requester's email and my details,
		// so the requester sees the new friend live
		acceptSQL := `
			WITH updated AS (
				UPDATE friendships
				SET status = 'ACCEPTED'
				WHERE user_id = (SELECT id FROM users WHERE username = $1)
					AND friend_id = (SELECT id FROM users WHERE email = $2)
					AND status = 'PENDING'
				RETURNING user_id, friend_id
			)
			SELECT requester.email, accepter.username, accepter.avatar_url, accepter.status
			FROM updated
			JOIN users requester ON requester.id = updated.user_id
			JOIN users accepter ON accepter.id = updated.friend_id
		`

		var requesterEmail string
		var accepter FriendResponse
		err := dbPool.QueryRow(context.Background(), acceptSQL, req.FriendUsername, myEmail).Scan(
			&requesterEmail, &accepter.Username, &accepter.AvatarURL, &accepter.Status,
		)
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "No pending friend request found from this user.", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "Database error.", http.StatusInternalServerError)
			return
		}

		notifier.SendTo([]string{requesterEmail}, "friend_accepted", accepter)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Friend request accepted."))
	}
}

func DenyFriend(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		myEmail := r.Context().Value(auth.UserEmailKey).(string)

		var req FriendRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		if req.FriendUsername == "" {
			http.Error(w, "Friend username is required.", http.StatusBadRequest)
			return
		}

		denySQL := `
			DELETE FROM friendships
			WHERE user_id = (SELECT id FROM users WHERE username = $1)
			AND friend_id = (SELECT id FROM users WHERE email = $2)
			AND status = 'PENDING'
		`

		result, err := dbPool.Exec(context.Background(), denySQL, req.FriendUsername, myEmail)
		if err != nil {
			http.Error(w, "Database error.", http.StatusInternalServerError)
			return
		}

		if result.RowsAffected() == 0 {
			http.Error(w, "No pending friend request found from this user.", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Friend request denied and removed."))
	}
}
