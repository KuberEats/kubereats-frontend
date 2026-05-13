# KuberEats Frontend

## Tech Stack

- **Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **Router**: Hand-written (no Vue Router)
- **HTTP Client**: Native fetch wrapper (no Axios)
- **UI**: Custom CSS (no UI framework)



## Add docker-compose.yml at root

```
root/
 kubereats-frontend/
 kubereats-backend/
 docker-compose.yml


```

```
services:
  frontend:
    build:
      context: ./kubereats-frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./kubereats-frontend:/app
      - /app/node_modules

```

## Run with Docker

Build and start the frontend:

```sh
docker compose up --build
```

