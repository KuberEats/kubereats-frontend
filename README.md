# KuberEats Frontend

## Tech Stack

- **Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **Router**: Hand-written (no Vue Router)
- **HTTP Client**: Native fetch wrapper (no Axios)
- **UI**: Custom CSS (no UI framework)

## Project Structure

```
src/
├── main.ts                          # App entry point
├── style.css                        # Global styles
├── App.vue                          # Root component + role-based navbar
├── router/
│   └── index.ts                     # Hand-written router with pushState
├── api/
│   ├── client.ts                    # Fetch wrapper with JWT auto-refresh
│   ├── types.ts                     # TypeScript interfaces
│   ├── auth.ts                      # Auth API (register, login, getMe)
│   ├── merchants.ts                 # Merchant API (apply, menu CRUD, orders)
│   └── committee.ts                 # Committee API (list, approve, reject)
└── pages/
    ├── LoginPage.vue                # Login / Register with role selection
    ├── merchant/
    │   ├── MerchantApplyPage.vue    # Merchant application form
    │   ├── MerchantDashboardPage.vue # Merchant info + menu CRUD
    │   └── MerchantOrdersPage.vue   # Today's order summary
    └── committee/
        └── CommitteeReviewPage.vue  # Pending / All merchants, approve/reject
```

## Pages & Routes

| Path                  | Page                   | Role      | Description          |
|-----------------------|------------------------|-----------|----------------------|
| `/login`              | LoginPage              | —         | Login / Register     |
| `/merchant/apply`     | MerchantApplyPage      | merchant  | Apply to platform    |
| `/merchant/dashboard` | MerchantDashboardPage  | merchant  | Info + menu CRUD     |
| `/merchant/orders`    | MerchantOrdersPage     | merchant  | Today's order summary|
| `/committee/review`   | CommitteeReviewPage    | committee | Merchant audit       |

## Features

- **Role-based navigation**: merchant sees dashboard + orders, committee sees review
- **JWT auto-refresh**: 401 responses trigger token refresh automatically
- **camelCase API**: All request/response fields use camelCase

## Setup

### 1. Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8000`

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Dev Server

```bash
npm run dev
```

Open http://localhost:5173

## User Flow

```
Register (choose role: merchant / committee)
    ↓
Login → get JWT token
    ↓
┌─ merchant ──────────────────────────┐
│  Apply → fill form (name, campus,   │
│          category, maxOrderQuantity) │
│  Wait for committee approval        │
│  Manage menu (add / edit / delete)  │
│  View today's order summary         │
└─────────────────────────────────────┘
┌─ committee ─────────────────────────┐
│  Review pending merchants           │
│  Approve / Reject                   │
│  View all merchants                 │
└─────────────────────────────────────┘
```

## Notice

切去 dev 的 branch
記得 pull push
