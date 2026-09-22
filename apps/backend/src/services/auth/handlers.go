package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func Signup(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var creds Credentials

		// NewDecoder() reads the incoming JSON stream (r.Body)
		// Decode() translates that JSON and fills out the blank 'creds' form
		err := json.NewDecoder(r.Body).Decode(&creds)
		if err != nil {
			http.Error(w, "Invalid JSON data.", http.StatusBadRequest)
			return
		}

		if creds.Email == "" || creds.Password == "" {
			http.Error(w, "Email and password required.", http.StatusBadRequest)
			return
		}

		if len(creds.Password) < 8 {
			http.Error(w, "Password must be at least 8 characters long.", http.StatusBadRequest)
			return
		}

		_, err = mail.ParseAddress(creds.Email)
		if err != nil {
			http.Error(w, "Invalid email format.", http.StatusBadRequest)
			return
		}

		// 14 is the "cost" (how computationally expensive it is to hash)
		hashedBytes, err := bcrypt.GenerateFromPassword([]byte(creds.Password), 14)
		if err != nil {
			http.Error(w, "Failed to hash password.", http.StatusInternalServerError)
			return
		}

		hashedPasswordString := string(hashedBytes)

		insertSQL := `
			INSERT INTO users (username, email, password_hash)
			VALUES ($1, $2, $3)
		`

		_, err = dbPool.Exec(context.Background(), insertSQL, creds.Username, creds.Email, hashedPasswordString)
		if err != nil {
			// If the UNIQUE constraint fails
			if strings.Contains(err.Error(), "duplicate key value") {
				http.Error(w, "Email already exists.", http.StatusConflict)
				return
			}

			log.Println("Database error:", err)
			http.Error(w, "Failed to create user.", http.StatusInternalServerError)
			return
		}

		fmt.Fprintf(w, "User %s successfully created.", creds.Email)
	}

}

func Login(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var creds Credentials

		err := json.NewDecoder(r.Body).Decode(&creds)
		if err != nil {
			http.Error(w, "Invalid JSON data.", http.StatusBadRequest)
			return
		}

		if creds.Email == "" || creds.Password == "" {
			http.Error(w, "Email and password required", http.StatusBadRequest)
			return
		}

		// Empty variable to hold the saved password_hash from the database
		var savedHash string

		// Use WHERE to select the exact user with the given email
		searchUserSQL := `
			SELECT password_hash
			FROM users
			WHERE email = $1 AND deleted_at IS NULL
		`

		// QueryRow runs the SQL, .Scan() copies the result into `savedHash`
		err = dbPool.QueryRow(context.Background(), searchUserSQL, creds.Email).Scan(&savedHash)
		if err != nil {
			// .Scan() fails if the email doesn't exist in the database
			// Don't say "Email not found" for more protection against hackers
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Give the saved hash and the typed password to bcrypt to compare
		err = bcrypt.CompareHashAndPassword([]byte(savedHash), []byte(creds.Password))
		if err != nil {
			// Fails if wrong password
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Retrieve the JWT Secret Key
		secretKey := os.Getenv("JWT_SECRET")

		// Create the pass, attach the email and expiration date
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"email": creds.Email,
			"exp":   time.Now().Add(time.Hour * 24).Unix(),
		})

		// Sign the pass with the secret key to protect from hackers
		tokenString, err := token.SignedString([]byte(secretKey))
		if err != nil {
			http.Error(w, "Failed to create token.", http.StatusInternalServerError)
			return
		}

		// Send the token as a JSON response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"token": tokenString,
		})
	}
}

func GetProfile(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(UserEmailKey).(string)

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
		email := r.Context().Value(UserEmailKey).(string)

		var req UpdateProfileRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
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
		email := r.Context().Value(UserEmailKey).(string)

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
