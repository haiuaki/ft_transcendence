package friends

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func GetFriends(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		getFriendsSQL := `
			SELECT u.username, u.avatar_url, u.status
			FROM friendships f
			JOIN users u ON f.friend_id = u.id
			WHERE f.user_id = (SELECT id FROM users WHERE email = $1)
			AND f.status = 'ACCEPTED'

			UNION

			SELECT u.username, u.avatar_url, u.status
			FROM friendships f
			JOIN users u ON f.user_id = u.id
			WHERE f.friend_id = (SELECT id FROM users WHERE email = $1)
			AND f.status = 'ACCEPTED'
		`

		rows, err := dbPool.Query(context.Background(), getFriendsSQL, email)
		if err != nil {
			log.Println("Database error fetching friends:", err)
			http.Error(w, "Failed to fetch friends.", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		friends := []FriendResponse{}

		for rows.Next() {
			var f FriendResponse
			if err := rows.Scan(&f.Username, &f.AvatarURL, &f.Status); err != nil {
				log.Println("Error scanning friend row:", err)
				continue
			}
			friends = append(friends, f)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(friends)
	}
}

func AddFriend(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		var req FriendRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		insertSQL := `
			INSERT INTO friendships (user_id, friend_id)
			VALUES (
				(SELECT id from users WHERE email = $1),
				(SELECT id from users WHERE username = $2)
			)
		`

		_, err := dbPool.Exec(context.Background(), insertSQL, email, req.FriendUsername)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key value") {
				http.Error(w, "You are already friends, or a request is already pending.", http.StatusConflict)
				return
			}

			if strings.Contains(err.Error(), "null value in column") {
				http.Error(w, "User not found.", http.StatusNotFound)
				return
			}

			http.Error(w, "Failed to add friend.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Friend request sent."))
	}
}

func RemoveFriend(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		myEmail := r.Context().Value(auth.UserEmailKey).(string)

		var req FriendRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		removeSQL := `
			DELETE FROM friendships
			WHERE STATUS = 'ACCEPTED'
			AND (
				(
					user_id = (SELECT id FROM users WHERE email = $1)
					AND friend_id = (SELECT id FROM users WHERE username = $2)
				)
				OR (
					user_id = (SELECT id FROM users WHERE username = $2)
					AND friend_id = (SELECT id FROM users WHERE email = $1)
				)
			)
		`

		result, err := dbPool.Exec(context.Background(), removeSQL, myEmail, req.FriendUsername)
		if err != nil {
			log.Println("Database error during friend removal:", err)
			http.Error(w, "Failed to remove friend.", http.StatusInternalServerError)
			return
		}

		if result.RowsAffected() == 0 {
			http.Error(w, "You are not friends with this user.", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Friend removed."))
	}
}
