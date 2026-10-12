package friends

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
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

func AddFriend(dbPool *pgxpool.Pool, notifier Notifier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		var req FriendRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		if req.FriendUsername == "" {
			http.Error(w, "Friend username is required.", http.StatusBadRequest)
			return
		}

		// Also returns the recipient's email and the sender's details,
		// so the recipient can be notified live without another query
		insertSQL := `
			WITH inserted AS (
				INSERT INTO friendships (user_id, friend_id)
				VALUES (
					(SELECT id from users WHERE email = $1),
					(SELECT id from users WHERE username = $2)
				)
				RETURNING user_id, friend_id
			)
			SELECT recipient.email, sender.username, sender.avatar_url, sender.status
			FROM inserted
			JOIN users recipient ON recipient.id = inserted.friend_id
			JOIN users sender ON sender.id = inserted.user_id
		`

		var recipientEmail string
		var sender FriendResponse
		err := dbPool.QueryRow(context.Background(), insertSQL, email, req.FriendUsername).Scan(
			&recipientEmail, &sender.Username, &sender.AvatarURL, &sender.Status,
		)
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

		notifier.SendTo([]string{recipientEmail}, "friend_request", sender)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Friend request sent."))
	}
}

func RemoveFriend(dbPool *pgxpool.Pool, notifier Notifier) http.HandlerFunc {
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

		// Also returns the other user's email and my username,
		// so the removed friend can be notified live
		removeSQL := `
			WITH deleted AS (
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
				RETURNING user_id, friend_id
			)
			SELECT DISTINCT other.email, me.username
			FROM deleted
			JOIN users me ON me.email = $1
			JOIN users other ON other.id IN (deleted.user_id, deleted.friend_id) AND other.id <> me.id
		`

		var otherEmail, myUsername string
		err := dbPool.QueryRow(context.Background(), removeSQL, myEmail, req.FriendUsername).Scan(&otherEmail, &myUsername)
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "You are not friends with this user.", http.StatusNotFound)
			return
		}
		if err != nil {
			log.Println("Database error during friend removal:", err)
			http.Error(w, "Failed to remove friend.", http.StatusInternalServerError)
			return
		}

		notifier.SendTo([]string{otherEmail}, "friend_removed", FriendResponse{Username: myUsername})

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Friend removed."))
	}
}

// FriendEmails returns the emails of everyone with an accepted friendship
// with the given user, so live events can be pushed to them
func FriendEmails(ctx context.Context, dbPool *pgxpool.Pool, email string) ([]string, error) {
	query := `
		SELECT u.email
		FROM users me
		JOIN friendships f ON f.status = 'ACCEPTED' AND me.id IN (f.user_id, f.friend_id)
		JOIN users u ON u.id = CASE WHEN f.user_id = me.id THEN f.friend_id ELSE f.user_id END
		WHERE me.email = $1 AND u.email IS NOT NULL
	`

	rows, err := dbPool.Query(ctx, query, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	emails := []string{}
	for rows.Next() {
		var e string
		if err := rows.Scan(&e); err != nil {
			return nil, err
		}
		emails = append(emails, e)
	}
	return emails, rows.Err()
}
