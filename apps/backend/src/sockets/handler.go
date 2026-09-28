package sockets

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
)

// upgrader transforms the standard HTTP connection into a WebSocket connection
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	// CheckOrigin prevents CORS issues during development
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// ServeWs handles the incoming HTTP request and upgrades it to a WebSocket
func ServeWs(hub *Hub, dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("WebSocket Upgraade Error:", err)
			return
		}

		// Create and initialize the client for this user
		client := &Client{
			hub:    hub,
			conn:   conn,
			send:   make(chan []byte, 256), // Created buffered channel for outbound messages
			dbPool: dbPool,
		}

		// Register the client with the central hub
		client.hub.register <- client

		// Start the two pumps in independent background Goroutines
		// Allows the HTTP handler to finish, while the pumps run infinitely in the background
		go client.writePump()
		go client.readPump()
	}
}
