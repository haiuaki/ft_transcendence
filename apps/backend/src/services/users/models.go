package users

import "time"

type UserProfile struct {
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	AvatarURL *string   `json:"avatar_url"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type UpdateProfileRequest struct {
	Username  *string `json:"username"`
	AvatarURL *string `json:"avatar_url"`
}
