package chat

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func StartRoomGarbageCollector(dbPool *pgxpool.Pool) {
	ticker := time.NewTicker(1 * time.Hour)

	// Run this infinitely in the background
	go func() {
		for {
			<-ticker.C // Wait for the ticker to tick (.C channel)
			log.Println("Room Garbage Collector: Checking for empty rooms..")

			// Delete if older than 24 hours and empty
			deleteSQL := `
				DELETE FROM channels
				WHERE created_at < NOW() - INTERVAL '24 hours'
					AND id NOT IN (SELECT channel_id FROM channel_members WHERE status = 'ACTIVE')
			`

			result, err := dbPool.Exec(context.Background(), deleteSQL)
			if err != nil {
				log.Println("Garbage Collector Error:", err)
				return
			} else if result.RowsAffected() > 0 {
				log.Printf("Garbage Collector cleared %d abandoned rooms.\n", result.RowsAffected())
			}
		}
	}()
}
