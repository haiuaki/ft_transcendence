# Official Go image
FROM golang:1.27.1-alpine

# Set working folder in the container
WORKDIR /app

# Copy Go module files and download external packages
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code in the container
COPY . .

# Compile the Go application into an executable named "server"
RUN go build -o server main.go

# Turn the server on
CMD ["./server"]
