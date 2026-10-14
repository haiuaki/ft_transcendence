package mail

import (
	"html"
	"log"
	"os"

	"github.com/resend/resend-go/v4"
)

// Send emails `to` through Resend. Mail is best-effort: without RESEND_API_KEY
// it is skipped, and a failure is logged but never fails the request.
func Send(to, subject, body string) {
	resendAPIKey := os.Getenv("RESEND_API_KEY")
	if resendAPIKey == "" {
		log.Println("Warning: RESEND_API_KEY not set in `.env`. Email skipped.")
		return
	}

	client := resend.NewClient(resendAPIKey)
	params := &resend.SendEmailRequest{
		From:    "onboarding@resend.dev",
		To:      []string{to},
		Subject: subject,
		Html:    body,
	}

	if _, err := client.Emails.Send(params); err != nil {
		log.Printf("Resend Error: Failed to send %q email: %v", subject, err)
		return
	}
	log.Printf("Email %q successfully sent to %s", subject, to)
}

// Escape makes user-provided text (like a username) safe to put in an email body
func Escape(text string) string {
	return html.EscapeString(text)
}
