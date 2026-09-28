package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/resend/resend-go/v4"
	"golang.org/x/crypto/bcrypt"
)

// UsernameRegex ensures usernames are 3-20 characters long and strictly alphanumeric or underscores
// The `$` ensures the string stricly ends after valid characters, blocking trailing emojis.
var UsernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{3,20}$`)

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
			http.Error(w, "Username must be 3-20 characters and contain only letters, numbers, and underscores.", http.StatusBadRequest)
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

		if len(creds.Password) < 8 || len(creds.Password) > 72 {
			http.Error(w, "Password must be between 8 and 72 characters long.", http.StatusBadRequest)
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

		resendAPIKey := os.Getenv("RESEND_API_KEY")
		if resendAPIKey != "" {
			client := resend.NewClient(resendAPIKey)

			// Construct the link pointing to the frontend (fallback to 3000 if not set)
			frontendURL := os.Getenv("FRONTEND_URL")
			if frontendURL == "" {
				frontendURL = "http://localhost:3000"
			}
			verifyLink := fmt.Sprintf("%s/verify?token=%s", frontendURL, verificationToken)

			params := &resend.SendEmailRequest{
				From:    "onboarding@resend.dev",
				To:      []string{creds.Email},
				Subject: "Welcome to ft_transcendence. Please verify your email.",
				Html: fmt.Sprintf(`<p>Thanks for signing up, %s.</p>
				                   <p>Click <a href='%s'>here</a> to verify your account.</p>`,
					creds.Username, verifyLink),
			}

			_, err = client.Emails.Send(params)
			if err != nil {
				log.Println("Resend Error: Failed to send verification email:", err)
			} else {
				log.Printf("Verification email successfully sent to %s", creds.Email)
			}
		} else {
			log.Println("Warning: RESEND_API_KEY not set in `.env`. Email skipped.")
		}

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

		// We explicitly SELECT the email so we can inject it into the JWT token later,
		// ensuring the token always contains the real email even if they logged in with a username.
		searchUserSQL := `
			SELECT email, password_hash, is_verified
			FROM users
			WHERE (email = $1 OR LOWER(username) = LOWER($1)) AND deleted_at IS NULL
		`

		// QueryRow runs the SQL, .Scan() copies the result into `savedEmail` and `savedHash`
		err = dbPool.QueryRow(context.Background(), searchUserSQL, identifier).Scan(&savedEmail, &savedHash, &isVerified)
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

		// Retrieve the JWT Secret Key
		secretKey := os.Getenv("JWT_SECRET")

		// Create the pass, attach the email and expiration date
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"email": savedEmail,
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
