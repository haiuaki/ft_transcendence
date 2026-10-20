FROM docker.io/pgvector/pgvector:pg17

# Bake the schema directly into the image so it runs automatically on first boot
COPY init.sql /docker-entrypoint-initdb.d/init.sql
