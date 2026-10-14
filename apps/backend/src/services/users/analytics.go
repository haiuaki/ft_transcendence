package users

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/haiuaki/ft_transcendence/src/services/auth"
)

const defaultAnalyticsDays = 7
const maxAnalyticsDays = 30

// GetAnalytics returns the user's activity for each of the last N days (?days=, 1-30),
// oldest first. Days without activity are returned as zeros so charts have no gaps.
func GetAnalytics(dbPool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.Context().Value(auth.UserEmailKey).(string)

		days := defaultAnalyticsDays
		if param := r.URL.Query().Get("days"); param != "" {
			parsed, err := strconv.Atoi(param)
			if err != nil || parsed < 1 || parsed > maxAnalyticsDays {
				http.Error(w, "days must be between 1 and 30.", http.StatusBadRequest)
				return
			}
			days = parsed
		}

		query := `
			SELECT TO_CHAR(d.day, 'YYYY-MM-DD'),
				COALESCE(a.time_spent_seconds, 0),
				COALESCE(a.messages_sent, 0)
			FROM generate_series(CURRENT_DATE - ($2::int - 1), CURRENT_DATE, INTERVAL '1 day') AS d(day)
			LEFT JOIN daily_user_analytics a
				ON a.date = d.day::date
				AND a.user_id = (SELECT id FROM users WHERE email = $1)
			ORDER BY d.day
		`

		rows, err := dbPool.Query(context.Background(), query, email, days)
		if err != nil {
			log.Println("Database error fetching analytics:", err)
			http.Error(w, "Failed to fetch analytics.", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		activity := make([]DailyActivity, 0, days)
		for rows.Next() {
			var day DailyActivity
			if err := rows.Scan(&day.Date, &day.TimeSpentSeconds, &day.MessagesSent); err != nil {
				log.Println("Database error reading analytics:", err)
				http.Error(w, "Failed to fetch analytics.", http.StatusInternalServerError)
				return
			}
			activity = append(activity, day)
		}
		if err := rows.Err(); err != nil {
			log.Println("Database error reading analytics:", err)
			http.Error(w, "Failed to fetch analytics.", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(activity)
	}
}
