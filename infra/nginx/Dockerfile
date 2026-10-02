FROM nginx:1.27-alpine

# Install OpenSSL
RUN apk add --no-cache openssl

# Create the SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
	-keyout /etc/nginx/ssl/transcendence.key \
	-out /etc/nginx/ssl/transcendence.crt \
	-subj "/CN=localhost"

COPY nginx.conf /etc/nginx/conf.d/default.conf
