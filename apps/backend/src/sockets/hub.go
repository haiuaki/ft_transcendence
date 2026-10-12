package sockets

import (
	"context"
	"encoding/json"
	"log"
	"slices"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Time allowed for a single status write, so a slow DB can't stall the Hub
const statusWriteTimeout = 2 * time.Second

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

// setOnlineStatus runs synchronously inside the Hub loop so status writes
// are applied in the same order as the connect/disconnect events
func setOnlineStatus(dbPool *pgxpool.Pool, email string, status string) {
	query := `UPDATE users SET status = $1 WHERE email = $2`

	ctx, cancel := context.WithTimeout(context.Background(), statusWriteTimeout)
	defer cancel()

	_, err := dbPool.Exec(ctx, query, status, email)
	if err != nil {
		log.Printf("Error updating status for %s to %s: %v\n", email, status, err)
		return
	}
}

// resetOnlineStatuses marks everyone OFFLINE, since connection counts
// only live in memory and are lost when the backend restarts
func resetOnlineStatuses(dbPool *pgxpool.Pool) {
	ctx, cancel := context.WithTimeout(context.Background(), statusWriteTimeout)
	defer cancel()

	_, err := dbPool.Exec(ctx, `UPDATE users SET status = 'OFFLINE' WHERE status = 'ONLINE'`)
	if err != nil {
		log.Println("Error resetting online statuses:", err)
	}
}

// SendTo wraps the payload in a WSMessage envelope and pushes it to every
// connected tab of the target users, so HTTP handlers can notify them live
func (h *Hub) SendTo(targetEmails []string, msgType string, payload any) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshalling %s payload: %v\n", msgType, err)
		return
	}
	envelope, _ := json.Marshal(WSMessage{Type: msgType, Payload: payloadBytes})

	h.broadcast <- BroadcastMessage{
		TargetEmails: targetEmails,
		Payload:      envelope,
	}
}

// removeClient drops a client from the Hub and marks its user OFFLINE
// once their last authenticated connection is gone
func (h *Hub) removeClient(client *Client) {
	if _, ok := h.clients[client]; !ok {
		return
	}
	delete(h.clients, client)
	close(client.send)

	// Substract a tab, if 0 left, they're OFFLINE
	if client.IsAuthenticated {
		h.activeUsers[client.Email]--
		if h.activeUsers[client.Email] <= 0 {
			delete(h.activeUsers, client.Email)
			setOnlineStatus(h.dbPool, client.Email, "OFFLINE")
		}
	}
}

// Run starts the core event loop for the Hub to process client registration,
// deregistration, and message broadcasting
func (h *Hub) Run() {
	// Runs before the loop, so no client can register until it's done
	resetOnlineStatuses(h.dbPool)

	for {
		select {
		case client := <-h.register:
			h.clients[client] = true

		case client := <-h.authenticate:
			h.activeUsers[client.Email]++
			if h.activeUsers[client.Email] == 1 {
				setOnlineStatus(h.dbPool, client.Email, "ONLINE")
			}

		case client := <-h.unregister:
			h.removeClient(client)

		case message := <-h.broadcast:
			for client := range h.clients {
				if slices.Contains(message.TargetEmails, client.Email) {
					select {
					case client.send <- message.Payload:
					default:
						// Client is too slow, drop it like a disconnect
						h.removeClient(client)
					}
				}
			}
		}
	}
}
