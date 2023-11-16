# ft_transcendence

Welcome to ft_transcendence! Full Stack Web Project

### Project Highlights:

- **Technology Stack:**
  - Backend: NestJS
  - Frontend: React
  - Database: PostgreSQL with Prisma
  - Additional Technologies: Socket.io, Google OAuth for user authentication, and Google Authenticator for two-factor authentication.

- **Website Requirements:**
  - Single-page application with browser navigation support.
  - Compatibility with the latest stable versions of Google Chrome and one additional browser.
  - Error-free browsing experience with no unhandled errors or warnings.

- **Security Concerns:**
  - Passwords must be securely hashed.
  - Protection against SQL injections and server-side validation for forms and user input.
  - Sensitive information like credentials and API keys stored locally in a secure `.env` file.

- **User Account Features:**
  - OAuth login via 42 intranet.
  - OAuth login via google
  - Unique username selection with avatar upload option.
  - Two-factor authentication support.
  - Friend management with real-time status updates.
  - Comprehensive user profiles with stats and match history.

- **Chat Functionality:**
  - Creation of public, private, or password-protected chat channels.
  - Direct messaging, user blocking, and channel ownership management.
  - Chat-invoked Pong game invitations and player profile access.

- **Gaming Experience:**
  - Live Pong games with a matchmaking system.
  - Responsive gameplay, considering network issues and ensuring a seamless user experience.
  - Customization options available, but users can opt for the classic Pong experience.

### Getting Started:

0. Ask me for the .env file
1. Clone the repository.
2. Move the .env file in the backend repository
3. Launch the project with a single call: `docker-compose up --build`.
4. Go to http://localhost:3000/
