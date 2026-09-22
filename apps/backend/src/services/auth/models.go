package auth

import "time"

type Credentials struct {
	// Must be capitalized (public) for the Decoder to see them
	// The struct tag `json:"..."` tells the Decoder which lowercase JSON key to map this to
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserProfile struct {
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	AvatarURL *string   `json:"avatar_url"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type UpdateProfileRequest struct {
	Username string `json:"username"`
}
