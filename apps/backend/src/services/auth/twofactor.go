package auth

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"image/png"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pquerna/otp/totp"
)

const (
	// Name shown above the code in the authenticator app
	twoFactorIssuer = "ft_transcendence"

	// How long the user has to type their code after a correct password
	pendingTokenTTL = 5 * time.Minute

	// Wrong codes allowed per pending token, so the 6 digits can't be brute forced
	maxTwoFactorAttempts = 5

	// Lifetime of a normal session token
	sessionTokenTTL = 24 * time.Hour
)

// sessionToken creates the normal JWT used by RequireAuth and the WebSocket
func sessionToken(email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(sessionTokenTTL).Unix(),
	})
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// pendingTokenKey is different from the session key, so a pending token
// fails RequireAuth and the WebSocket check and can only be used on /2fa/verify
func pendingTokenKey() []byte {
	return []byte(os.Getenv("JWT_SECRET") + ":2fa-pending")
}

// pendingTwoFactorToken proves the password step passed, but grants no access by itself
func pendingTwoFactorToken(email string) (string, error) {
	idBytes := make([]byte, 16)
	if _, err := rand.Read(idBytes); err != nil {
		return "", err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email":   email,
		"purpose": "2fa",
		"jti":     hex.EncodeToString(idBytes),
		"exp":     time.Now().Add(pendingTokenTTL).Unix(),
	})
	return token.SignedString(pendingTokenKey())
}

// parsePendingTwoFactorToken returns the email and the token's unique id
func parsePendingTwoFactorToken(tokenString string) (email string, jti string, err error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return pendingTokenKey(), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil || !token.Valid {
		return "", "", errors.New("invalid pending token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["purpose"] != "2fa" {
		return "", "", errors.New("invalid pending token")
	}
	email, _ = claims["email"].(string)
	jti, _ = claims["jti"].(string)
	if email == "" || jti == "" {
		return "", "", errors.New("invalid pending token")
	}
	return email, jti, nil
}

// attemptTracker counts /2fa/verify attempts per pending token, in memory.
// Entries expire with their token, so the map stays small.
type attemptTracker struct {
	mu      sync.Mutex
	entries map[string]attemptEntry
}

type attemptEntry struct {
	count   int
	expires time.Time
}

var pendingAttempts = &attemptTracker{entries: make(map[string]attemptEntry)}

// allow records one attempt and reports whether the token may still be used
func (t *attemptTracker) allow(jti string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	for id, entry := range t.entries {
		if now.After(entry.expires) {
			delete(t.entries, id)
		}
	}

	entry, ok := t.entries[jti]
	if !ok {
		entry = attemptEntry{expires: now.Add(pendingTokenTTL)}
	}
	entry.count++
	t.entries[jti] = entry
	return entry.count <= maxTwoFactorAttempts
}

// burn stops a pending token from being used again once it has been exchanged
func (t *attemptTracker) burn(jti string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.entries[jti] = attemptEntry{count: maxTwoFactorAttempts, expires: time.Now().Add(pendingTokenTTL)}
}

// validCode checks a 6-digit code, accepting the previous and next 30s window for clock drift
func validCode(code string, secret string) bool {
	code = strings.ReplaceAll(strings.TrimSpace(code), " ", "")
	return secret != "" && totp.Validate(code, secret)
}

// loadTwoFactor reads the user's 2FA state
func loadTwoFactor(r *http.Request, dbPool *pgxpool.Pool, email string) (enabled bool, secret string, err error) {
	var storedSecret *string
	err = dbPool.QueryRow(r.Context(),
		`SELECT is_2fa_enabled, two_factor_secret FROM users WHERE email = $1 AND deleted_at IS NULL`,
		email,
	).Scan(&enabled, &storedSecret)
	if storedSecret != nil {
		secret = *storedSecret
	}
	return enabled, secret, err
}

// TwoFactorSetup generates a new secret and QR code. 2FA stays off until /2fa/enable confirms a code
func TwoFactorSetup(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed.", http.StatusMethodNotAllowed)
			return
		}

		email := r.Context().Value(UserEmailKey).(string)

		enabled, _, err := loadTwoFactor(r, dbPool, email)
		if err != nil {
			http.Error(w, "User not found.", http.StatusNotFound)
			return
		}
		if enabled {
			http.Error(w, "2FA is already enabled.", http.StatusConflict)
			return
		}

		key, err := totp.Generate(totp.GenerateOpts{
			Issuer:      twoFactorIssuer,
			AccountName: email,
		})
		if err != nil {
			http.Error(w, "Failed to generate 2FA secret.", http.StatusInternalServerError)
			return
		}

		// Calling setup again replaces the pending secret, so an abandoned QR code stops working
		_, err = dbPool.Exec(r.Context(),
			`UPDATE users SET two_factor_secret = $1 WHERE email = $2 AND is_2fa_enabled = false`,
			key.Secret(), email,
		)
		if err != nil {
			http.Error(w, "Failed to save 2FA secret.", http.StatusInternalServerError)
			return
		}

		// Render the QR code as a PNG data URL, so the frontend can put it straight in an <img>
		img, err := key.Image(256, 256)
		if err != nil {
			http.Error(w, "Failed to generate QR code.", http.StatusInternalServerError)
			return
		}
		var buf bytes.Buffer
		if err := png.Encode(&buf, img); err != nil {
			http.Error(w, "Failed to generate QR code.", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(TwoFactorSetupResponse{
			Secret:     key.Secret(),
			OTPAuthURL: key.URL(),
			QRCode:     "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes()),
		})
	}
}

// TwoFactorEnable turns 2FA on once the user proves their app produces valid codes
func TwoFactorEnable(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed.", http.StatusMethodNotAllowed)
			return
		}

		var req TwoFactorCodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		email := r.Context().Value(UserEmailKey).(string)

		enabled, secret, err := loadTwoFactor(r, dbPool, email)
		if err != nil {
			http.Error(w, "User not found.", http.StatusNotFound)
			return
		}
		if enabled {
			http.Error(w, "2FA is already enabled.", http.StatusConflict)
			return
		}
		if secret == "" {
			http.Error(w, "Start 2FA setup first.", http.StatusBadRequest)
			return
		}
		if !validCode(req.Code, secret) {
			http.Error(w, "Invalid 2FA code.", http.StatusUnauthorized)
			return
		}

		_, err = dbPool.Exec(r.Context(), `UPDATE users SET is_2fa_enabled = true WHERE email = $1`, email)
		if err != nil {
			http.Error(w, "Failed to enable 2FA.", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "2FA enabled."})
	}
}

// TwoFactorDisable turns 2FA off, requiring a current code so a stolen session can't remove it
func TwoFactorDisable(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed.", http.StatusMethodNotAllowed)
			return
		}

		var req TwoFactorCodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		email := r.Context().Value(UserEmailKey).(string)

		enabled, secret, err := loadTwoFactor(r, dbPool, email)
		if err != nil {
			http.Error(w, "User not found.", http.StatusNotFound)
			return
		}
		if !enabled {
			http.Error(w, "2FA is not enabled.", http.StatusBadRequest)
			return
		}
		if !validCode(req.Code, secret) {
			http.Error(w, "Invalid 2FA code.", http.StatusUnauthorized)
			return
		}

		_, err = dbPool.Exec(r.Context(),
			`UPDATE users SET is_2fa_enabled = false, two_factor_secret = NULL WHERE email = $1`,
			email,
		)
		if err != nil {
			http.Error(w, "Failed to disable 2FA.", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "2FA disabled."})
	}
}

// TwoFactorVerify exchanges a pending token and a valid code for a session token
func TwoFactorVerify(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed.", http.StatusMethodNotAllowed)
			return
		}

		var req TwoFactorVerifyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON.", http.StatusBadRequest)
			return
		}

		email, jti, err := parsePendingTwoFactorToken(req.TempToken)
		if err != nil {
			http.Error(w, "Login expired, please sign in again.", http.StatusUnauthorized)
			return
		}

		if !pendingAttempts.allow(jti) {
			http.Error(w, "Too many attempts, please sign in again.", http.StatusTooManyRequests)
			return
		}

		enabled, secret, err := loadTwoFactor(r, dbPool, email)
		if err != nil || !enabled || !validCode(req.Code, secret) {
			http.Error(w, "Invalid 2FA code.", http.StatusUnauthorized)
			return
		}

		tokenString, err := sessionToken(email)
		if err != nil {
			http.Error(w, "Failed to create token.", http.StatusInternalServerError)
			return
		}
		pendingAttempts.burn(jti)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
	}
}
