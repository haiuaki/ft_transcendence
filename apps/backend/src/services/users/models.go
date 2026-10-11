package users

import "time"

type UserProfile struct {
	Username              string    `json:"username"`
	Email                 string    `json:"email,omitempty"`
	AvatarURL             *string   `json:"avatar_url"`
	Status                string    `json:"status"`
	TotalMessagesSent     int       `json:"total_messages_sent"`
	CumulativeTimeSeconds int       `json:"cumulative_time_seconds"`
	CreatedAt             time.Time `json:"created_at"`
	TwoFactorEnabled      *bool     `json:"is_2fa_enabled,omitempty"` // Only set on the user's own profile
}

type UpdateProfileRequest struct {
	Username  *string `json:"username"`
	AvatarURL *string `json:"avatar_url"`
}
