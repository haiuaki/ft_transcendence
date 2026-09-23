# Default rule
all: up

# Build and start the containers in the background
up:
	docker compose up --build -d

# Stop the containers while keeping the data
down:
	docker compose down

# Stop the containers and wipe the database
clean:
	docker compose down -v

# Wipe data and delete all Docker images
fclean:
	docker compose down -v --rmi all

# Wipe data and rebuild everything
re: clean up

# Watch live logs of the backend and database
logs:
	docker compose logs -f

.PHONY: all up down clean fclean re logs
