# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).


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
