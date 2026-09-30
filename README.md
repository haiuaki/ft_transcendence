_This project has been created as part of the 42 curriculum by juljin, ksilvest, nlienard, dinza-cr._

# ft_transcendence

## Description
`ft_transcendence` is a full-stack web application that provides an interactive **3D Coworking and Study Space**.
Users can navigate through a virtual room rendered in Three.js, interact with others via real-time chat, and build a community through a comprehensive social network system.

## Modules
Our project fulfills the requirements by implementing the following Major and Minor modules:

### Web
* **[Major]** Allow users to interact with other users

### User Management
* **[Major]** Standard user management and authentication

### AI
* **[Major]** LLM System Interface (Integration of an AI Chatbot via Gemini API)

## Features List
* **Authentication:** Secure JWT-based session management, Email Verification, and robust **Multi-Provider OAuth 2.0** integration (42 Intra, Google, GitHub) featuring a smart auto-incrementing username resolver for collision prevention.
* **Real-Time Presence & Chat:** Gorilla WebSocket architecture with Ping/Pong heartbeats, real-time presence tracking (ONLINE/OFFLINE), Ghost-Avatar auto-cleanup, and spatial anti-cheat DB validation.
* **Direct Messaging:** Private, omnipresent 1-on-1 chats elegantly architected on top of the existing spatial channel infrastructure.
* **User Management:** Full CRUD operations for user profiles and avatars.
* **Social Network:** Bidirectional friend request system (Add, Accept, Deny, Remove).
* **AI Assistant:** Integration of a real-time conversational agent using Google Gemini.

## Instructions
1. Copy `.env.example` to `.env` and fill in your API keys.
2. Run `make up` (or `docker compose up --build -d`).
3. Open your browser and navigate to **`https://localhost`**.
   *Note: Because we use self-signed 42-compliant SSL certificates, your browser will warn you that the connection is not private. Click "Advanced" -> "Proceed to localhost".*

## Technical Stack
* **Frontend:** Next.js (React), TypeScript, Tailwind CSS
* **Frontend (3D):** Three.js, React Three Fiber
* **Backend:** Go (1.27.1), net/http standard library, Gorilla WebSockets
* **Backend (AI Service):** Python 3.12, FastAPI, Google GenAI SDK
* **Database:** PostgreSQL 18, pgx/v5 driver
* **Third-Party APIs:** Resend Go SDK, Google Gemini API
* **Infrastructure:** Docker, Docker Compose, NGINX (HTTPS Reverse Proxy)
* **Testing:** Pytest & HTTPX (Unit testing for AI service)
* **CI/CD:** GitHub Actions (Automated Go formatting and builds)

## Database Schema
Our database utilizes a Domain-Driven Design approach with strict constraints to ensure data integrity:

* **Users:** UUID-based primary keys, unique email/username constraints.
* **Friendships:** Utilizes a custom Bidirectional Unique Index (LEAST/GREATEST) to elegantly handle overlapping friend requests and race conditions.

## Team Information
* **juljin** - Backend Architecture & DevOps
* **ksilvest** - AI Service Architecture & Infrastructure
* **nlienard** - Frontend Architecture & UI/UX
* **dinza-cr** - 3D Modeling & Three.js Integration

## Project Management

## Individual Contributions

## Resources
* [Official Go Documentation](https://go.dev/learn/)
* [Google Gemini API Key Documentation](https://ai.google.dev/gemini-api/docs/api-key)
