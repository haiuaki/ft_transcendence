package auth

import (
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/oauth2"
)

var oauthProviders = map[string]*oauth2.Config{
	"42": {
		ClientID:     os.Getenv("FT_CLIENT_ID"),
		ClientSecret: os.Getenv("FT_CLIENT_SECRET"),
		RedirectURL:  "http://localhost:3000/api/42/callback",
		Scopes:       []string{"public"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://api.intra.42.fr/oauth/authorize",
			TokenURL: "https://api.intra.42.fr/oauth/token",
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
		url := config.AuthCodeURL(oauthStateString)
		http.Redirect(w, r, url, http.StatusTemporaryRedirect)
	}
}

func OAuthCallback(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}
