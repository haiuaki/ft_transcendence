package sockets

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Client acts as an intermediary between the WebSocket connection and the Hub
type Client struct {
	hub *Hub

	// The underlying WebSocket connection
	conn *websocket.Conn

	// Buffered channel for outbound messages to this client
	send   chan []byte
	dbPool *pgxpool.Pool

	// Security tracking
	Email           string
	IsAuthenticated bool
}

// readPump reads incoming messages from the WebSocket connection and forwards them to the Hub
// It ensures that the connection is closed and the client is unregistered on exit
func (c *Client) readPump() {
	defer func() {
		// Unregister the user from the WebSocket Hub
		c.hub.unregister <- c

		// If the user's WiFi droppped, stand them up
		if c.IsAuthenticated && c.Email != "" {
			standUpSQL := `
				UPDATE channel_members
				SET status = 'LEFT'
				WHERE user_id = (SELECT id FROM users WHERE email = $1)
				AND status = 'ACTIVE'
			`
			// Use `context.Background()` for a quick background execution
			_, err := c.dbPool.Exec(context.Background(), standUpSQL, c.Email)
			if err != nil {
				log.Printf("Database error: Failed to remove ghost avatar for %s.", c.Email)
			} else {
				log.Printf("WebSocket closed. Avatar for %s automatically removed from room.", c.Email)
			}
		}

		// Server the TCP connection
		c.conn.Close()
	}()

	for {
		_, rawMessage, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		// Unmarshal the generice envelop first to see the kind of message it is
		var wsMsg WSMessage
		if err := json.Unmarshal(rawMessage, &wsMsg); err != nil {
			log.Println("Invalid JSON received.")
			continue
		}

		switch wsMsg.Type {
		case "auth":

			// SECURITY PRECAUTION: if already authenticated, ignore
			if c.IsAuthenticated {
				log.Println("Client tried to authenticate twice, ignoring.")
				continue
			}

			// User proving who they are
			var authData AuthPayload
			if err := json.Unmarshal(wsMsg.Payload, &authData); err != nil {
				continue
			}

			// Validate the token (same logic as middleware)
			secretKey := os.Getenv("JWT_SECRET")
			token, err := jwt.Parse(authData.Token, func(token *jwt.Token) (any, error) {
				return []byte(secretKey), nil
			})

			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					c.Email = claims["email"].(string)
					c.IsAuthenticated = true
					log.Println("Client authenticated successfully:", c.Email)
				}
			} else {
				log.Println("Invalid JWT token provided over WebSocket.")
			}
		case "chat":
			// Ignore message if not authenticated
			if !c.IsAuthenticated {
				log.Println("Unauthenticated user tried to send a message.")
				continue
			}

			// Parse the chat message and send to the Hub
			var chatData ChatMessagePayload
			if err := json.Unmarshal(wsMsg.Payload, &chatData); err != nil {
				continue
			}

			// Query the database to retrieve all active members in the specified room
			roomQuery := `
				SELECT u.email
				FROM users u
				JOIN channel_members cm ON u.id = cm.user_id
				WHERE cm.channel_id = $1 AND cm.status = 'ACTIVE'
			`

			rows, err := c.dbPool.Query(context.Background(), roomQuery, chatData.RoomID)
			if err != nil {
				log.Println("Database error retrieving active room members:", err)
				continue
			}

			var targetEmails []string
			isSenderInRoom := false

			// Build the roster list
			for rows.Next() {
				var email string
				if err := rows.Scan(&email); err == nil {
					targetEmails = append(targetEmails, email)

					// If the sender's mail is in the DB results, they're in the room
					if email == c.Email {
						isSenderInRoom = true
					}
				}
			}
			rows.Close()

			// Enforce spatial consistency: sender must be actively seating in the room
			if !isSenderInRoom {
				log.Printf("WebSocket security warning: Client %s attempted to broadcast to unjoined room %d.", c.Email, chatData.RoomID)
				continue
			}

			// Forward the payload to the Hub with the target roster
			c.hub.broadcast <- BroadcastMessage{
				TargetEmails: targetEmails,
				Payload:      rawMessage,
			}
		}
	}
}

// writePump writes outgoing messages from the Hub to the WebSocket connection
// It blocks until messages are available on the send channel
func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()

	for message := range c.send {
		c.conn.WriteMessage(websocket.TextMessage, message)
	}

	// If the range loop breaks, the send channel was closed by the Hub
	c.conn.WriteMessage(websocket.CloseMessage, []byte{})
}
