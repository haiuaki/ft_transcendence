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

## Features List
* **Authentication:** Secure JWT-based login and signup system with Resend-powered Email Verification and strict Login Lock.
* **User Management:** Full CRUD operations for user profiles and avatars.
* **Social Network:** Bidirectional friend request system (Add, Accept, Deny, Remove).

## Instructions

## Technical Stack
* **Backend:** Go (1.27.1), net/http standard library
* **Database:** PostgreSQL 18, pgx/v5 driver
* **Third-Party APIs:** Resend Go SDK
* **Infrastructure:** Docker & Docker Compose
* **CI/CD:** GitHub Actions (Automated Go formatting and builds)

## Database Schema
Our database utilizes a Domain-Driven Design approach with strict constraints to ensure data integrity:

* **Users:** UUID-based primary keys, unique email/username constraints.
* **Friendships:** Utilizes a custom Bidirectional Unique Index (LEAST/GREATEST) to elegantly handle overlapping friend requests and race conditions.

## Team Information
* **juljin** - Backend Architecture
* **ksilvest** - 
* **nlienard** - 
* **dinza-cr** -

## Project Management

## Individual Contributions

## Resources
* [Official Go Documentation](https://go.dev/learn/)
