package auth

import (
	"context"
	"encoding/base64"
	"io"
	"net/http"
	"time"
)

// Stays under users.MaxAvatarLen (200 KB) once base64-encoded into a data URL
const maxProviderAvatarBytes = 140 * 1024

var avatarClient = &http.Client{Timeout: 5 * time.Second}

// fetchProviderAvatar downloads a provider's profile picture and returns it as a data URL,
// so the browser never loads images from the provider (42's CDN answers 403, Google can 429,
// and each failed load is a console error). Returns nil when the picture can't be used.
func fetchProviderAvatar(ctx context.Context, url string) *string {
	if url == "" {
		return nil
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil
	}
	resp, err := avatarClient.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, maxProviderAvatarBytes+1))
	if err != nil || len(data) == 0 || len(data) > maxProviderAvatarBytes {
		return nil
	}

	// Only the formats the profile endpoint accepts
	mime := http.DetectContentType(data)
	if mime != "image/jpeg" && mime != "image/png" {
		return nil
	}
	dataURL := "data:" + mime + ";base64," + base64.StdEncoding.EncodeToString(data)
	return &dataURL
}
