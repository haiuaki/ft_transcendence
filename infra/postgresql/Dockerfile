FROM postgres:18-alpine

# Bake the schema directly into the image so it runs automatically on first boot
COPY init.sql /docker-entrypoint-initdb.d/init.sql
