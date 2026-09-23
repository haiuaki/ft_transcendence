package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect() *pgxpool.Pool {
	dbUser := os.Getenv("POSTGRES_USER")
	dbPassword := os.Getenv("POSTGRES_PASSWORD")
	dbHost := os.Getenv("POSTGRES_HOST")
	dbPort := os.Getenv("POSTGRES_PORT")
	dbName := os.Getenv("POSTGRES_DB")
	dbSSLMode := os.Getenv("POSTGRES_SSLMODE")
	jwtSecret := os.Getenv("JWT_SECRET")

	if dbUser == "" || dbPassword == "" || dbHost == "" || dbPort == "" || dbName == "" || dbSSLMode == "" || jwtSecret == "" {
		log.Fatal("Critical environment variables are missing in the `.env` file.")
	}

	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", dbUser, dbPassword, dbHost, dbPort, dbName, dbSSLMode)

	dbPool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v.\n", err)
	}

	err = dbPool.Ping(context.Background())
	if err != nil {
		log.Fatalf("Database ping failed: %v.\n", err)
	}
	fmt.Println("Successfully connected to the PostgreSQL database.")

	return dbPool
}
