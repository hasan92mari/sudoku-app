# Sudoku Cloud App

This project is now structured as a cloud-ready Sudoku application with:

- React frontend with theme toggle (dark/light), language switcher (English / Arabic / German), and session-based welcome flow
- Node.js backend with Redis-backed session handling, player bans, leaderboard persistence, and admin access via the name `admin`
- Separate Redis data store for session and leaderboard state
- Docker Compose setup for local development and container-based deployment
- Multi-stage frontend Docker image for production deployment
- GitHub Actions workflow for image publishing

## Features

- Player enters a name and is greeted with a personalized welcome message
- Supports 3 languages: English, Arabic, German
- Supports 2 visual themes: dark and light
- Session data is stored in browser session storage and backed by Redis on the backend
- Admin mode is enabled by entering `admin`
- Admin can ban players for a chosen duration and view active bans
- Players who are banned see a countdown and cannot play until the block expires
- Leaderboard is stored in Redis sorted sets and exposed through the API
- Frontend can be deployed as a static React build behind Nginx

## Architecture

- Frontend: React + Vite + Nginx
- Backend: Node.js + Express
- Data layer: Redis
- Local orchestration: Docker Compose
- Cloud deployment: Docker images + environment variables for external Redis and API endpoint

## Project structure

```text
sudoku-app/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── .github/
│   └── workflows/
├── .gitignore
├── .dockerignore
├── .env.example
├── docker-compose.yml
├── sudoku-all.yaml
├── README.md
└── .gitignore
```

## Local run

1. Copy the sample environment file:

```bash
cp .env.example .env
```

2. Start the application with Docker Compose:

```bash
docker compose up --build
```

3. Open the app in the browser:

```text
http://localhost
```

4. Stop the app:

```bash
docker compose down
```

## Environment variables

The sample environment file includes the most common variables:

```env
PORT=5000
REDIS_URL=redis://localhost:6379
SESSION_TTL_SECONDS=86400
VITE_API_BASE_URL=http://localhost:5000/api
```

For cloud deployment, replace `REDIS_URL` and `VITE_API_BASE_URL` with the values of your managed Redis instance and deployed backend URL.

## Cloud deployment notes

This project is designed to be deployed in separate environments.

- Backend can run on Cloud Run / Render / Railway / Fly.io
- Redis should be provisioned separately as a managed service
- Frontend can be built as a static site and deployed behind a CDN or container platform
- `VITE_API_BASE_URL` must be set at build time for the frontend image

## Kubernetes

The included `sudoku-all.yaml` can still be used as a starting point for Kubernetes-based deployment. Update the image names and environment variables to match your registry and Redis endpoint.

## GitHub Actions

The workflow at `.github/workflows/deploy.yml` builds and pushes the frontend and backend images to Docker Hub. Add your Docker Hub credentials as repository secrets if you want to publish images automatically.

## Notes

- Admin access is available by entering the name `admin`
- Player bans are stored in Redis and exposed via `/api/admin/players`
- Leaderboard rankings are stored in Redis sorted sets and available via `/api/leaderboard`
- The frontend session is saved in the browser session storage, while the server session and ban state are saved in Redis
