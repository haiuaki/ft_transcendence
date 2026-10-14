package users

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
	"github.com/haiuaki/ft_transcendence/src/services/mail"
)

// ExportData sends the user a JSON file with all the personal data we hold on them
// (GDPR right of access). Secrets like the password hash or the 2FA secret are left out.
func ExportData(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		query := `
			WITH me AS (SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL)
			SELECT me.username, json_build_object(
				'exported_at', NOW(),
				'profile', json_build_object(
					'username', me.username,
					'email', me.email,
					'avatar_url', me.avatar_url,
					'status', me.status,
					'email_verified', me.is_verified,
					'two_factor_enabled', me.is_2fa_enabled,
					'total_messages_sent', me.total_messages_sent,
					'total_time_spent_seconds', me.cumulative_time_seconds,
					'created_at', me.created_at,
					'updated_at', me.updated_at
				),
				'friends', COALESCE((
					SELECT json_agg(json_build_object(
						'username', u.username,
						'status', f.status,
						'requested_by_you', f.user_id = me.id,
						'since', f.created_at
					) ORDER BY f.created_at)
					FROM friendships f
					JOIN users u ON u.id = CASE WHEN f.user_id = me.id THEN f.friend_id ELSE f.user_id END
					WHERE me.id IN (f.user_id, f.friend_id)
				), '[]'),
				'rooms_owned', COALESCE((
					SELECT json_agg(json_build_object(
						'name', c.name,
						'type', c.type,
						'model', c.model_type,
						'created_at', c.created_at
					) ORDER BY c.created_at)
					FROM channels c
					WHERE c.owner_id = me.id
				), '[]'),
				'room_memberships', COALESCE((
					SELECT json_agg(json_build_object(
						'room', c.name,
						'type', c.type,
						'role', m.role,
						'status', m.status,
						'joined_at', m.joined_at
					) ORDER BY m.joined_at)
					FROM channel_members m
					JOIN channels c ON c.id = m.channel_id
					WHERE m.user_id = me.id AND c.type <> 'DIRECT'
				), '[]'),
				'messages', COALESCE((
					SELECT json_agg(json_build_object(
						'conversation', CASE WHEN c.type = 'DIRECT'
							THEN 'DM with ' || COALESCE((
								SELECT u.username FROM channel_members other
								JOIN users u ON u.id = other.user_id
								WHERE other.channel_id = c.id AND other.user_id <> me.id
								LIMIT 1
							), 'unknown')
							ELSE c.name END,
						'content', msg.content,
						'sent_at', msg.created_at
					) ORDER BY msg.created_at)
					FROM messages msg
					LEFT JOIN channels c ON c.id = msg.channel_id
					WHERE msg.sender_id = me.id
				), '[]'),
				'daily_activity', COALESCE((
					SELECT json_agg(json_build_object(
						'date', a.date,
						'time_spent_seconds', a.time_spent_seconds,
						'messages_sent', a.messages_sent
					) ORDER BY a.date)
					FROM daily_user_analytics a
					WHERE a.user_id = me.id
				), '[]')
			)
			FROM me
		`

		var username string
		var export json.RawMessage
		err := dbPool.QueryRow(context.Background(), query, email).Scan(&username, &export)
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "User not found.", http.StatusNotFound)
			return
		}
		if err != nil {
			log.Println("Database error exporting user data:", err)
			http.Error(w, "Failed to export your data.", http.StatusInternalServerError)
			return
		}

		mail.Send(email, "Your ft_cluster data export",
			fmt.Sprintf(`<p>Hi %s,</p>
			             <p>A copy of your personal data was exported from your account on %s.</p>
			             <p>If this wasn't you, change your password and enable two-factor authentication.</p>`,
				mail.Escape(username), time.Now().UTC().Format("2 January 2006 at 15:04 UTC")))

		filename := fmt.Sprintf("ft_cluster-%s-data.json", username)
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		w.Write(export)
	}
}

type DeleteProfileRequest struct {
	Username string `json:"username"` // Typed by the user to confirm the deletion
}

// DeleteProfile erases the user's account (GDPR right to erasure). The row is kept
// as a soft delete, but every piece of personal data in it is wiped and everything
// they created (messages, friendships, rooms, analytics) is deleted.
func DeleteProfile(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		var req DeleteProfileRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON data.", http.StatusBadRequest)
			return
		}

		ctx := r.Context()
		tx, err := dbPool.Begin(ctx)
		if err != nil {
			log.Println("Database error starting account deletion:", err)
			http.Error(w, "Failed to delete account.", http.StatusInternalServerError)
			return
		}
		defer tx.Rollback(ctx)

		var userID, username string
		err = tx.QueryRow(ctx, `
			SELECT id, username FROM users
			WHERE email = $1 AND deleted_at IS NULL
			FOR UPDATE
		`, email).Scan(&userID, &username)
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "User not found.", http.StatusNotFound)
			return
		}
		if err != nil {
			log.Println("Database error during account deletion:", err)
			http.Error(w, "Failed to delete account.", http.StatusInternalServerError)
			return
		}

		if !strings.EqualFold(strings.TrimSpace(req.Username), username) {
			http.Error(w, "Type your username to confirm the deletion.", http.StatusBadRequest)
			return
		}

		// Soft delete keeps the row, so ON DELETE CASCADE never fires:
		// remove everything the user created by hand
		cleanup := []string{
			`DELETE FROM channels WHERE owner_id = $1`,
			`DELETE FROM messages WHERE sender_id = $1`,
			`DELETE FROM friendships WHERE user_id = $1 OR friend_id = $1`,
			`DELETE FROM channel_members WHERE user_id = $1`,
			`DELETE FROM daily_user_analytics WHERE user_id = $1`,
		}
		for _, query := range cleanup {
			if _, err := tx.Exec(ctx, query, userID); err != nil {
				log.Println("Database error cleaning up account data:", err)
				http.Error(w, "Failed to clean up account data.", http.StatusInternalServerError)
				return
			}
		}

		// Wipe the personal data. Clearing the email also frees it for a new sign-up.
		anonymizeSQL := `
			UPDATE users SET
				email = NULL,
				username = 'deleted_' || LEFT(REPLACE(id::text, '-', ''), 12),
				password_hash = NULL,
				avatar_url = NULL,
				verification_token = NULL,
				is_2fa_enabled = FALSE,
				two_factor_secret = NULL,
				status = 'OFFLINE',
				total_messages_sent = 0,
				cumulative_time_seconds = 0,
				updated_at = CURRENT_TIMESTAMP,
				deleted_at = CURRENT_TIMESTAMP
			WHERE id = $1
		`
		if _, err := tx.Exec(ctx, anonymizeSQL, userID); err != nil {
			log.Println("Database error during profile deletion:", err)
			http.Error(w, "Failed to delete account.", http.StatusInternalServerError)
			return
		}

		if err := tx.Commit(ctx); err != nil {
			log.Println("Database error committing account deletion:", err)
			http.Error(w, "Failed to delete account.", http.StatusInternalServerError)
			return
		}

		mail.Send(email, "Your ft_cluster account has been deleted",
			fmt.Sprintf(`<p>Hi %s,</p>
			             <p>Your account and all its personal data (profile, messages, friends, rooms and activity) have been permanently deleted.</p>
			             <p>This is the last email you will receive from us.</p>`,
				mail.Escape(username)))

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Account successfully deleted."))
	}
}
