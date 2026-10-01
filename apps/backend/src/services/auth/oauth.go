package auth

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/oauth2"
)

type ProviderConfig struct {
	OAuth      *oauth2.Config
	ProfileURL string // Custom profile URL
	Extract    func(rawData map[string]any) (email, username, avatarURL string)
}

var oauthProviders = map[string]ProviderConfig{
	"google": {
		OAuth: &oauth2.Config{
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("FRONTEND_URL") + "/api/oauth/google/callback",
			Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://accounts.google.com/o/oauth2/auth",
				TokenURL: "https://oauth2.googleapis.com/token",
			},
		},

		ProfileURL: "https://www.googleapis.com/oauth2/v2/userinfo",

		Extract: func(rawData map[string]any) (email, username, avatarURL string) {
			if val, ok := rawData["email"].(string); ok {
				email = val
			}
			if val, ok := rawData["name"].(string); ok {
				username = val
			}
			if val, ok := rawData["picture"].(string); ok {
				avatarURL = val
			}
			return
		},
	},

	"github": {
		OAuth: &oauth2.Config{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("FRONTEND_URL") + "/api/oauth/github/callback",
			Scopes:       []string{"read:user", "user:email"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://github.com/login/oauth/authorize",
				TokenURL: "https://github.com/login/oauth/access_token",
			},
		},

		ProfileURL: "https://api.github.com/user",

		Extract: func(rawData map[string]any) (email, username, avatarURL string) {
			if val, ok := rawData["login"].(string); ok {
				username = val
			}

			// GitHub users can hide their email. We use a fallback if it's missing
			if val, ok := rawData["email"].(string); ok {
				email = val
			} else {
				email = username + "@users.noreply.github.com"
			}

			if val, ok := rawData["avatar_url"].(string); ok {
				avatarURL = val
			}
			return
		},
	},

	"42": {
		OAuth: &oauth2.Config{
			ClientID:     os.Getenv("FT_CLIENT_ID"),
			ClientSecret: os.Getenv("FT_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("FRONTEND_URL") + "/api/oauth/42/callback",
			Scopes:       []string{"public"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://api.intra.42.fr/oauth/authorize",
				TokenURL: "https://api.intra.42.fr/oauth/token",
			},
		},

		ProfileURL: "https://api.intra.42.fr/v2/me",

		Extract: func(rawData map[string]any) (email, username, avatarURL string) {
			if val, ok := rawData["email"].(string); ok {
				email = val
			}

			if val, ok := rawData["login"].(string); ok {
				username = val
			}

			if imageObj, ok := rawData["image"].(map[string]any); ok {
				if link, ok := imageObj["link"].(string); ok {
					avatarURL = link
				}
			}
			return
		},
	},
}

func OAuthLogin() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Grab the provider name from the URL
		providerName := r.PathValue("provider")

		// Look up said `providerName` in the map
		config, exists := oauthProviders[providerName]
		if !exists {
			http.Error(w, "Unsupported OAuth provider.", http.StatusBadRequest)
			return
		}

		// Security measure to prevent Cross-Site Request Forgery (CSRF)
		// Generate a truly random string
		stateBytes := make([]byte, 16)
		rand.Read(stateBytes)
		oauthStateString := hex.EncodeToString(stateBytes)

		// Save it securely inside the user's browser via an HttpOnly cookie
		stateCookie := http.Cookie{
			Name:     "oauth_state",
			Value:    oauthStateString,
			Expires:  time.Now().Add(10 * time.Minute),
			HttpOnly: true,
			Path:     "/",
		}
		http.SetCookie(w, &stateCookie)

		// Generate the login URL for the provider using our random string
		url := config.OAuth.AuthCodeURL(oauthStateString)
		http.Redirect(w, r, url, http.StatusTemporaryRedirect)
	}
}

func OAuthCallback(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Helper function to bounce any errors back to the frontend homepage
		failAndRedirect := func() {
			http.Redirect(w, r, os.Getenv("FRONTEND_URL")+"?error=oauth_failed", http.StatusTemporaryRedirect)
		}

		// Handle "Access Denied" (user clicked 'Cancel' on the consent screen)
		if r.FormValue("error") != "" {
			failAndRedirect()
			return
		}

		// Grab the provider configuration
		providerName := r.PathValue("provider")
		config, exists := oauthProviders[providerName]
		if !exists {
			failAndRedirect()
			return
		}

		// Verify state string against our secure HttpOnly cookie
		stateCookie, err := r.Cookie("oauth_state")
		if err != nil || r.FormValue("state") != stateCookie.Value {
			// They either don't have the cookie, or the string doesn't match (hacker alert)
			failAndRedirect()
			return
		}

		// Security: Delete the cookie now that it's verified, so it can't be reused
		clearCookie := http.Cookie{
			Name:     "oauth_state",
			Value:    "",
			Expires:  time.Unix(0, 0),
			HttpOnly: true,
			Path:     "/",
		}
		http.SetCookie(w, &clearCookie)

		// Exchange temporary URL 'code' for an Official Access Token
		code := r.FormValue("code")
		token, err := config.OAuth.Exchange(r.Context(), code)
		if err != nil {
			failAndRedirect()
			return
		}

		// Use Access Token to fetch user's profile
		client := config.OAuth.Client(r.Context(), token)
		resp, err := client.Get(config.ProfileURL)
		if err != nil {
			failAndRedirect()
			return
		}
		defer resp.Body.Close()

		var rawData map[string]any
		importErr := json.NewDecoder(resp.Body).Decode(&rawData)
		if importErr != nil {
			failAndRedirect()
			return
		}

		// Extract the data using the provider's specific extraction function
		email, username, avatarURL := config.Extract(rawData)

		// Database Upsert (check if exists, if not create)
		var userID string
		checkQuery := `SELECT id FROM users WHERE email = $1`
		err = dbPool.QueryRow(r.Context(), checkQuery, email).Scan(&userID)
		if err != nil {
			// Email doesn't exist, brand new user

			// USERNAME RESOLVER: ensure username is unique before insert
			uniqueUsername := username
			counter := 1
			for {
				var existingID string
				usernameCheck := `SELECT id FROM users WHERE LOWER(username) = LOWER($1)`
				err := dbPool.QueryRow(r.Context(), usernameCheck, uniqueUsername).Scan(&existingID)
				if err != nil {
					// No row found: Username is available, break the loop
					break
				}

				// It is taken, append a number (e.g., johndoe1, johndoe2..) and loop
				uniqueUsername = fmt.Sprintf("%s%d", username, counter)
				counter++
			}

			// Safely insert the `uniqueUsername`
			insertQuery := `
				INSERT INTO users (email, username, avatar_url, is_verified)
				VALUES ($1, $2, $3, true)
				RETURNING id
			`
			err = dbPool.QueryRow(r.Context(), insertQuery, email, uniqueUsername, avatarURL).Scan(&userID)
			if err != nil {
				failAndRedirect()
				return
			}
		}

		// Generate JWT Token
		secretKey := os.Getenv("JWT_SECRET")
		jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"email": email,
			"exp":   time.Now().Add(time.Hour * 24).Unix(),
		})

		tokenString, err := jwtToken.SignedString([]byte(secretKey))
		if err != nil {
			failAndRedirect()
			return
		}

		// Redirect to frontend with the secure token attached
		frontendURL := os.Getenv("FRONTEND_URL") + "/oauth/callback?token=" + tokenString
		http.Redirect(w, r, frontendURL, http.StatusTemporaryRedirect)
	}
}
