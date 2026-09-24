package chat

import "time"

// What the frontend sends when creating a room
type CreateRoomRequest struct {
	Name     string `json:"name"`
	Type     string `json:"type"` // "PUBLIC" or "PRIVATE"
	Password string `json:"password,omitempty"`
}

// What we send back to the frontend
type RoomResponse struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	Type          string    `json:"type"`
	OwnerID       *string   `json:"owner_id,omitempty"`
	ActiveMembers int       `json:"active_members"`
	CreatedAt     time.Time `json:"created_at"`
}

// What the frontend send when sitting down in a room
type JoinRoomRequest struct {
	ChannelID int    `json:"channel_id"`
	Password  string `json:"password,omitempty"`
}

type LeaveRoomRequest struct {
	ChannelID int `json:"channel_id"`
}
