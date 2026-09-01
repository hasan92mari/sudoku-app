# Sudoku Microservices Application

A containerized Sudoku application built as a **training project** to practice and demonstrate modern software development and DevOps concepts.

The application follows a simple **microservices architecture**, where the frontend and backend are developed and deployed as independent services.

## Architecture

The application consists of three main components:

- **Frontend Microservice** — React + Vite
- **Backend Microservice** — Node.js + Express
- **Database** — Redis

Each service is containerized using **Docker** and can be deployed locally using Docker Compose or to a Kubernetes cluster using Minikube.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | Redis |
| Containerization | Docker |
| Local Deployment | Docker Compose |
| Orchestration | Kubernetes, Minikube |
| CI/CD | GitHub Actions |
| Web Server | Nginx |

## DevOps & Infrastructure

This project was designed to practice a complete development and deployment workflow:

**Development → Docker → CI/CD → Deployment**

### Docker

Docker is used to package the frontend and backend services into independent containers.

This provides:

- Consistent environments
- Service isolation
- Reproducible deployments
- Easy local development

### Docker Compose

Docker Compose is used to run the complete application locally, including the frontend, backend, and Redis services.

### Kubernetes

The application can also be deployed to Kubernetes using **Minikube**.

Kubernetes is responsible for managing the application containers and providing service discovery between the different components.

### CI/CD

GitHub Actions is used to automate the CI/CD workflow.

On every push to the `main` branch, the pipeline:

1. Builds the Docker images
2. Publishes the images to Docker Hub
3. Makes the images available for deployment

Docker images:

- `hasanmar/sudoku-frontend`
- `hasanmar/sudoku-backend`

## Project Structure

```text
sudoku-app/
├── frontend/              # React frontend microservice
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/               # Node.js backend microservice
│   ├── src/
│   └── Dockerfile
│
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
│
├── docker-compose.yml     # Local container orchestration
├── sudoku-all.yaml        # Kubernetes resources
└── README.md
```

## Running the Application

### Prerequisites

You only need:

- Docker
- Docker Compose

For Kubernetes deployment:

- Minikube
- kubectl

### Docker Compose

Clone the repository:

```bash
git clone https://github.com/HasanMariam/sudoku-app.git
cd sudoku-app
```

Start the application:

```bash
docker compose up -d
```

The application will be available at:

```text
http://localhost
```

To stop the application:

```bash
docker compose down
```

## Kubernetes Deployment

Start Minikube:

```bash
minikube start
```

Apply the Kubernetes configuration:

```bash
kubectl apply -f sudoku-all.yaml
```

Check the deployed resources:

```bash
kubectl get pods
kubectl get services
```

Access the frontend:

```bash
minikube service frontend-service
```

## Purpose

This project was created as a practical **learning and training project** to gain hands-on experience with:

- Microservices architecture
- React and Node.js
- Redis
- Docker and containerization
- Docker Compose
- Kubernetes
- Minikube
- GitHub Actions
- CI/CD automation
- Service networking and deployment

The main goal is to understand how an application can move from local development to a **containerized and orchestrated environment** using modern DevOps tools.
