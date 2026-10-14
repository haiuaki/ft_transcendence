package auth

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

// Password rules, kept identical to the checklist on the signup page
const (
	MinPasswordLen = 10
	// bcrypt only uses the first 72 bytes of a password
	MaxPasswordBytes = 72
)

var (
	passwordDigit   = regexp.MustCompile(`[0-9]`)
	passwordSpecial = regexp.MustCompile(`[^a-zA-Z0-9]`)
)

// PasswordProblem returns why a new password is rejected, or "" if it is valid
func PasswordProblem(password string) string {
	switch {
	case utf8.RuneCountInString(password) < MinPasswordLen:
		return "Password must be at least 10 characters long."
	case len(password) > MaxPasswordBytes:
		return "Password must be at most 72 bytes long."
	case !passwordDigit.MatchString(password):
		return "Password must contain at least one number."
	case !passwordSpecial.MatchString(password):
		return "Password must contain at least one special character."
	case strings.TrimSpace(password) != password:
		return "Password must not start or end with a space."
	}
	return ""
}
