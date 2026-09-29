package sockets

import (
	"context"
	"log"
	"slices"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Hub maintains the set of active clients and broadcasts messages to them
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Authenticate requests from clients (after they send JWT)
	authenticate chan *Client

	// Inbound messages from the clients mapped to specific target emails
	broadcast chan BroadcastMessage

	// Tracks how many tabs a user has open: map[email]count
	activeUsers map[string]int
	dbPool      *pgxpool.Pool // For the Hub to run SQL
}

// NewHub initializes and returns a new Hub instance
func NewHub(dbPool *pgxpool.Pool) *Hub {
	return &Hub{
		clients:      make(map[*Client]bool),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		authenticate: make(chan *Client),
		broadcast:    make(chan BroadcastMessage),
		activeUsers:  make(map[string]int),
		dbPool:       dbPool,
	}
}

func setOnlineStatus(dbPool *pgxpool.Pool, email string, status string) {
	query := `UPDATE users SET status = $1 WHERE email = $2`

	_, err := dbPool.Exec(context.Background(), query, status, email)
	if err != nil {
		log.Printf("Error updating status for %s to %s: %v\n", email, status, err)
		return
	}
}

// Run starts the core event loop for the Hub to process client registration,
// deregistration, and message broadcasting
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true

		case client := <-h.authenticate:
			h.activeUsers[client.Email]++
			if h.activeUsers[client.Email] == 1 {
				go setOnlineStatus(h.dbPool, client.Email, "ONLINE")
			}

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)

				// Substract a tab, if 0 left, they're OFFLINE
				if client.IsAuthenticated {
					h.activeUsers[client.Email]--
					if h.activeUsers[client.Email] <= 0 {
						delete(h.activeUsers, client.Email)
						go setOnlineStatus(h.dbPool, client.Email, "OFFLINE")
					}
				}
			}

		case message := <-h.broadcast:
			for client := range h.clients {
				if slices.Contains(message.TargetEmails, client.Email) {
					select {
					case client.send <- message.Payload:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		}
	}
}
