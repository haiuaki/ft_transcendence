package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	netmail "net/mail"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/haiuaki/ft_transcendence/src/services/mail"
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

		creds.Email = strings.ToLower(strings.TrimSpace(creds.Email))
		creds.Username = strings.TrimSpace(creds.Username)

		if !UsernameRegex.MatchString(creds.Username) {
			http.Error(w, UsernameRuleMessage, http.StatusBadRequest)
			return
		}

		if creds.Email == "" {
			http.Error(w, "Email is required.", http.StatusBadRequest)
			return
		}

		if creds.Password == "" {
			http.Error(w, "Password is required.", http.StatusBadRequest)
			return
		}

		if problem := PasswordProblem(creds.Password); problem != "" {
			http.Error(w, problem, http.StatusBadRequest)
			return
		}

		_, err = netmail.ParseAddress(creds.Email)
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

		// Generate a secure 32-byte random token
		tokenBytes := make([]byte, 32)
		rand.Read(tokenBytes)
		verificationToken := hex.EncodeToString(tokenBytes)

		insertSQL := `
			INSERT INTO users (username, email, password_hash, verification_token)
			VALUES ($1, $2, $3, $4)
		`
		_, err = dbPool.Exec(context.Background(), insertSQL, creds.Username, creds.Email, hashedPasswordString, verificationToken)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key value") {
				http.Error(w, "Username or Email already exists.", http.StatusConflict)
				return
			}
			log.Println("Database error:", err)
			http.Error(w, "Failed to create user.", http.StatusInternalServerError)
			return
		}

		// Construct the link pointing to the frontend (fallback if not set)
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "https://localhost:8443"
		}
		verifyLink := fmt.Sprintf("%s/verify?token=%s", frontendURL, verificationToken)

		mail.Send(creds.Email, "Welcome to ft_cluster. Please verify your email.",
			fmt.Sprintf(`<p>Thanks for signing up, %s.</p>
			             <p>Click <a href='%s'>here</a> to verify your account.</p>`,
				mail.Escape(creds.Username), verifyLink))

		fmt.Fprintf(w, "User %s successfully created. Please check your email to verify your account.", creds.Email)
	}
}

func Verify(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Grab the token from the URL (?token=abc)
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, "Verification token is missing.", http.StatusBadRequest)
			return
		}

		updateSQL := `
			UPDATE users
			SET is_verified = true, verification_token = NULL
			WHERE verification_token = $1
			RETURNING email
		`

		var verifiedEmail string
		err := dbPool.QueryRow(context.Background(), updateSQL, token).Scan(&verifiedEmail)
		if err != nil {
			// If now row is returned, token is fake or already used
			http.Error(w, "Invalid or expired verification token.", http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"message": "Account %s successfully verified."}`, verifiedEmail)
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

		creds.Email = strings.ToLower(strings.TrimSpace(creds.Email))
		creds.Username = strings.TrimSpace(creds.Username)

		// Allow the frontend to send the login string in either the "email" or "username" JSON field
		identifier := creds.Email
		if identifier == "" {
			identifier = creds.Username
		}

		if identifier == "" {
			http.Error(w, "Username or Email is required.", http.StatusBadRequest)
			return
		}

		if creds.Password == "" {
			http.Error(w, "Password is required.", http.StatusBadRequest)
			return
		}

		// Empty variables in memory. We will pass their memory addresses to .Scan()
		var savedHash string
		var savedEmail string
		var isVerified bool
		var is2FAEnabled bool

		// We explicitly SELECT the email so we can inject it into the JWT token later,
		// ensuring the token always contains the real email even if they logged in with a username.
		searchUserSQL := `
			SELECT email, password_hash, is_verified, is_2fa_enabled
			FROM users
			WHERE (email = $1 OR LOWER(username) = LOWER($1)) AND deleted_at IS NULL
		`

		// QueryRow runs the SQL, .Scan() copies the result into `savedEmail` and `savedHash`
		err = dbPool.QueryRow(context.Background(), searchUserSQL, identifier).Scan(&savedEmail, &savedHash, &isVerified, &is2FAEnabled)
		if err != nil {
			// .Scan() fails if the email doesn't exist in the database
			// Don't say "Email not found" for more protection against hackers
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		if !isVerified {
			http.Error(w, "Please check your email to verify your account before logging in.", http.StatusForbidden)
			return
		}

		// Give the saved hash and the typed password to bcrypt to compare
		err = bcrypt.CompareHashAndPassword([]byte(savedHash), []byte(creds.Password))
		if err != nil {
			// Fails if wrong password
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Password is correct, but 2FA users still need to send a code to /2fa/verify
		if is2FAEnabled {
			pendingToken, err := pendingTwoFactorToken(savedEmail)
			if err != nil {
				http.Error(w, "Failed to create token.", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{
				"two_factor_required": true,
				"temp_token":          pendingToken,
			})
			return
		}

		tokenString, err := sessionToken(savedEmail)
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
