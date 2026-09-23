package auth

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type ContextKey string

const UserEmailKey ContextKey = "userEmail"

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized: Missing token.", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		secretKey := os.Getenv("JWT_SECRET")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			return []byte(secretKey), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized: Invalid or expired token.", http.StatusUnauthorized)
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			email := claims["email"].(string)

			ctx := context.WithValue(r.Context(), UserEmailKey, email)
			next(w, r.WithContext(ctx))
			return
		}

		http.Error(w, "Unauthorized: Failed to read token data.", http.StatusUnauthorized)
	}
}
