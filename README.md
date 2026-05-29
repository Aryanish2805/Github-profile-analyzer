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

## Frontend User Interface

A simple frontend is now served from the backend at the project root. Open the app in the browser after starting the server, then:

- Analyze any GitHub username from the UI
- Compare multiple usernames using comma-separated values
- View profile score, trending score, top repositories, and contribution insight

The frontend is available at:

`http://localhost:3000`

## Deployment

This project is deployment-ready for platforms like Render, Railway, Heroku, or any Docker-compatible host.

### Docker Deployment

A `Dockerfile` has been added so you can build and run the app as a container:

```bash
docker build -t github-profile-analyzer .
docker run -p 3000:3000 --env-file .env github-profile-analyzer
```

### Render / Railway Deployment Steps

1. Create a GitHub repository and push this code.
2. Connect your GitHub repository to Render or Railway.
3. Set Build Command: `npm install`
4. Set Start Command: `npm start`
5. Add environment variables from `.env`.
6. Provision a managed MySQL database and update `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.

### GitHub Repository Setup

To initialize a GitHub repository locally and push the project:

```bash
git init
git add .
git commit -m "Initial commit"
# Use GitHub CLI if installed
gh repo create github-profile-analyzer --public --source=. --remote=origin --push
```

If you do not have the GitHub CLI, create a new repository on github.com and follow the instructions to push the code.

*(A GitHub Actions workflow is also included for CI test coverage.)*
