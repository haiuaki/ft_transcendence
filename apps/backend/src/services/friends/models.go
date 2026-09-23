package friends

type FriendRequest struct {
	FriendUsername string `json:"friend_username"`
}

type FriendResponse struct {
	Username  string  `json:"username"`
	AvatarURL *string `json:"avatar_url"`
	Status    string  `json:"status"`
}
