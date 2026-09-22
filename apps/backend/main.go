package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/joho/godotenv"

	"github.com/haiuaki/ft_transcendence/src/database"
	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

func main() {
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Println("No `.env` file found, relying on system environment variables.")
	}

	dbPool := database.Connect()
	defer dbPool.Close()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Auth Sandbox is running.")
	})

	http.HandleFunc("/signup", auth.Signup(dbPool))
	http.HandleFunc("/login", auth.Login(dbPool))

	// Protected Route
	http.HandleFunc("/dashboard", auth.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)
		welcomeMessage := fmt.Sprintf("Welcome to your dashboard, %s.", email)
		w.Write([]byte(welcomeMessage))
	}))

	fmt.Println("Server starting on http://localhost:8080..")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
