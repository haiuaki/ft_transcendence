package users

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func GetProfile(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		var profile UserProfile
		query := `
			SELECT username, email, avatar_url, status, created_at
			FROM users
			WHERE email = $1
		`

		err := dbPool.QueryRow(context.Background(), query, email).Scan(
			&profile.Username,
			&profile.Email,
			&profile.AvatarURL,
			&profile.Status,
			&profile.CreatedAt,
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

		var req UpdateProfileRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		if req.Username != nil {
			if !auth.UsernameRegex.MatchString(*req.Username) {
				http.Error(w, "Username must be 3-20 characters and contain only letters, numbers, and underscores.", http.StatusBadRequest)
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

		softDeleteSQL := `
			UPDATE users
			SET deleted_at = CURRENT_TIMESTAMP
			WHERE email = $1
		`

		_, err := dbPool.Exec(context.Background(), softDeleteSQL, email)
		if err != nil {
			log.Println("Database error during profile deletion:", err)
			http.Error(w, "Failed to delete account.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Account successfully deleted."))
	}
}
