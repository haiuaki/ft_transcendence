package sockets

import (
	"log"

	"github.com/gorilla/websocket"
)

// Client acts as an intermediary between the WebSocket connection and the Hub
type Client struct {
	hub *Hub

	// The underlying WebSocket connection
	conn *websocket.Conn

	// Buffered channel for outbound messages to this client
	send chan []byte
}

// readPump reads incoming messages from the WebSocket connection and forwards them to the Hub
// It ensures that the connection is closed and the client is unregistered on exit
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket Read Error: %v", err)
			}
			break
		}

		c.hub.broadcast <- message
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
