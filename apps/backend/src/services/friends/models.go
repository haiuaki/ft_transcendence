package friends

// Notifier pushes live events to connected users (implemented by sockets.Hub)
type Notifier interface {
	SendTo(targetEmails []string, msgType string, payload any)
}

type FriendRequest struct {
	FriendUsername string `json:"friend_username"`
}

type FriendResponse struct {
	Username  string  `json:"username"`
	AvatarURL *string `json:"avatar_url"`
	Status    string  `json:"status"`
}
