import { expect, test } from '@playwright/test'

const merchantName = process.env.E2E_MERCHANT_NAME ?? 'E2E 測試商家'
const menuItemName = process.env.E2E_MENU_ITEM_NAME ?? 'E2E 測試餐點'

test('employee can register, login, and submit a preorder reservation', async ({ page }) => {
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const username = `e2e-user-${runId}@example.com`
  const password = `E2E-${runId}-Pass!`

  await page.goto('/login')

  await page.getByTestId('auth-mode-toggle').click()
  await expect(page.getByRole('heading', { name: '註冊' })).toBeVisible()

  await page.getByTestId('auth-username-input').fill(username)
  await page.getByTestId('auth-password-input').fill(password)
  await page.getByTestId('auth-submit-button').click()
  await expect(page.getByText('註冊成功，請登入。')).toBeVisible()

  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible()
  await page.getByTestId('auth-username-input').fill(username)
  await page.getByTestId('auth-password-input').fill(password)
  await page.getByTestId('auth-submit-button').click()
  await expect(page).toHaveURL(/\/merchants$/)

  const merchantCard = page.locator('[data-merchant-name]').filter({ hasText: merchantName })
  await expect(merchantCard, `Merchant "${merchantName}" should exist in E2E data`).toBeVisible()
  await merchantCard.click()
  await expect(page).toHaveURL(/\/merchants\/\d+$/)

  const menuItem = page.locator('[data-menu-item-name]').filter({ hasText: menuItemName })
  await expect(menuItem, `Menu item "${menuItemName}" should exist in E2E data`).toBeVisible()
  await menuItem.getByTestId('add-menu-item-button').click()

  await expect(page.getByTestId('cart-panel')).toContainText(menuItemName)
  await page.getByTestId('submit-order-button').click()

  await expect(page).toHaveURL(/\/reservation-status\/[^/]+$/)
  await expect(page.getByTestId('reservation-status-card')).toBeVisible()
  await expect(page.getByTestId('reservation-status-title')).toContainText(
    /正在確認預訂名額|預訂成功|預訂失敗|訂單已取消|預訂已逾時/,
  )
})
