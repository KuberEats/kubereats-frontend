# Frontend I18n

## Goal

KuberEats now supports Chinese and English for the employee ordering journey without adding a runtime dependency. The implementation is static-deploy friendly for GCS because it keeps translations in bundled TypeScript, uses hash routing unchanged, and does not require server-side route or locale negotiation.

## Locale Behavior

- Default locale is `zh-TW`.
- If `localStorage.kubereatsLocale` is set to `zh-TW` or `en`, that preference wins.
- If no saved preference exists and the browser language starts with `en`, the app starts in English.
- All other browser languages fall back to `zh-TW`.
- The selected locale is persisted to `localStorage.kubereatsLocale`.
- `document.documentElement.lang` is updated when the locale changes.

## Implementation

- `src/i18n/index.ts` owns locale state, message dictionaries, interpolation, browser detection, and persistence.
- Components call `useI18n()` and render text with `t('message.key')`.
- Non-component API error code can call `getMessage()` for current-locale error messages.
- The language switcher lives in `AppHeader`, so it is available after login on desktop and mobile.

## Current Coverage

The translated surfaces cover the core employee flow:

1. Login and registration labels.
2. App navigation and language switcher.
3. Merchant list search, filters, loading, empty, error, and recommendation dialog.
4. Merchant menu, cart panel, menu item actions, and validation messages.
5. Checkout review, submit success, failure, and retry copy.
6. Reservation status page.
7. Order history and order detail pages.
8. Normalized API fallback errors.

Merchant/admin/finance legacy pages are preserved and can be translated in a later pass.

## Testing

- Unit tests cover locale defaulting, browser English detection, interpolation, and persisted user preference.
- Mock E2E includes language switching and verifies the English preference survives reload.
- Existing checkout, merchant list/detail, state component, API, and reservation tests remain in Vitest.

## Backlog

- Translate merchant dashboard, merchant order management, finance, and committee review pages.
- Consider splitting dictionaries by feature if the message file grows much larger.
- Add product-level terminology review for English labels before external rollout.
- Add a CI browser image that can run Playwright Chromium in the current deployment environment.
