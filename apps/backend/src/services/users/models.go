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
	TwoFactorEnabled      *bool     `json:"is_2fa_enabled,omitempty"`    // Only set on the user's own profile
	FriendshipStatus      *string   `json:"friendship_status,omitempty"` // Only set on another user's profile
}

type UpdateProfileRequest struct {
	Username  *string `json:"username"`
	AvatarURL *string `json:"avatar_url"`
}

// UserUpdatedEvent is pushed to friends and the user's other tabs after a profile edit
type UserUpdatedEvent struct {
	OldUsername string  `json:"old_username"`
	Username    string  `json:"username"`
	AvatarURL   *string `json:"avatar_url"`
}

// DailyActivity is one day of the analytics dashboard
type DailyActivity struct {
	Date             string `json:"date"` // YYYY-MM-DD
	TimeSpentSeconds int    `json:"time_spent_seconds"`
	MessagesSent     int    `json:"messages_sent"`
}
