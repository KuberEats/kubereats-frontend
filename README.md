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

## E2E Release Verification

The project uses Playwright for one minimal end-to-end preorder flow:

1. Open the frontend.
2. Register a random employee account through the website.
3. Log in with that account.
4. Open the merchant list.
5. Select the configured E2E merchant.
6. Select the configured E2E menu item.
7. Add it to cart and submit the preorder reservation.
8. Verify the reservation status page is shown.

### Environment variables

Set these locally or as GitHub Actions variables:

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `E2E_BASE_URL` | CI: yes | `http://127.0.0.1:5173` locally | Frontend URL to test. If omitted locally, Playwright starts Vite dev server. |
| `VITE_API_BASE_URL` | yes for local server | `https://api.kubereats.click` in Playwright web server | Backend API base URL used by the frontend. |
| `E2E_API_BASE_URL` | no | `VITE_API_BASE_URL` or `https://api.kubereats.click` | API URL used by the seed verification script. |
| `E2E_CAMPUS` | no | `竹科` | Campus containing the E2E merchant. |
| `E2E_MERCHANT_NAME` | no | `E2E 測試商家` | Stable merchant fixture name. |
| `E2E_MENU_ITEM_NAME` | no | `E2E 測試餐點` | Stable menu item fixture name. |
| `E2E_SEED_WEBHOOK_URL` | no | empty | Optional backend/jumphost webhook that creates the merchant/menu fixture. |
| `E2E_SEED_TOKEN` | no | empty | Bearer token for `E2E_SEED_WEBHOOK_URL`; store as a secret. |

Do not commit real credentials, database URLs, JWT secrets, or test account passwords. The E2E test creates a random user account through the UI on every run.

### Prepare E2E data

The frontend cannot directly create approved merchant/menu records with the public employee UI. The seed script verifies that the target backend has the configured E2E merchant and menu item:

```sh
VITE_API_BASE_URL=https://api.kubereats.click \
E2E_MERCHANT_NAME="E2E 測試商家" \
E2E_MENU_ITEM_NAME="E2E 測試餐點" \
npm run seed:e2e-data
```

If your environment exposes a protected seed webhook, provide it and the script will call it before verification:

```sh
E2E_SEED_WEBHOOK_URL=https://internal.example/seed/kubereats-e2e \
E2E_SEED_TOKEN=... \
npm run seed:e2e-data
```

For locked-down staging environments, run this from a self-hosted runner or GCP jumphost that can reach the protected seed webhook/backend.

### Run locally

Install Playwright browsers once:

```sh
npx playwright install chromium
```

Run the E2E test against a deployed/staging frontend:

```sh
E2E_BASE_URL=https://your-frontend.example \
VITE_API_BASE_URL=https://api.kubereats.click \
npm run test:e2e
```

Run against local Vite while using a remote API:

```sh
VITE_API_BASE_URL=https://api.kubereats.click npm run test:e2e
```

Useful modes:

```sh
npm run test:e2e:headed
npm run test:e2e:ui
```

### CI report

The `E2E Release Verification` workflow installs dependencies, installs Chromium, verifies seed data, and runs Playwright. It always uploads:

- `playwright-report/`
- `test-results/playwright/` including traces, screenshots, and videos retained on failure

When CI fails, download the artifacts from the workflow run and open:

```sh
npx playwright show-report playwright-report
```
