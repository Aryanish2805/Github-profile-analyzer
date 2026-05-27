# GitHub Profile Analyzer API

A robust, production-ready backend service built with Node.js, Express, and MySQL that fetches, analyzes, and stores GitHub user profile insights.

## Features

- **Profile Analysis**: Fetches user data, repositories, and events from GitHub API.
- **Advanced Scoring**: Calculates a normalized `profile_score` based on followers, stars, forks, and account age.
- **Trending Score**: Evaluates recent activity (pushes, events) to determine current momentum.
- **Language Analytics**: Determines most used language and repository distribution.
- **Profile Comparison**: Compare up to 5 profiles side-by-side to determine a winner.
- **Caching**: In-memory caching for faster response times and reduced API calls.
- **Rate Limiting**: Multi-tier rate limiting for standard endpoints, analysis, and auth.
- **Authentication**: JWT-based authentication for protected endpoints (e.g., DELETE).
- **Swagger Documentation**: Beautiful, interactive API documentation.
- **Pagination & Filtering**: Sort, filter, and paginate through analyzed profiles.
- **Clean Architecture**: Built following MVC patterns and SOLID principles.

## Prerequisites

- Node.js (v18 or newer recommended)
- MySQL Server (v8.0+ recommended)

## Installation

1. **Clone the repository** (or download the source).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   Create a `.env` file in the root directory (you can copy `.env.example`):
   ```
   PORT=3000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=github_analyzer
   
   # Highly recommended: Add a GitHub Personal Access Token to avoid rate limits
   # Create one at: https://github.com/settings/tokens (no scopes required)
   GITHUB_TOKEN=ghp_your_token_here
   
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=24h
   ```

4. **Database Setup**:
   Ensure your MySQL server is running. The application will automatically create the required database schema on the first run (in development mode).
   
5. **Start the application**:
   ```bash
   # Development mode (auto-restarts on changes)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Documentation

Once the server is running, visit the interactive Swagger UI:
👉 **http://localhost:3000/api-docs**

## Key Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/github/analyze/:username` | Analyze & store a GitHub profile | No |
| `GET` | `/api/github/profiles` | List all stored profiles | No |
| `GET` | `/api/github/profile/:username` | Get a specific stored profile | No |
| `GET` | `/api/github/compare?users=a,b` | Compare multiple profiles | No |
| `DELETE` | `/api/github/profile/:username` | Delete a stored profile | Yes (JWT) |
| `GET` | `/api/github/stats` | View database statistics | No |
| `POST` | `/api/auth/register` | Register an admin account | No |
| `POST` | `/api/auth/login` | Login to receive JWT token | No |

## Testing

A Postman collection is provided in the `postman/` directory for easy testing.

To run the automated test suite (Jest):
```bash
npm test
```

## Deployment

This project is deployment-ready for platforms like Render, Railway, or Heroku.

**Render/Railway Deployment Steps:**
1. Connect your GitHub repository.
2. Set Build Command: `npm install`
3. Set Start Command: `npm start`
4. Add all environment variables from `.env`.
5. Ensure you provision a MySQL database and update the `DB_*` variables accordingly.

*(A `render.yaml` and `Procfile` are included for zero-config deployments).*
