#!/usr/bin/env node

const apiBaseUrl = stripTrailingSlash(
  process.env.E2E_API_BASE_URL
  ?? process.env.VITE_API_BASE_URL
  ?? 'https://api.kubereats.click',
)
const campus = process.env.E2E_CAMPUS ?? '竹科'
const merchantName = process.env.E2E_MERCHANT_NAME ?? 'E2E 測試商家'
const menuItemName = process.env.E2E_MENU_ITEM_NAME ?? 'E2E 測試餐點'
const seedWebhookUrl = process.env.E2E_SEED_WEBHOOK_URL

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

async function requestJson(url, options) {
  const response = await fetch(url, options)
  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`${url} returned non-JSON response: ${text.slice(0, 120)}`)
    }
  }

  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}: ${text.slice(0, 240)}`)
  }

  return data
}

async function runWebhookSeed() {
  if (!seedWebhookUrl) return

  await requestJson(seedWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.E2E_SEED_TOKEN
        ? { Authorization: `Bearer ${process.env.E2E_SEED_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      campus,
      merchant_name: merchantName,
      menu_item_name: menuItemName,
    }),
  })
}

async function verifySeedData() {
  const merchantParams = new URLSearchParams({
    campus,
    sort_by: 'recommend',
    date: new Date().toISOString().slice(0, 10),
  })
  const merchants = await requestJson(`${apiBaseUrl}/merchants?${merchantParams.toString()}`)
  const merchant = Array.isArray(merchants)
    ? merchants.find(item => item?.name === merchantName)
    : null

  if (!merchant?.id) {
    throw new Error(
      `Missing E2E merchant "${merchantName}" in campus "${campus}". `
      + 'Create an approved merchant/menu fixture in the target backend, or set E2E_SEED_WEBHOOK_URL.',
    )
  }

  const menuItems = await requestJson(`${apiBaseUrl}/merchants/${merchant.id}/menus`)
  const menuItem = Array.isArray(menuItems)
    ? menuItems.find(item => item?.itemName === menuItemName)
    : null

  if (!menuItem?.id) {
    throw new Error(
      `Missing E2E menu item "${menuItemName}" for merchant "${merchantName}".`,
    )
  }

  return { merchant, menuItem }
}

try {
  await runWebhookSeed()
  const { merchant, menuItem } = await verifySeedData()

  console.log('E2E data is ready.')
  console.log(`API: ${apiBaseUrl}`)
  console.log(`Merchant: ${merchant.name} (#${merchant.id})`)
  console.log(`Menu item: ${menuItem.itemName} (#${menuItem.id})`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
