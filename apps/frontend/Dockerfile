FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

# Rewrites in next.config.ts are fixed at build time, so the backend port must be known here
ARG BACKEND_PORT=8080
ENV BACKEND_PORT=$BACKEND_PORT
RUN npm run build

CMD ["npm", "run", "start"]
