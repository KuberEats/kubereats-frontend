import { expect, test, type Locator, type Page } from '@playwright/test'

type UserRole = 'employee' | 'merchant' | 'committee'

interface Account {
  username: string
  password: string
}

interface MerchantSpec {
  merchant_name: string
  campus: string
  category: string
  rating: string
  order_count: number
  min_order: string
  max_order_quantity: number
  delivery_time: string
  tags: string[]
  menus: [string, number, string][]
}

const merchantSpecs: MerchantSpec[] = [
  {
    merchant_name: '阿明便當',
    campus: '竹科',
    category: '台式便當',
    rating: '4.8',
    order_count: 126,
    min_order: '80.00',
    max_order_quantity: 50,
    delivery_time: '25-35 分鐘',
    tags: ['熱賣', '雞腿飯', '可團訂'],
    menus: [
      ['雞腿便當', 50, '120.00'],
      ['滷排骨飯', 40, '110.00'],
      ['清爽瓜仔肉飯', 35, '105.00'],
    ],
  },
  {
    merchant_name: '小森咖哩',
    campus: '竹科',
    category: '日式咖哩',
    rating: '4.6',
    order_count: 92,
    min_order: '120.00',
    max_order_quantity: 80,
    delivery_time: '30-40 分鐘',
    tags: ['人氣', '咖哩飯', '今日可訂'],
    menus: [
      ['起司豬排咖哩', 80, '150.00'],
      ['蔬菜雞肉咖哩', 55, '145.00'],
      ['清爽番茄咖哩', 35, '135.00'],
    ],
  },
  {
    merchant_name: '清爽蔬食盒',
    campus: '竹科',
    category: '健康餐盒',
    rating: '4.7',
    order_count: 76,
    min_order: '100.00',
    max_order_quantity: 35,
    delivery_time: '20-30 分鐘',
    tags: ['低卡', '蔬食', '午餐推薦', '清爽'],
    menus: [
      ['舒肥雞胸餐盒', 35, '130.00'],
      ['藜麥蔬食盒', 30, '125.00'],
      ['低卡鮭魚餐盒', 20, '165.00'],
    ],
  },
  {
    merchant_name: '竹科牛肉麵',
    campus: '竹科',
    category: '麵食',
    rating: '4.5',
    order_count: 88,
    min_order: '90.00',
    max_order_quantity: 45,
    delivery_time: '30-45 分鐘',
    tags: ['牛肉麵', '湯麵', '多人訂購'],
    menus: [
      ['紅燒牛肉麵', 45, '140.00'],
      ['清燉牛肉麵', 35, '145.00'],
      ['榨菜肉絲麵', 40, '95.00'],
    ],
  },
  {
    merchant_name: '竹科港式燒臘',
    campus: '竹科',
    category: '港式燒臘',
    rating: '4.4',
    order_count: 104,
    min_order: '95.00',
    max_order_quantity: 60,
    delivery_time: '25-35 分鐘',
    tags: ['燒臘', '三寶飯', '熱門'],
    menus: [
      ['三寶飯', 60, '115.00'],
      ['蜜汁叉燒飯', 45, '110.00'],
      ['脆皮燒肉飯', 40, '125.00'],
    ],
  },
  {
    merchant_name: '泰香打拋',
    campus: '竹科',
    category: '泰式',
    rating: '4.3',
    order_count: 67,
    min_order: '100.00',
    max_order_quantity: 45,
    delivery_time: '20-30 分鐘',
    tags: ['泰式', '打拋豬', '酸辣', '換口味'],
    menus: [
      ['打拋豬飯', 45, '125.00'],
      ['綠咖哩雞飯', 35, '135.00'],
      ['泰式椒麻雞', 30, '145.00'],
    ],
  },
  {
    merchant_name: '首爾飯桌',
    campus: '竹科',
    category: '韓式',
    rating: '4.2',
    order_count: 58,
    min_order: '110.00',
    max_order_quantity: 40,
    delivery_time: '35-45 分鐘',
    tags: ['韓式', '泡菜', '辣', '石鍋飯'],
    menus: [
      ['泡菜豬肉飯', 40, '130.00'],
      ['韓式拌飯', 35, '125.00'],
      ['辣炒年糕', 25, '110.00'],
    ],
  },
  {
    merchant_name: '義起吃麵',
    campus: '竹科',
    category: '義式',
    rating: '4.1',
    order_count: 52,
    min_order: '120.00',
    max_order_quantity: 35,
    delivery_time: '30-40 分鐘',
    tags: ['義大利麵', '奶油', '番茄', '焗烤'],
    menus: [
      ['青醬雞肉義大利麵', 30, '150.00'],
      ['番茄海鮮義大利麵', 25, '170.00'],
      ['奶油培根燉飯', 35, '145.00'],
    ],
  },
  {
    merchant_name: '海苔壽司屋',
    campus: '竹科',
    category: '日式',
    rating: '4.5',
    order_count: 49,
    min_order: '90.00',
    max_order_quantity: 30,
    delivery_time: '15-25 分鐘',
    tags: ['壽司', '日式', '清爽', '冷食'],
    menus: [
      ['鮭魚壽司盒', 30, '160.00'],
      ['豆皮壽司', 35, '95.00'],
      ['海苔花壽司', 30, '110.00'],
    ],
  },
  {
    merchant_name: '麻辣研究所',
    campus: '竹科',
    category: '麻辣',
    rating: '4.6',
    order_count: 72,
    min_order: '120.00',
    max_order_quantity: 30,
    delivery_time: '35-50 分鐘',
    tags: ['麻辣', '重口味', '辣', '宵夜'],
    menus: [
      ['麻辣鴨血豆腐', 30, '120.00'],
      ['麻辣牛肉拌麵', 25, '150.00'],
      ['香辣雞腿飯', 30, '135.00'],
    ],
  },
  {
    merchant_name: '早安蛋餅',
    campus: '竹科',
    category: '早餐',
    rating: '4.0',
    order_count: 134,
    min_order: '60.00',
    max_order_quantity: 100,
    delivery_time: '10-20 分鐘',
    tags: ['早餐', '蛋餅', '快速', '便宜'],
    menus: [
      ['起司蛋餅', 100, '55.00'],
      ['鮪魚蛋餅', 80, '65.00'],
      ['蘿蔔糕套餐', 60, '85.00'],
    ],
  },
  {
    merchant_name: '墨西哥捲餅吧',
    campus: '竹科',
    category: '墨西哥',
    rating: '4.2',
    order_count: 31,
    min_order: '120.00',
    max_order_quantity: 25,
    delivery_time: '25-35 分鐘',
    tags: ['墨西哥', '捲餅', '異國', '清爽'],
    menus: [
      ['雞肉莎莎捲餅', 25, '135.00'],
      ['牛肉起司捲餅', 20, '150.00'],
      ['酪梨蔬菜捲餅', 18, '145.00'],
    ],
  },
  {
    merchant_name: '南科牛肉麵',
    campus: '南科',
    category: '麵食',
    rating: '4.5',
    order_count: 88,
    min_order: '90.00',
    max_order_quantity: 45,
    delivery_time: '30-45 分鐘',
    tags: ['牛肉麵', '湯麵', '多人訂購'],
    menus: [['紅燒牛肉麵', 45, '140.00']],
  },
  {
    merchant_name: '中科港式燒臘',
    campus: '中科',
    category: '港式',
    rating: '4.4',
    order_count: 104,
    min_order: '95.00',
    max_order_quantity: 60,
    delivery_time: '25-35 分鐘',
    tags: ['燒臘', '三寶飯', '熱門'],
    menus: [['三寶飯', 60, '115.00']],
  },
]

const defaultTimeout = 20_000

function cssString(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function merchantCardSelector(merchantName: string) {
  return `[data-merchant-name=${cssString(merchantName)}]`
}

function menuItemSelector(itemName: string) {
  return `[data-menu-item-name=${cssString(itemName)}]`
}

async function fillByTestIdOrInput(page: Page, testId: string, inputIndex: number, value: string) {
  const testIdInput = page.getByTestId(testId)

  if (await testIdInput.count()) {
    await testIdInput.fill(value)
    return
  }

  await page.locator('form input').nth(inputIndex).fill(value)
}

async function selectByTestIdOrSelect(page: Page, testId: string, selectIndex: number, value: string) {
  const testIdSelect = page.getByTestId(testId)

  if (await testIdSelect.count()) {
    await testIdSelect.selectOption(value)
    return
  }

  await page.locator('form select').nth(selectIndex).selectOption(value)
}

async function clickByTestIdOrButton(page: Page, testId: string, buttonName: string) {
  const testIdButton = page.getByTestId(testId)

  if (await testIdButton.count()) {
    await testIdButton.click()
    return
  }

  await page.getByRole('button', { name: buttonName }).click()
}

async function clickWithinByTestIdOrButton(scope: Locator, testId: string, buttonName: string) {
  const testIdButton = scope.getByTestId(testId)

  if (await testIdButton.count()) {
    await testIdButton.click()
    return
  }

  await scope.getByRole('button', { name: buttonName }).click()
}

async function confirmDialogAction(page: Page, confirmLabel: string) {
  const testIdDialog = page.getByTestId('confirm-dialog')

  if (await testIdDialog.count()) {
    await expect(testIdDialog).toBeVisible({ timeout: defaultTimeout })
    await page.getByTestId('confirm-dialog-confirm-button').click()
    await expect(testIdDialog).toBeHidden({ timeout: defaultTimeout })
    return
  }

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: defaultTimeout })
  await dialog.getByRole('button', { name: confirmLabel }).click()
  await expect(dialog).toBeHidden({ timeout: defaultTimeout })
}

async function fillByTestIdPlaceholderOrInput(
  page: Page,
  testId: string,
  placeholder: string,
  inputIndex: number,
  value: string,
) {
  const testIdInput = page.getByTestId(testId)

  if (await testIdInput.count()) {
    await testIdInput.fill(value)
    return
  }

  const placeholderInput = page.getByPlaceholder(placeholder)

  if (await placeholderInput.count()) {
    await placeholderInput.fill(value)
    return
  }

  await page.locator('form input').nth(inputIndex).fill(value)
}

async function registerAndLogin(page: Page, account: Account, role: UserRole) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible({ timeout: defaultTimeout })

  await page.getByTestId('auth-mode-toggle').click()
  await expect(page.getByRole('heading', { name: '註冊' })).toBeVisible()
  await page.getByTestId('auth-username-input').fill(account.username)
  await page.getByTestId('auth-password-input').fill(account.password)
  await selectRegisterRole(page, role)
  await page.getByTestId('auth-submit-button').click()
  await expect(page.getByText('註冊成功，請登入。')).toBeVisible({ timeout: defaultTimeout })

  await login(page, account, role)
}

async function selectRegisterRole(page: Page, role: UserRole) {
  const testIdSelect = page.getByTestId('auth-role-select')

  if (await testIdSelect.count()) {
    await testIdSelect.selectOption(role)
    return
  }

  await page.getByRole('combobox').selectOption(role)
}

async function login(page: Page, account: Account, role: UserRole) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible({ timeout: defaultTimeout })
  await page.getByTestId('auth-username-input').fill(account.username)
  await page.getByTestId('auth-password-input').fill(account.password)
  await page.getByTestId('auth-submit-button').click()

  if (role === 'committee') {
    await expect(page).toHaveURL(/\/committee\/review$/, { timeout: defaultTimeout })
    return
  }

  if (role === 'merchant') {
    await page.waitForURL(/\/merchant\/(apply|dashboard)$/, { timeout: defaultTimeout })
    return
  }

  await expect(page).toHaveURL(/\/merchants$/, { timeout: defaultTimeout })
}

async function logout(page: Page) {
  const logoutButton = page.getByRole('button', { name: '登出' })
  if (await logoutButton.isVisible()) {
    await logoutButton.click()
  }
  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible({ timeout: defaultTimeout })
}

async function applyMerchant(page: Page, spec: MerchantSpec) {
  await page.goto('/merchant/apply')
  await expect(page.getByRole('heading', { name: '商家申請加入平台' })).toBeVisible({ timeout: defaultTimeout })
  await fillByTestIdOrInput(page, 'merchant-apply-name-input', 0, spec.merchant_name)
  await selectByTestIdOrSelect(page, 'merchant-apply-campus-select', 0, spec.campus)
  await fillByTestIdOrInput(page, 'merchant-apply-category-input', 1, spec.category)
  await fillByTestIdOrInput(page, 'merchant-apply-min-order-input', 2, spec.min_order)
  await fillByTestIdOrInput(
    page,
    'merchant-apply-max-order-quantity-input',
    3,
    String(spec.max_order_quantity),
  )
  await fillByTestIdOrInput(page, 'merchant-apply-delivery-time-input', 4, spec.delivery_time)
  await fillByTestIdOrInput(page, 'merchant-apply-tags-input', 5, spec.tags.join(', '))
  await clickByTestIdOrButton(page, 'merchant-apply-submit-button', '送出申請')
  await expect(page.getByText('申請已送出，請等待福委會審核。')).toBeVisible({ timeout: defaultTimeout })
}

async function waitForReviewPage(page: Page) {
  await page.goto('/committee/review')
  await expect(page.getByRole('heading', { name: '福委會 — 商家審核' })).toBeVisible({ timeout: defaultTimeout })
  await expect(page.getByText('載入中...')).toBeHidden({ timeout: defaultTimeout })
}

async function approvePendingMerchant(page: Page, merchantName: string) {
  let pendingCards = page.locator(merchantCardSelector(merchantName)).filter({ hasText: '待審核' })
  if (await pendingCards.count() === 0) {
    pendingCards = page.locator('.merchant-card').filter({ hasText: merchantName }).filter({ hasText: '待審核' })
  }

  const pendingCount = await pendingCards.count()
  expect(pendingCount, `pending merchant "${merchantName}" should exist`).toBeGreaterThan(0)

  for (let i = 0; i < pendingCount; i += 1) {
    await clickWithinByTestIdOrButton(pendingCards.first(), 'committee-approve-button', '通過')
    await confirmDialogAction(page, '通過')
    await expect(page.getByText('載入中...')).toBeHidden({ timeout: defaultTimeout })
  }
}

async function createMenus(page: Page, spec: MerchantSpec) {
  await page.goto('/merchant/dashboard')
  const dashboardName = page.getByTestId('merchant-dashboard-name')
  if (await dashboardName.count()) {
    await expect(dashboardName).toContainText(spec.merchant_name, { timeout: defaultTimeout })
  } else {
    await expect(page.getByRole('heading', { name: spec.merchant_name })).toBeVisible({ timeout: defaultTimeout })
  }

  const auditStatus = page.getByTestId('merchant-audit-status')
  if (await auditStatus.count()) {
    await expect(auditStatus).toContainText('已通過', { timeout: defaultTimeout })
  } else {
    await expect(page.getByText('狀態：已通過')).toBeVisible({ timeout: defaultTimeout })
  }

  for (const [itemName, maxDailyQuantity, price] of spec.menus) {
    await clickByTestIdOrButton(page, 'merchant-add-menu-toggle', '新增菜品')
    await fillByTestIdPlaceholderOrInput(page, 'merchant-menu-name-input', '品名', 0, itemName)
    await fillByTestIdPlaceholderOrInput(page, 'merchant-menu-price-input', '價格', 1, price)
    await fillByTestIdPlaceholderOrInput(
      page,
      'merchant-menu-capacity-input',
      '每日限量',
      2,
      String(maxDailyQuantity),
    )
    await clickByTestIdOrButton(page, 'merchant-menu-create-button', '新增')

    const menuItem = page.locator(menuItemSelector(itemName))
    if (await menuItem.count()) {
      await expect(menuItem).toBeVisible({ timeout: defaultTimeout })
      await expect(menuItem).toContainText(`每日限量 ${maxDailyQuantity} 份`)
    } else {
      const createdMenuItem = page.locator('.menu-item').filter({ hasText: itemName })
      await expect(createdMenuItem).toBeVisible({ timeout: defaultTimeout })
      await expect(createdMenuItem).toContainText(`每日限量 ${maxDailyQuantity} 份`)
    }
  }
}

test('creates many merchant users, approves them, and creates menus', async ({ page }) => {
  test.setTimeout(15 * 60 * 1000)

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const password = `E2E-${runId}-Pass!`
  const committeeAccount = {
    username: `e2e-committee-${runId}@example.com`,
    password,
  }
  const merchantAccounts = merchantSpecs.map((spec, index) => ({
    spec,
    account: {
      username: `e2e-merchant-${index + 1}-${runId}@example.com`,
      password,
    },
  }))

  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await test.step('register a committee reviewer', async () => {
    await registerAndLogin(page, committeeAccount, 'committee')
    await logout(page)
  })

  await test.step('register merchant users and submit merchant applications', async () => {
    for (const { spec, account } of merchantAccounts) {
      await registerAndLogin(page, account, 'merchant')
      await applyMerchant(page, spec)
      await logout(page)
    }
  })

  await test.step('approve every pending merchant application', async () => {
    await login(page, committeeAccount, 'committee')
    await waitForReviewPage(page)

    for (const spec of merchantSpecs) {
      await approvePendingMerchant(page, spec.merchant_name)
    }

    await logout(page)
  })

  await test.step('log in as each approved merchant and create menu items', async () => {
    for (const { spec, account } of merchantAccounts) {
      await login(page, account, 'merchant')
      await createMenus(page, spec)
      await logout(page)
    }
  })
})
