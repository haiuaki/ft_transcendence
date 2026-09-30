package auth

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/oauth2"
)

type ProviderConfig struct {
	OAuth      *oauth2.Config
	ProfileURL string
}

var oauthProviders = map[string]ProviderConfig{
	"42": {
		OAuth: &oauth2.Config{
			ClientID:     os.Getenv("FT_CLIENT_ID"),
			ClientSecret: os.Getenv("FT_CLIENT_SECRET"),
			RedirectURL:  "http://localhost:3000/api/42/callback",
			Scopes:       []string{"public"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://api.intra.42.fr/oauth/authorize",
				TokenURL: "https://api.intra.42.fr/oauth/token",
			},
		},

		ProfileURL: "https://api.intra.42.fr/v2/me",
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

		// Copy the JSON response into the browser (temporary)
		w.Header().Set("Content-Type", "application/json")
		var rawData map[string]any

		importErr := json.NewDecoder(resp.Body).Decode(&rawData)
		if importErr == nil {
			json.NewEncoder(w).Encode(rawData)
		}
	}
}
