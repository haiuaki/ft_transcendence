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

// What the frontend sends when sitting down in a room
type JoinRoomRequest struct {
	ChannelID int    `json:"channel_id"`
	Password  string `json:"password,omitempty"`
}

// What the frontend sends when standing up from a desk
type LeaveRoomRequest struct {
	ChannelID int `json:"channel_id"`
}

// What the frontend sends when deleting a room manually
type DeleteRoomRequest struct {
	ChannelID int `json:"channel_id"`
}

type MessageResponse struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}
