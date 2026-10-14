_This project has been created as part of the 42 curriculum by juljin, ksilvest, nlienard, dinza-cr._

# ft_transcendence

## Description
**ft_cluster** is a web-based **3D Coworking and Study Space**. We built this project to provide a collaborative virtual environment where users can work together in real-time. The core features include an interactive 3D room, a live chat system, user profiles with friend management, third-party OAuth logins, and an integrated AI chatbot to help answer questions while you study.

## Modules

### Web
- **[Major - 2pts] Frameworks: Next.js and FastAPI**
  - *Justification:* Chosen to establish a robust, decoupled architecture.
  - *Implementation:* Next.js (React) for the frontend UI and Python FastAPI for the AI microservice.
  - *Team:* nlienard, ksilvest
- **[Major - 2pts] Real-time WebSockets**
  - *Justification:* Essential for synchronizing user presence in the 3D space.
  - *Implementation:* Built a Go WebSocket hub using the Gorilla library to broadcast spatial data.
  - *Team:* juljin
- **[Major - 2pts] User Interaction**
  - *Justification:* Necessary to build a community-driven platform.
  - *Implementation:* Engineered a live chat, profile CRUD, and a bidirectional Postgres friendship system.
  - *Team:* juljin, nlienard

### Accessibility & Internationalization
- **[Minor - 1pt] Support for additional browsers**
  - *Justification:* A study space should work for everyone in the room, whatever browser they use, not just in Chrome.
  - *Implementation:* Every feature was tested and fixed in Chrome, Firefox and Safari, with the same UI in each. Browser-specific CSS has standard fallbacks (e.g. `scrollbar-width`/`scrollbar-color` for Firefox alongside the `::-webkit-scrollbar` styles). Known limitations: [TBD - list any, or write "none found"].
  - *Team:* juljin, ksilvest, dinza-cr, nlienard

### User Management
- **[Major - 2pts] Standard Authentication**
  - *Justification:* Required to securely isolate user data and sessions.
  - *Implementation:* Developed a secure JWT architecture with Resend API email verification and avatar uploads.
  - *Team:* juljin, nlienard
- **[Minor - 1pt] Remote Authentication (OAuth 2.0)**
  - *Justification:* Chosen to provide frictionless onboarding for new users.
  - *Implementation:* Built a dynamic, state-protected OAuth pipeline for 42 Intra, Google, and GitHub.
  - *Team:* juljin
- **[Minor - 1pt] Two-Factor Authentication (2FA)**
  - *Justification:* Protects accounts even when a password or an OAuth provider account is compromised.
  - *Implementation:* TOTP (RFC 6238) codes from any authenticator app, enforced on both password and OAuth logins, with short-lived pending tokens and per-login attempt limits.
  - *Team:* juljin
- **[Minor - 1pt] User analytics and insights dashboard**
  - *Justification:* Lets users see how much they actually study and interact in the space, which fits a productivity-focused coworking app.
  - *Implementation:* The backend records time spent in rooms (saved when a user leaves, disconnects or is removed from a room) and messages sent, both as lifetime totals on the user and per day in a `daily_user_analytics` table. A `GET /profile/analytics` endpoint returns that per-day data for the last 7 or 30 days, with empty days filled in as zeros. The profile dashboard shows the lifetime totals and two bar charts (messages sent per day, time spent per day) with a 7/30-day switch and per-day tooltips on hover or keyboard focus. The charts are visible only on the user's own profile.
  - *Team:* juljin, dinza-cr, nlienard

### Artificial Intelligence
- **[Major - 2pts] LLM Interface**
  - *Justification:* To provide users with an interactive, on-demand study assistant.
  - *Implementation:* Created a Python streaming API powered by the Google Gemini SDK.
  - *Team:* ksilvest
- **[Major - 2pts] Retrieval-Augmented Generation (RAG)**
  - *Justification:* Ground AI responses in contextual workspace data using pgvector semantic search.
  - *Implementation:* Built a RAG pipeline utilizing pgvector for vector cosine search and dataset export.
  - *Team:* ksilvest

### Gaming & User Experience
- **[Major - 2pts] Advanced 3D Graphics**
  - *Justification:* Chosen to foster collaboration over competition. Demonstrates severe technical complexity via WebGL lifecycle management.
  - *Implementation:* Designed custom Blender `.glb` assets, rendered via native Three.js inside React with interactive raycasting.
  - *Team:* dinza-cr

### Data and Analytics
- **[Minor - 1pt] GDPR Compliance**
  - *Justification:* Users share personal data with us (email, avatar, messages, friends, activity), so they should be able to see all of it and erase it, as the GDPR requires.
  - *Implementation:* A "Your data" section on the profile. **Export** (`GET /profile/export`) downloads all of the user's data as a readable JSON file (profile, friends, rooms, memberships, messages, daily activity), leaving out secrets like the password hash and 2FA secret. **Delete** (`DELETE /profile/delete`) asks the user to type their username, checked on the backend too, then erases the account in one transaction: messages, friendships, owned rooms, memberships and analytics are deleted, and the email, password, avatar and 2FA data are wiped, leaving only an anonymous `deleted_…` placeholder. Both operations send a confirmation email through Resend. Logging out or deleting the account also clears the AI assistant conversation stored in the browser, and the privacy policy page explains what is collected and how to use these rights.
  - *Team:* juljin

### Modules of Choice
- **[Minor - 1pt] Day / Night Environment**
  - *Why we chose it:* People study at every hour of the day, so the workspace should be comfortable to use late at night. Instead of only darkening the interface, we change the lighting of the whole 3D room.
  - *Technical challenges:*
    - **Two sets of baked lighting:** the room's lighting is baked in Blender twice, once for day and once for night, and exported as two texture sets compressed to WebP (≈4.2 MB day, ≈2.8 MB night).
    - **Smooth transition:** a custom shader is added to Three.js's built-in materials (`onBeforeCompile`) so they draw both texture sets and fade between them, with eased timing over 1 s while the background colour changes with them. Users who ask for reduced motion get an instant switch.
    - **Loading and memory:** both sets are downloaded once when the room loads, sent to the GPU in advance (`renderer.initTexture`) and cached, so switching never stutters. A failed download shows an error message instead of breaking the scene, and every texture is freed when the scene closes.
  - *Value to the project:* The 3D room and the interface (colour theme, panels, room controls) switch together from one toggle, so the whole app changes, not just the page colours.
  - *Why it is a Minor:* It builds on the existing 3D scene rather than adding a new system, but it needed its own work in Blender, a custom shader and careful texture handling, which is well beyond a CSS theme toggle.
  - *Team:* dinza-cr

### Point Calculation
| Module | Category | Type | Points |
|---|---|:---:|---:|
| Frameworks: Next.js and FastAPI | Web | Major | 2 |
| Real-time WebSockets | Web | Major | 2 |
| User Interaction | Web | Major | 2 |
| Support for additional browsers | Accessibility & Internationalization | Minor | 1 |
| Standard Authentication | User Management | Major | 2 |
| Remote Authentication (OAuth 2.0) | User Management | Minor | 1 |
| Two-Factor Authentication (2FA) | User Management | Minor | 1 |
| User analytics and insights dashboard | User Management | Minor | 1 |
| LLM Interface | Artificial Intelligence | Major | 2 |
| Retrieval-Augmented Generation (RAG) | Artificial Intelligence | Major | 2 |
| Advanced 3D Graphics | Gaming & User Experience | Major | 2 |
| GDPR Compliance | Data and Analytics | Minor | 1 |
| Day / Night Environment | Modules of Choice | Minor | 1 |
| **Total** | | **7 Majors + 6 Minors** | **20** |

**20 points** claimed (Major = 2 pts, Minor = 1 pt): 14 mandatory + 5 bonus, which is the bonus maximum, plus 1 point of margin in case a module is not validated.

## Features List
* **Authentication:** Secure JWT-based session management, Resend Email Verification, and robust Multi-Provider OAuth 2.0 (Google, GitHub, 42 Intra) featuring a smart auto-incrementing username resolver for collision prevention. *(By juljin, nlienard)*
* **Two-Factor Authentication:** Optional TOTP 2FA with QR code setup for any authenticator app (Google Authenticator, Authy, 1Password...). Once enabled, every login (password or OAuth) requires a 6-digit code; pending login tokens expire after 5 minutes and lock after 5 wrong codes. *(By juljin)*
* **Real-Time Presence & Chat:** Gorilla WebSocket architecture with Ping/Pong heartbeats, real-time presence tracking (ONLINE/OFFLINE), Ghost-Avatar auto-cleanup, and spatial anti-cheat DB validation. *(By juljin, nlienard)*
* **Direct Messaging:** Private, omnipresent 1-on-1 chats elegantly architected on top of the existing spatial channel infrastructure. *(By juljin, nlienard)*
* **User Management:** Full CRUD operations for user profiles, settings, and avatars. *(By juljin, nlienard)*
* **Activity Dashboard:** Lifetime totals plus daily bar charts of messages sent and time spent in rooms, over the last 7 or 30 days. *(By juljin, dinza-cr, nlienard)*
* **Privacy & GDPR:** Download all your data as JSON, or permanently erase your account and its personal data after typing your username, with a confirmation email for each. *(By juljin)*
* **Social Network:** Bidirectional friend request system (Add, Accept, Deny, Remove). *(By juljin, nlienard)*
* **AI Assistant (Kewan AI):** Integration of a real-time, streaming conversational agent powered by the Google Gemini SDK, pgvector-backed semantic RAG search, and an interactive window UI (`KewanWindow`) featuring smooth entrance animations, window dragging, and markdown rendering. *(By ksilvest)*
* **3D Workspace:** An interactive 3D virtual environment built with native Three.js, featuring custom `.glb` models, interactive raycasting, smooth mouse-follow camera mechanics, and dynamic React window UI overlays for 3D object click interactions. *(By dinza-cr)*

## Instructions

### Prerequisites
Before running the project, ensure you have the following software installed:
* **Docker** (v24.0 or higher)
* **Docker Compose** (v2.0 or higher)
* **Git**

### Installation & Configuration
1. Clone the repository and navigate into it:
   ```bash
   git clone <repository_url>
   cd ft_transcendence
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Fill in the required credentials inside `.env`:
   * **Database:** Set a secure `POSTGRES_USER` and `POSTGRES_PASSWORD`.
   * **AI Chatbot:** Provide a `GOOGLE_API_KEY` for the Gemini SDK.
   * **Email Verification:** Provide a `RESEND_API_KEY`.
   * **OAuth Providers (If testing remote login):** Provide Client IDs and Secrets for Google, GitHub, and 42 Intra.
   * **Two-Factor Authentication:** No configuration needed. Codes are computed locally by the authenticator app, so 2FA works on `localhost` without any external service.

### Execution
1. Boot the entire infrastructure:
   ```bash
   make up
   ```
   *(Alternatively, run `docker compose up --build -d`)*
2. Open your browser and navigate to **`https://localhost:8443`**.
   > *Note: Because we use self-signed SSL certificates, your browser will warn you that the connection is not private. Click "Advanced" -> "Proceed to localhost".*

## Technical Stack
* **Frontend:** Next.js (React), TypeScript, Tailwind CSS
  * *Justification:* Next.js was chosen for its App Router architecture and built-in API proxying, allowing us to safely route authenticated requests into our internal Docker network without exposing ports.
* **Frontend (3D):** Native Three.js
  * *Justification:* Native Three.js was strictly chosen over abstraction wrappers (like React Three Fiber) to maintain absolute, low-level control over the WebGL rendering lifecycle, memory management, and garbage collection during React unmounts.
* **Backend:** Go (1.27.1), net/http standard library, Gorilla WebSockets
  * *Justification:* Go was strictly chosen for its concurrency model (Goroutines), which allows us to efficiently manage hundreds of simultaneous real-time WebSocket connections and ping/pong heartbeats with virtually zero latency.
* **Backend (AI Service):** Python 3.12, FastAPI, Google GenAI SDK
  * *Justification:* Python is the industry standard for AI. FastAPI provides asynchronous request handling (`async/await`), which is crucial for streaming large LLM text chunks back to the user in real-time.
* **Database:** PostgreSQL 18, pgx/v5 driver
  * *Justification:* PostgreSQL was chosen for its unmatched ACID compliance and advanced relational indexing. Because our app relies on a complex Bidirectional Friendship system and strict spatial anti-cheat validations, we required a rigid, schema-enforced relational database rather than a NoSQL document store.
* **Third-Party APIs:** Resend Go SDK, Google Gemini API
* **Security Libraries:** golang-jwt (session tokens), bcrypt (password hashing), pquerna/otp (TOTP generation, validation and QR codes)
* **Infrastructure:** Docker, Docker Compose, NGINX (HTTPS Reverse Proxy)
* **Testing:** Pytest & HTTPX (Unit testing for AI service)
* **CI/CD:** GitHub Actions (Automated Go formatting and builds)

## Database Schema
Our database utilizes a Domain-Driven Design approach with strict constraints to ensure data integrity.

* **Users Table:** Stores user profiles and authentication data. Primary key is a `UUID`. Key fields include `username` (VARCHAR, Unique), `email` (VARCHAR, Unique), `status` (VARCHAR), and the 2FA state `is_2fa_enabled` (BOOLEAN) with its `two_factor_secret` (VARCHAR).
* **Friendships Table:** Manages the social network. Uses a custom Bidirectional Unique Index (`LEAST/GREATEST`) on `user_id` and `friend_id` (both UUID Foreign Keys) to elegantly handle overlapping friend requests and race conditions.
* **Channels Table:** Represents the 3D Coworking spaces. Primary key is a `SERIAL id`. Key fields include `name` (VARCHAR) and `owner_id` (UUID Foreign Key).
* **Channel_Members Table:** A junction table tracking who is currently sitting in a 3D room. Uses a composite primary key (`channel_id`, `user_id`) and tracks permissions via the `role` field.
* **Messages Table:** Stores the real-time chat history for each channel, mapping `sender_id` (UUID) to `channel_id` (INTEGER) and vector embeddings (`pgvector`) used for AI contextual search.

```mermaid
erDiagram
    USERS ||--o{ FRIENDSHIPS : "initiates"
    USERS ||--o{ FRIENDSHIPS : "receives"
    USERS ||--o{ CHANNELS : "owns"
    USERS ||--o{ CHANNEL_MEMBERS : "joins"
    USERS ||--o{ MESSAGES : "sends"
    CHANNELS ||--o{ CHANNEL_MEMBERS : "contains"
    CHANNELS ||--o{ MESSAGES : "hosts"

    USERS {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR username UK
        BOOLEAN is_verified
        BOOLEAN is_2fa_enabled
        VARCHAR two_factor_secret
        VARCHAR status
        INTEGER total_messages_sent
        INTEGER cumulative_time_seconds
    }
    FRIENDSHIPS {
        SERIAL id PK
        UUID user_id FK
        UUID friend_id FK
        VARCHAR status
    }
    CHANNELS {
        SERIAL id PK
        VARCHAR name
        VARCHAR type
        VARCHAR password_hash
        VARCHAR model_type
        INTEGER max_capacity
        UUID owner_id FK
    }
    CHANNEL_MEMBERS {
        INTEGER channel_id PK, FK
        UUID user_id PK, FK
        VARCHAR role
        VARCHAR status
    }
    MESSAGES {
        SERIAL id PK
        UUID sender_id FK
        INTEGER channel_id FK
        TEXT content
        VECTOR embedding
        TIMESTAMPTZ created_at
    }
```

## Team Information
* **juljin (Tech Lead & Backend Developer)**
  * *Responsibilities:* Led the backend architecture, database schema design, and oversaw the Docker DevOps infrastructure and security (OAuth, HTTPS).
* **ksilvest (Product Owner & AI Developer)**
  * *Responsibilities:* Defined the product vision for the AI integrations, managed the Gemini SDK implementation, and developed the Python microservice.
* **nlienard (Project Manager & Frontend Developer)**
  * *Responsibilities:* Facilitated team communication and sprint goals. Architected the Next.js frontend, global state management, and user interface.
* **dinza-cr (Developer & 3D Artist)**
  * *Responsibilities:* Designed the interactive 3D Coworking assets in Blender and integrated the WebGL rendering pipeline using React Three Fiber.

## Project Management
* **Task Distribution & Organization:** The project was divided into autonomous modules (Frontend, Backend, AI, 3D). We held weekly sync meetings to align on API contracts and Docker infrastructure changes before merging feature branches into `main`.
* **Project Management Tools:** We utilized **GitHub Issues** and **GitHub Pull Requests** to track feature progress, document architectural decisions, and conduct peer code reviews. We also used **GitHub Actions** for CI/CD checks.
* **Communication Channels:** We used a dedicated **Slack** workspace for rapid, day-to-day asynchronous communication, debugging, and sharing technical documentation.

## Individual Contributions

### juljin (Backend Architecture & DevOps)
* **Contributions:** Architected the entire Go backend utilizing Gorilla WebSockets for real-time presence. Engineered the complete Multi-Provider OAuth 2.0 pipeline (42, Google, GitHub) and constructed the secure NGINX HTTPS reverse proxy network.
* **Challenges Overcome:** Engineering a bulletproof backend that gracefully handles deep edge cases. Overcame this by implementing strict cryptographic CSRF validation to prevent replay attacks, type-safe API parsing to handle malformed OAuth payloads, and a highly resilient Gorilla WebSocket architecture that seamlessly manages network latency, dropped connections, and Ghost-Avatar cleanup.

### ksilvest (AI Service Architecture & Infrastructure)
* **Contributions:** Developed the standalone Python 3.12 FastAPI microservice and RAG pipeline using pgvector and Google GenAI SDK. Implemented real-time Server-Sent Events (SSE) streaming, rate limiting, and the interactive frontend chat window (`KewanWindow`) with animations, draft persistence, and markdown rendering.
* **Challenges Overcome:** Connected the AI service to PostgreSQL in Docker, matched Gemini embedding dimensions with pgvector, and ensured smooth real-time text streaming to the chat UI.

### nlienard (Frontend Architecture & UI/UX)
* **Contributions:** Bootstrapped the Next.js application utilizing Tailwind CSS and strict TypeScript. Engineered the global React Auth Context, the API Gateway proxy layer, and the responsive authentication UI modals.
* **Challenges Overcome:** [TBD - Detail any UI/UX or API integration challenges faced during development]

### dinza-cr (3D Modeling & Three.js Integration)
* **Contributions:** Designed the custom `.glb` 3D Coworking and Study Space environments in Blender. Implemented `ThreeScene.tsx` using native Three.js, engineering smooth mouse-follow camera mechanics, and dynamic React window UI overlays for 3D object click interactions.
* **Challenges Overcome:** [TBD - Detail any rendering, performance, or asset management challenges faced during development]

## Resources
### AI Usage Disclosure
AI tools were strictly used as learning aids. Specifically:
* **Research & Brainstorming:** AI was used to understand complex documentation (e.g., deciphering OAuth 2.0 handshake flows and Three.js memory management).
* **Code Review:** Used to spot-check for potential race conditions in Go Goroutines.
No core logic was blindly copy-pasted; all AI-assisted code was thoroughly peer-reviewed, heavily modified, and is fully understood by the team.

### References
* [Official Go Documentation](https://go.dev/learn/)
* [Google Gemini API Key Documentation](https://ai.google.dev/gemini-api/docs/api-key)
* [Retrieval-Augmented Generation (RAG) - Real Python](https://realpython.com/ref/ai-coding-glossary/retrieval-augmented-generation/)
* [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
* [GitHub OAuth Apps Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
* [42 Intra API Documentation](https://api.intra.42.fr/apidoc)
* [RFC 6238: TOTP Time-Based One-Time Password Algorithm](https://datatracker.ietf.org/doc/html/rfc6238)
* [pquerna/otp Go Library](https://github.com/pquerna/otp)
