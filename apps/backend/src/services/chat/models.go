package chat

import "time"

// What the frontend sends when creating a room
type CreateRoomRequest struct {
	Name     string `json:"name"`
	Type     string `json:"type"` // "PUBLIC", "PRIVATE" or "DIRECT"
	Password string `json:"password,omitempty"`
	Model    string `json:"model"` // "CLUSTER"
}

// What the frontend sends when editing a room
type UpdateRoomRequest struct {
	ChannelID int    `json:"channel_id"`
	Name      string `json:"name,omitempty"`
	Type      string `json:"type,omitempty"` // "PUBLIC" or "PRIVATE"
	Password  string `json:"password,omitempty"`
}

// What we send back to the frontend
type RoomResponse struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	Type          string    `json:"type"`
	ModelType     string    `json:"model_type"`
	MaxCapacity   int       `json:"max_capacity"`
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

// What we send back when the frontend fetches chat history
type MessageResponse struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// What the frontend sends to start a DM
type StartDMRequest struct {
	TargetUsername string `json:"target_username"`
}

// What we send back to the frontend when a DM is started
type DMResponse struct {
	ChannelID int    `json:"channel_id"`
	Message   string `json:"message"`
}
