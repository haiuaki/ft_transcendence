package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

// Username length limits, `users.username` is a VARCHAR(30)
const (
	MinUsernameLen = 3
	MaxUsernameLen = 30
)

// How many suffixes the OAuth resolver tries before giving up (johndoe1..johndoe99)
const maxUsernameAttempts = 100

// UsernameRegex ensures usernames are 3-30 characters long and strictly alphanumeric
// or underscores. The `$` ensures the string stricly ends after valid characters,
// blocking trailing emojis.
var UsernameRegex = regexp.MustCompile(fmt.Sprintf(`^[a-zA-Z0-9_]{%d,%d}$`, MinUsernameLen, MaxUsernameLen))

// UsernameRuleMessage is the error shown when a username doesn't match UsernameRegex
var UsernameRuleMessage = fmt.Sprintf("Username must be %d-%d characters and contain only letters, numbers, and underscores.", MinUsernameLen, MaxUsernameLen)

var repeatedUnderscores = regexp.MustCompile(`_+`)

// Turns a provider's username (e.g., "John Doe") into one that fits UsernameRegex
// (e.g., "John_Doe").
func SanitizeUsername(raw string) string {
	var b strings.Builder

	// NFD splits accented letters into letter + accent mark,
	// so "é" becomes "e" once marks are dropped
	for _, r := range norm.NFD.String(raw) {
		switch {
		case r < unicode.MaxASCII && (unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'):
			b.WriteRune(r)
		case r == ' ' || r == '-' || r == '.':
			b.WriteRune('_')
		}
	}

	username := repeatedUnderscores.ReplaceAllString(b.String(), "_")
	username = strings.Trim(username, "_")
	if len(username) > MaxUsernameLen {
		username = strings.TrimRight(username[:MaxUsernameLen], "_")
	}
	return username
}

// usernameCandidate returns the base username for attempt 0, and the base with
// a numeric suffix after that (johndoe1, johndoe2..), shortening the base so the
// result never exceeds MaxUsernameLen
func usernameCandidate(base string, attempt int) string {
	if attempt == 0 {
		return base
	}
	suffix := fmt.Sprint(attempt)
	if len(base)+len(suffix) > MaxUsernameLen {
		base = base[:MaxUsernameLen-len(suffix)]
	}
	return base + suffix
}

// randomHex returns 2*n random hex characters, used for fallback usernames
func randomHex(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return hex.EncodeToString(b)
}
