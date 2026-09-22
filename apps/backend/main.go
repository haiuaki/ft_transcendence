package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/joho/godotenv"

	"github.com/haiuaki/ft_transcendence/src/database"
	"github.com/haiuaki/ft_transcendence/src/services/auth"
	"github.com/haiuaki/ft_transcendence/src/services/users"
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

	// Protected Routes
	http.HandleFunc("/dashboard", auth.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)
		welcomeMessage := fmt.Sprintf("Welcome to your dashboard, %s.", email)
		w.Write([]byte(welcomeMessage))
	}))

	// Route to View Profile (GET)
	http.HandleFunc("/profile", auth.RequireAuth(users.GetProfile(dbPool)))
	// Route to Edit Profile (PUT)
	http.HandleFunc("/profile/edit", auth.RequireAuth(users.UpdateProfile(dbPool)))
	// Route to Delete Profile (DELETE)
	http.HandleFunc("/profile/delete", auth.RequireAuth(users.DeleteProfile(dbPool)))

	fmt.Println("Server starting on http://localhost:8080..")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
