package users

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

// MaxAvatarLen caps the stored avatar string (base64 data URL or remote URL).
const MaxAvatarLen = 200 * 1024

const defaultAvatarPath = "/img/avatar.jpg"

func isValidAvatar(avatar string) bool {
	if avatar == defaultAvatarPath {
		return true
	}
	if strings.HasPrefix(avatar, "data:image/jpeg;base64,") || strings.HasPrefix(avatar, "data:image/png;base64,") {
		return true
	}
	parsed, err := url.ParseRequestURI(avatar)
	return err == nil && parsed.Scheme == "https"
}

func GetProfile(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		var profile UserProfile
		query := `
			SELECT username, email, avatar_url, status, total_messages_sent, cumulative_time_seconds, created_at, is_2fa_enabled
			FROM users
			WHERE email = $1
		`

		err := dbPool.QueryRow(context.Background(), query, email).Scan(
			&profile.Username,
			&profile.Email,
			&profile.AvatarURL,
			&profile.Status,
			&profile.TotalMessagesSent,
			&profile.CumulativeTimeSeconds,
			&profile.CreatedAt,
			&profile.TwoFactorEnabled,
		)

		if err != nil {
			http.Error(w, "User not found.", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	}
}

func GetPublicProfile(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		myEmail := r.Context().Value(auth.UserEmailKey).(string)
		targetUsername := r.PathValue("username")

		var profile UserProfile

		// friendship_status is seen from the viewer's side:
		// friends, pending_sent, pending_received or none
		query := `
			SELECT u.username, u.avatar_url, u.status, u.total_messages_sent, u.cumulative_time_seconds, u.created_at,
				COALESCE((
					SELECT CASE
						WHEN f.status = 'ACCEPTED' THEN 'friends'
						WHEN f.user_id = me.id THEN 'pending_sent'
						ELSE 'pending_received'
					END
					FROM friendships f
					WHERE (f.user_id = me.id AND f.friend_id = u.id)
						OR (f.user_id = u.id AND f.friend_id = me.id)
					ORDER BY f.status = 'ACCEPTED' DESC
					LIMIT 1
				), 'none')
			FROM users u
			CROSS JOIN (SELECT id FROM users WHERE email = $2) me
			WHERE LOWER(u.username) = LOWER($1) AND u.deleted_at IS NULL
		`

		err := dbPool.QueryRow(context.Background(), query, targetUsername, myEmail).Scan(
			&profile.Username,
			&profile.AvatarURL,
			&profile.Status,
			&profile.TotalMessagesSent,
			&profile.CumulativeTimeSeconds,
			&profile.CreatedAt,
			&profile.FriendshipStatus,
		)

		if err != nil {
			http.Error(w, "User not found.", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	}
}

func UpdateProfile(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		r.Body = http.MaxBytesReader(w, r.Body, MaxAvatarLen+4096)

		var req UpdateProfileRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			var maxBytesErr *http.MaxBytesError
			if errors.As(err, &maxBytesErr) {
				http.Error(w, "Avatar is too large.", http.StatusRequestEntityTooLarge)
				return
			}
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		if req.Username != nil {
			if !auth.UsernameRegex.MatchString(*req.Username) {
				http.Error(w, auth.UsernameRuleMessage, http.StatusBadRequest)
				return
			}
		}

		if req.AvatarURL != nil {
			if len(*req.AvatarURL) > MaxAvatarLen {
				http.Error(w, "Avatar is too large.", http.StatusRequestEntityTooLarge)
				return
			}
			if !isValidAvatar(*req.AvatarURL) {
				http.Error(w, "Invalid Avatar URL format.", http.StatusBadRequest)
				return
			}
		}

		updateSQL := `
			UPDATE users
			SET
				username = COALESCE($1, username),
				avatar_url = COALESCE($2, avatar_url),
				updated_at = CURRENT_TIMESTAMP
			WHERE email = $3
		`

		_, err := dbPool.Exec(context.Background(), updateSQL, req.Username, req.AvatarURL, email)
		if err != nil {
			// Taken username check
			if strings.Contains(err.Error(), "duplicate key value") {
				http.Error(w, "This username is already taken.", http.StatusConflict)
				return
			}
			// Internal random error
			log.Println("Database error during profile update:", err)
			http.Error(w, "Failed to update profile.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Profile updated successfully."))
	}
}

func DeleteProfile(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		// Cleanup Zombie Rooms: Since user deletion is a "soft delete",
		// PostgreSQL's ON DELETE CASCADE won't fire for the rooms they own.
		// We must manually delete them.
		deleteRoomsSQL := `
			DELETE FROM channels 
			WHERE owner_id = (SELECT id FROM users WHERE email = $1)
		`
		_, err := dbPool.Exec(context.Background(), deleteRoomsSQL, email)
		if err != nil {
			log.Println("Database error cleaning up user rooms:", err)
			http.Error(w, "Failed to clean up account data.", http.StatusInternalServerError)
			return
		}

		softDeleteSQL := `
			UPDATE users
			SET deleted_at = CURRENT_TIMESTAMP
			WHERE email = $1
		`

		_, err = dbPool.Exec(context.Background(), softDeleteSQL, email)
		if err != nil {
			log.Println("Database error during profile deletion:", err)
			http.Error(w, "Failed to delete account.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Account successfully deleted."))
	}
}
