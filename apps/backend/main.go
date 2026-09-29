package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"github.com/haiuaki/ft_transcendence/src/database"
	"github.com/haiuaki/ft_transcendence/src/services/auth"
	"github.com/haiuaki/ft_transcendence/src/services/chat"
	"github.com/haiuaki/ft_transcendence/src/services/friends"
	"github.com/haiuaki/ft_transcendence/src/services/users"
	"github.com/haiuaki/ft_transcendence/src/sockets"
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

	// --- BACKGROUND WORKERS ---------------------------------------------- //
	// Deletes empty rooms older than 24 hours with 0 Active Members
	chat.StartRoomGarbageCollector(dbPool)

	// --- HOME PAGE ------------------------------------------------------- //
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Auth Sandbox is running.")
	})

	// --- AUTHENTICATION -------------------------------------------------- //
	// POST: Create an account
	http.HandleFunc("/signup", auth.Signup(dbPool))

	// POST: Verify account
	http.HandleFunc("/verify", auth.Verify(dbPool))

	// POST: Log in to account
	http.HandleFunc("/login", auth.Login(dbPool))

	// --- PROFILE --------------------------------------------------------- //
	// GET: View user profile
	http.HandleFunc("/profile", auth.RequireAuth(users.GetProfile(dbPool)))

	// GET: View someone else's public profile
	http.HandleFunc("/users/{username}", auth.RequireAuth(users.GetPublicProfile(dbPool)))

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

	// --- DIRECT MESSAGES ------------------------------------------------- //
	// POST: Start or open a Private Message
	http.HandleFunc("/dms/start", auth.RequireAuth(chat.StartDM(dbPool)))

	// GET: Fetch chat history for a DM
	http.HandleFunc("/dms/messages", auth.RequireAuth(chat.GetRoomMessages(dbPool)))

	// --- ROOMS ----------------------------------------------------------- //
	// GET: List all available 3D rooms
	http.HandleFunc("/rooms", auth.RequireAuth(chat.GetRooms(dbPool)))

	// POST: Create a new 3D Room
	http.HandleFunc("/rooms/create", auth.RequireAuth(chat.CreateRoom(dbPool)))

	// POST: Join a room
	http.HandleFunc("/rooms/join", auth.RequireAuth(chat.JoinRoom(dbPool)))

	// POST: Leave a room
	http.HandleFunc("/rooms/leave", auth.RequireAuth(chat.LeaveRoom(dbPool)))

	// DELETE: Delete a 3D room (Owner only)
	http.HandleFunc("/rooms/delete", auth.RequireAuth(chat.DeleteRoom(dbPool)))

	// GET: Fetch chat history for a room
	http.HandleFunc("/rooms/messages", auth.RequireAuth(chat.GetRoomMessages(dbPool)))

	// --- WEBSOCKET CENTRAL HUB -------------------------------------------- //
	hub := sockets.NewHub()
	go hub.Run() // Run the hub in a background Goroutine
	http.HandleFunc("/ws", sockets.ServeWs(hub, dbPool))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on http://localhost:%s..\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
