import { expect, test, type Page } from '@playwright/test'

const merchant = {
  id: 7,
  name: '阿明便當',
  campus: '竹科',
  category: '便當',
  rating: 4.8,
  orderCount: 120,
  minOrder: 0,
  deliveryTime: '25 分鐘',
  tags: ['雞腿飯', '熱門'],
}

const menuItem = {
  id: 11,
  merchantId: 7,
  itemName: '雞腿便當',
  price: 120,
  maxDailyQuantity: 20,
  imageId: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

async function mockApi(page: Page, submitStatus = 202) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock-access')
    localStorage.setItem('refreshToken', 'mock-refresh')
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'employee' }))
  })

  await page.route('**/auth/me', route => route.fulfill({
    json: {
      id: 1,
      username: 'employee@example.com',
      email: null,
      role: 'employee',
      isActive: true,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    },
  }))
  await page.route('**/merchants/7/menus', route => route.fulfill({ json: [menuItem] }))
  await page.route('**/merchants/7', route => route.fulfill({ json: merchant }))
  await page.route('**/merchants?**', route => route.fulfill({ json: [merchant] }))
  await page.route('**/order-scheduler/reservation-requests', route => {
    if (submitStatus >= 400) {
      return route.fulfill({
        status: submitStatus,
        json: { detail: '庫存不足' },
      })
    }
    return route.fulfill({
      status: submitStatus,
      json: {
        order_token: 'mock-token',
        status: 'PENDING_RESERVATION',
        message: 'accepted',
      },
    })
  })
}

test('user can browse merchants and open merchant detail', async ({ page }) => {
  await mockApi(page)

  await page.goto('/#/merchants')
  await expect(page.getByText('阿明便當')).toBeVisible()
  await page.getByLabel('查看 阿明便當 菜單').click()

  await expect(page).toHaveURL(/#\/merchants\/7/)
  await expect(page.getByText('今日菜單')).toBeVisible()
})

test('user can switch language and keep preference after reload', async ({ page }) => {
  await mockApi(page)

  await page.goto('/#/merchants')
  await page.getByLabel('語言').selectOption('en')

  await expect(page.getByRole('heading', { name: '竹科 Ordering' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Orders' })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { name: '竹科 Ordering' })).toBeVisible()
})

test('user can add item to cart and reach checkout', async ({ page }) => {
  await mockApi(page)

  await page.goto('/#/merchants/7')
  await page.getByTestId('add-menu-item-button').click()
  await page.getByTestId('submit-order-button').click()

  await expect(page).toHaveURL(/#\/checkout/)
  await expect(page.getByText('確認訂單')).toBeVisible()
  await expect(page.getByText('雞腿便當')).toBeVisible()
})

test('checkout API failure shows retryable error', async ({ page }) => {
  await mockApi(page, 409)

  await page.goto('/#/merchants/7')
  await page.getByTestId('add-menu-item-button').click()
  await page.getByTestId('submit-order-button').click()
  await page.getByTestId('checkout-submit-button').click()

  await expect(page.getByText('庫存不足')).toBeVisible()
  await expect(page.getByRole('button', { name: '再試一次' })).toBeVisible()
})
