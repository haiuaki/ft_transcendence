package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/joho/godotenv"

	"github.com/haiuaki/ft_transcendence/src/database"
	"github.com/haiuaki/ft_transcendence/src/services/auth"
	"github.com/haiuaki/ft_transcendence/src/services/friends"
	"github.com/haiuaki/ft_transcendence/src/services/users"
)

func main() {
	// Load environment variables
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Println("No `.env` file found, relying on system environment variables.")
	}

	// Connect to database
	dbPool := database.Connect()
	defer dbPool.Close()

	// --- HOME PAGE ------------------------------------------------------- //
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Auth Sandbox is running.")
	})

	// --- AUTHENTICATION -------------------------------------------------- //
	// POST: Create an account
	http.HandleFunc("/signup", auth.Signup(dbPool))

	// POST: Log in to account
	http.HandleFunc("/login", auth.Login(dbPool))

	// --- PROFILE --------------------------------------------------------- //
	// GET: View user profile
	http.HandleFunc("/profile", auth.RequireAuth(users.GetProfile(dbPool)))

	// PUT: Edit user informations
	http.HandleFunc("/profile/edit", auth.RequireAuth(users.UpdateProfile(dbPool)))

	// DELETE: Delete account
	http.HandleFunc("/profile/delete", auth.RequireAuth(users.DeleteProfile(dbPool)))

	// --- FRIENDS --------------------------------------------------------- //
	// GET: View my accepted friends
	http.HandleFunc("/friends", auth.RequireAuth(friends.GetFriends(dbPool)))

	// POST: Send a friend request
	http.HandleFunc("/friends/add", auth.RequireAuth(friends.AddFriend(dbPool)))

	// DELETE: Remove a friend
	http.HandleFunc("/friends/remove", auth.RequireAuth(friends.RemoveFriend(dbPool)))

	// --- FRIEND REQUESTS ------------------------------------------------- //
	// GET: View pending friend requests
	http.HandleFunc("/friends/requests", auth.RequireAuth(friends.GetFriendRequests(dbPool)))

	// PUT: Accept a pending request
	http.HandleFunc("/friends/requests/accept", auth.RequireAuth(friends.AcceptFriend(dbPool)))

	// DELETE: Reject a pending request
	http.HandleFunc("/friends/requests/deny", auth.RequireAuth(friends.DenyFriend(dbPool)))

	fmt.Println("Server starting on http://localhost:8080..")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
