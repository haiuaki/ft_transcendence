package sockets

import (
	"encoding/json"
	"log"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

// Client acts as an intermediary between the WebSocket connection and the Hub
type Client struct {
	hub *Hub

	// The underlying WebSocket connection
	conn *websocket.Conn

	// Buffered channel for outbound messages to this client
	send chan []byte

	// Security tracking
	Email           string
	IsAuthenticated bool
}

// readPump reads incoming messages from the WebSocket connection and forwards them to the Hub
// It ensures that the connection is closed and the client is unregistered on exit
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
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
			if err := json.Unmarshal(wsMsg.Payload, &chatData); err == nil {
				log.Printf("%s sent a message to Room %d\n", c.Email, chatData.RoomID)
				c.hub.broadcast <- rawMessage
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
