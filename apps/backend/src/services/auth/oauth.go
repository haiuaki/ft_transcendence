package auth

import (
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
			email = rawData["email"].(string)
			username = rawData["login"].(string)

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
		oauthStateString := "random-secure-state-string"

		// Generate the login URL for the provider
		url := config.OAuth.AuthCodeURL(oauthStateString)
		http.Redirect(w, r, url, http.StatusTemporaryRedirect)
	}
}

func OAuthCallback(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Grab the provider configuration
		providerName := r.PathValue("provider")
		config, exists := oauthProviders[providerName]
		if !exists {
			http.Error(w, "Unsupported OAuth provider.", http.StatusBadRequest)
			return
		}

		// Verify state string matches
		if r.FormValue("state") != "random-secure-state-string" {
			http.Error(w, "State string does not match.", http.StatusBadRequest)
			return
		}

		// Exchange temporary URL 'code' for an Official Access Token
		code := r.FormValue("code")
		token, err := config.OAuth.Exchange(r.Context(), code)
		if err != nil {
			http.Error(w, "Failed to exchange token.", http.StatusInternalServerError)
			return
		}

		// Use Access Token to fetch user's profile
		client := config.OAuth.Client(r.Context(), token)
		resp, err := client.Get(config.ProfileURL)
		if err != nil {
			http.Error(w, "Failed to fetch user informations from provider.", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		var rawData map[string]any
		importErr := json.NewDecoder(resp.Body).Decode(&rawData)
		if importErr != nil {
			http.Error(w, "Failed to parse profile data.", http.StatusInternalServerError)
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

			// USERNAME RESOLVER: ensure usernamee is unique before insert
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
				http.Error(w, "Failed to create OAuth user in database.", http.StatusInternalServerError)
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
			http.Error(w, "Failed to sign token.", http.StatusInternalServerError)
			return
		}

		// Redirect to frontend with the secure token attached
		frontendURL := os.Getenv("FRONTEND_URL") + "/oauth/callback?token=" + tokenString
		http.Redirect(w, r, frontendURL, http.StatusTemporaryRedirect)
	}
}
