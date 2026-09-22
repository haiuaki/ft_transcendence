package auth

type Credentials struct {
	// Must be capitalized (public) for the Decoder to see them
	// The struct tag `json:"..."` tells the Decoder which lowercase JSON key to map this to
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}
