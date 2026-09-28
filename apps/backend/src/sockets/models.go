package sockets

import "encoding/json"

// WSMessage represents the standard JSON envelope for all inbound
// and outbound WebSocket communication
type WSMessage struct {
	// Type defines the message category (e.g., "auth", "chat")
	Type string `json:"type"`

	// Payload contains the unparsed JSON data, which is decoded based on the Type
	Payload json.RawMessage `json:"payload"`
}

// AuthPayload represents the expected data structure when the WSMessage Type is "auth"
type AuthPayload struct {
	Token string `json:"token"`
}

// ChatMessagePayload represents the expected data structure when the WSMessage Type is "chat"
type ChatMessagePayload struct {
	RoomID  int    `json:"room_id"`
	Message string `json:"message"`
}

// BroadcastMessage is used internally to route payloads to specific target emails.
type BroadcastMessage struct {
	TargetEmails []string
	Payload      []byte
}
