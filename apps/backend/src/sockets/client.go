package sockets

import (
	"context"
	"encoding/json"
	"html"
	"log"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than `pongWait`
	pingPeriod = (pongWait * 9) / 10
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
				WITH updated_member AS (
					UPDATE channel_members
					SET status = 'LEFT'
					WHERE user_id = (SELECT id FROM users WHERE email = $1)
					AND status = 'ACTIVE'
					AND channel_id IN (SELECT id FROM channels WHERE type != 'DIRECT')
					RETURNING user_id, joined_at
				),
				aggregated_time AS (
					SELECT user_id, SUM(EXTRACT(EPOCH FROM (NOW() - joined_at))::INTEGER) as total_added_time
					FROM updated_member
					GROUP BY user_id
				),
				updated_user AS (
					UPDATE users
					SET cumulative_time_seconds = cumulative_time_seconds + at.total_added_time
					FROM aggregated_time at
					WHERE users.id = at.user_id
					RETURNING users.id, at.total_added_time
				)
				INSERT INTO daily_user_analytics (user_id, date, time_spent_seconds)
				SELECT id, CURRENT_DATE, total_added_time FROM updated_user
				ON CONFLICT (user_id, date)
				DO UPDATE SET time_spent_seconds = daily_user_analytics.time_spent_seconds + EXCLUDED.time_spent_seconds
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

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

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

			if !c.IsAuthenticated && err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					c.Email = claims["email"].(string)
					c.IsAuthenticated = true
					log.Println("Client authenticated successfully:", c.Email)
					c.hub.authenticate <- c
				}
			} else if !c.IsAuthenticated {
				log.Println("Invalid JWT token provided over WebSocket.")
			}
		case "chat":
			// Ignore message if not authenticated
			if !c.IsAuthenticated {
				log.Println("Unauthenticated user tried to send a message.")
				c.sendChatError(0, "unauthenticated", "Not authenticated yet, try again.")
				continue
			}

			// Parse the chat message and send to the Hub
			var chatData ChatMessagePayload
			if err := json.Unmarshal(wsMsg.Payload, &chatData); err != nil {
				c.sendChatError(0, "invalid_payload", "Invalid message.")
				continue
			}

			// Strip invisible leading and trailing spaces
			chatData.Message = strings.TrimSpace(chatData.Message)

			// Prevent malicious scripts from filling up the database
			if len(chatData.Message) == 0 || len(chatData.Message) > 500 {
				log.Printf("Security: Message from %s too long or empty.", c.Email)
				c.sendChatError(chatData.RoomID, "invalid_length", "Message must be between 1 and 500 characters.")
				continue
			}

			// Sanitize the message, convert <script> into harmless text
			chatData.Message = html.EscapeString(chatData.Message)

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
				c.sendChatError(chatData.RoomID, "server_error", "Could not send the message.")
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
				c.sendChatError(chatData.RoomID, "not_in_room", "You are not in this room anymore.")
				continue
			}

			// Save to `messages` table and update analytics
			// Only room messages count towards the stats, DMs are saved but not counted
			insertSQL := `
				WITH new_message AS (
					INSERT INTO messages (channel_id, sender_id, content)
					VALUES ($1, (SELECT id FROM users WHERE email = $2), $3)
					RETURNING id, sender_id, content, created_at
				),
				updated_user AS (
					UPDATE users
					SET total_messages_sent = total_messages_sent + 1
					FROM new_message
					WHERE users.id = new_message.sender_id
					AND EXISTS (SELECT 1 FROM channels WHERE id = $1 AND type != 'DIRECT')
					RETURNING users.id
				),
				daily_update AS (
					INSERT INTO daily_user_analytics (user_id, date, messages_sent)
					SELECT id, CURRENT_DATE, 1 FROM updated_user
					ON CONFLICT (user_id, date)
					DO UPDATE SET messages_sent = daily_user_analytics.messages_sent + 1
				)
				SELECT nm.id, u.username, nm.content, nm.created_at
				FROM new_message nm
				JOIN users u ON u.id = nm.sender_id
			`

			var outMsg OutboundChatMessage
			outMsg.RoomID = chatData.RoomID
			var createdAt time.Time

			err = c.dbPool.QueryRow(context.Background(), insertSQL, chatData.RoomID, c.Email, chatData.Message).Scan(
				&outMsg.ID, &outMsg.Username, &outMsg.Content, &createdAt,
			)
			if err != nil {
				log.Println("Database error: Failed to save chat history:", err)
				c.sendChatError(chatData.RoomID, "server_error", "Could not send the message.")
				continue
			}

			outMsg.CreatedAt = createdAt.Format(time.RFC3339)

			safePayloadBytes, _ := json.Marshal(outMsg)
			safeEnvelope := WSMessage{
				Type:    "chat",
				Payload: safePayloadBytes,
			}
			safeRawMessage, _ := json.Marshal(safeEnvelope)

			// Forward the payload to the Hub with the target roster
			c.hub.broadcast <- BroadcastMessage{
				TargetEmails: targetEmails,
				Payload:      safeRawMessage,
			}
		}
	}
}

func (c *Client) sendChatError(roomID int, code string, message string) {
	payload, _ := json.Marshal(map[string]any{"room_id": roomID, "code": code, "message": message})
	raw, _ := json.Marshal(WSMessage{Type: "chat_error", Payload: payload})
	select {
	case c.send <- raw:
	default:
		log.Printf("Send buffer full, could not report chat error to %s.", c.Email)
	}
}

// writePump writes outgoing messages from the Hub to the WebSocket connection
// It blocks until messages are available on the send channel
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.WriteMessage(websocket.TextMessage, message)

		case <-ticker.C:
			// 54-second timer went off, send a ping
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return // If we can't send a ping, their WiFi is dead. Break the loop
			}
		}
	}
}
