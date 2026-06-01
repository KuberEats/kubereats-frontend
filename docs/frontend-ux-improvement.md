# Frontend UX Improvement

## Scope

This change focuses on the employee ordering journey in the existing Vue 3 + TypeScript + Vite frontend. It keeps the hand-written router, native fetch API layer, npm scripts, and current backend API contract.

## Personas

- Employee / general user: needs to find restaurants quickly, add meals, confirm totals, and track reservation status.
- Merchant: needs existing dashboard and order workflows preserved.
- Committee / administrator: needs existing review and finance workflows preserved.

This iteration prioritizes the employee ordering path.

## Core Journey

1. Log in.
2. Browse and search merchants.
3. Open a merchant menu.
4. Add items to cart and adjust quantity.
5. Review checkout details.
6. Submit reservation request.
7. View reservation status or order history.

## User Stories And Acceptance Criteria

### Search Restaurants Quickly

As an employee, I want to search restaurants quickly so that I can decide what to eat.

Acceptance criteria:
- Merchant list supports text search across name, category, campus, tags, and recommendation reason.
- Users can filter by all, open, hot, and available categories.
- Users can sort by backend-supported popularity options or local name order.
- Loading, empty, and API error states are visible and retryable.
- Mobile layout remains single-column and avoids horizontal scrolling at 375px.

### Clear Cart Totals

As an employee, I want clear cart totals before submitting so that I avoid wrong orders.

Acceptance criteria:
- Menu items show price, capacity, and disabled sold-out states when available.
- Users can add an item and then adjust quantity with keyboard-friendly controls.
- Cart summary shows item count, total, and minimum order gap.
- Checkout page shows item, unit price, quantity, subtotal, and final total before submit.
- Submit is disabled during pending requests and when cart is invalid.

### Clear Ordering Errors

As an employee, I want clear error messages when ordering fails so that I know what to do next.

Acceptance criteria:
- API errors are normalized into `ApiError` with status, code, message, and details.
- 401, 403, 404, 409, 422, 500, and network failures show user-readable messages.
- Checkout failures keep the cart so the user can retry or adjust quantities.
- Session expiry redirects to login with `returnUrl`, then returns to the intended page after login.

## Modified Files

- `src/api/client.ts`
- `src/api/types.ts`
- `src/router/index.ts`
- `src/App.vue`
- `src/components/CartPanel.vue`
- `src/components/MenuItemCard.vue`
- `src/components/MerchantCard.vue`
- `src/components/ux/*`
- `src/composables/useCart.ts`
- `src/i18n/index.ts`
- `src/utils/formatters.ts`
- `src/pages/LoginPage.vue`
- `src/pages/MerchantListPage.vue`
- `src/pages/MerchantDetailPage.vue`
- `src/pages/CheckoutPage.vue`
- `src/pages/OrderHistoryPage.vue`
- `src/pages/OrderDetailPage.vue`
- `src/style.css`
- `src/**/__tests__/*`
- `tests/e2e/order-flow.spec.ts`
- `tests/e2e/merchant-onboarding-seed.spec.ts`
- `tests/e2e/mock-order-flow.spec.ts`
- `package.json`
- `.github/workflows/ci.yml`
- `docs/frontend-i18n.md`

## UX Backlog

- Add real merchant operating-hours data when backend exposes it.
- Add item-level images and item descriptions once backend returns stable fields.
- Add checkout notes / diner contact fields when backend accepts those fields.
- Add dedicated reservation detail history endpoint instead of relying on the latest token in local storage.
- Add mobile visual regression screenshots for 375px and desktop breakpoints.
- Add optional mock E2E workflow to CI once runtime budget is agreed.
