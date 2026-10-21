package respond

import (
	"encoding/json"
	"net/http"
)

// UserError answers an expected failure the user can cause (wrong password, name taken, unknown user...).
// Browsers log every 4xx/5xx response in the console, which the subject forbids, so it is sent as a
// 200 carrying the message and the status it stands for; the frontend services turn it back into an error.
// Keep http.Error for failures that only come from bugs or tampering.
func UserError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"error": message, "status": status})
}
