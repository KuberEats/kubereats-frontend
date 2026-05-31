<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ApiError } from '../api/client'
import { getMerchantDetail, listMerchantMenuItems } from '../api/merchants'
import { createReservationRequest } from '../api/orders'
import type { CartItem, MenuItem, Merchant } from '../api/types'
import CartPanel from '../components/CartPanel.vue'
import MenuItemCard from '../components/MenuItemCard.vue'
import { navigateTo } from '../router'

const props = defineProps<{
  merchantId?: number
}>()

const merchant = ref<Merchant | null>(null)
const menuItems = ref<MenuItem[]>([])
const cartItems = ref<CartItem[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadErrorMessage = ref('')
const orderErrorMessage = ref('')
const soldOutMessage = ref('')
const selectedServiceDate = ref(formatDateInput(new Date()))
const selectedPickupSlot = ref('12:00-12:30')

const pickupSlots = ['11:30-12:00', '12:00-12:30', '12:30-13:00', '18:00-18:30']
const minServiceDate = formatDateInput(new Date())
const maxServiceDate = formatDateInput(addDays(new Date(), 7))

const cartTotal = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
)

async function fetchMerchantDetail() {
  if (!props.merchantId) return

  isLoading.value = true
  loadErrorMessage.value = ''
  orderErrorMessage.value = ''

  try {
    const [merchantData, menuData] = await Promise.all([
      getMerchantDetail(props.merchantId),
      listMerchantMenuItems(props.merchantId),
    ])
    merchant.value = merchantData
    menuItems.value = menuData
    cartItems.value = []
  } catch (error) {
    loadErrorMessage.value = error instanceof Error ? error.message : '商家資料讀取失敗'
  } finally {
    isLoading.value = false
  }
}

function addToCart(menuItem: MenuItem) {
  orderErrorMessage.value = ''
  soldOutMessage.value = ''
  const existingItem = cartItems.value.find(item => item.menuItem.id === menuItem.id)

  if (existingItem) {
    existingItem.quantity += 1
    return
  }

  cartItems.value.push({ menuItem, quantity: 1 })
}

function increaseQuantity(menuId: number) {
  orderErrorMessage.value = ''
  soldOutMessage.value = ''
  const item = cartItems.value.find(cartItem => cartItem.menuItem.id === menuId)
  if (item) item.quantity += 1
}

function decreaseQuantity(menuId: number) {
  orderErrorMessage.value = ''
  soldOutMessage.value = ''
  const item = cartItems.value.find(cartItem => cartItem.menuItem.id === menuId)
  if (!item) return

  if (item.quantity === 1) {
    cartItems.value = cartItems.value.filter(cartItem => cartItem.menuItem.id !== menuId)
    return
  }

  item.quantity -= 1
}

async function submitOrder() {
  if (!props.merchantId) return

  const validationMessage = validateServiceDate(selectedServiceDate.value)
  if (validationMessage) {
    orderErrorMessage.value = validationMessage
    return
  }

  isSubmitting.value = true
  orderErrorMessage.value = ''
  soldOutMessage.value = ''

  try {
    const storedUser = localStorage.getItem('user')
    const userId = storedUser ? (JSON.parse(storedUser) as { id: number }).id : 0
    const payload = {
      user_id: userId,
      merchant_id: props.merchantId,
      service_date: selectedServiceDate.value,
      pickup_slot: selectedPickupSlot.value,
      pickup_option: 'SELF_PICKUP' as const,
      items: cartItems.value.map(item => ({
        menu_id: item.menuItem.id,
        quantity: item.quantity,
      })),
    }
    const idempotencyKey = getSubmissionIdempotencyKey(payload)
    const reservation = await createReservationRequest(payload, idempotencyKey)

    if (reservation.status === 'SOLD_OUT') {
      soldOutMessage.value = reservation.message || '此餐點在該日期或時段已售完'
      return
    }

    localStorage.setItem('latestReservationOrderToken', reservation.order_token)
    localStorage.removeItem('currentReservationAttempt')
    navigateTo(`/reservation-status/${encodeURIComponent(reservation.order_token)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      soldOutMessage.value = formatOrderError(error.message || '此餐點在該日期或時段已售完')
      return
    }

    orderErrorMessage.value = formatOrderError(
      error instanceof Error ? error.message : '訂單建立失敗',
    )
  } finally {
    isSubmitting.value = false
  }
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function validateServiceDate(date: string) {
  if (!date) return '請選擇預訂日期。'
  if (date < minServiceDate) return '無法預訂過去日期，請重新選擇。'
  if (date > maxServiceDate) return '僅能預訂今天起 7 天內的餐點。'
  return ''
}

function getSubmissionIdempotencyKey(payload: object) {
  const fingerprint = JSON.stringify(payload)
  const storedAttempt = localStorage.getItem('currentReservationAttempt')

  if (storedAttempt) {
    try {
      const attempt = JSON.parse(storedAttempt) as { fingerprint?: string; key?: string }
      if (attempt.fingerprint === fingerprint && attempt.key) return attempt.key
    } catch {
      localStorage.removeItem('currentReservationAttempt')
    }
  }

  const key = crypto.randomUUID()
  localStorage.setItem('currentReservationAttempt', JSON.stringify({ fingerprint, key }))
  return key
}

function formatOrderError(message: string) {
  const quantityMatch = message.match(/^(.+) exceeds (?:daily available|remaining daily) quantity$/)

  if (quantityMatch) {
    return `${quantityMatch[1]} 今日可訂數量不足，請減少份數後再送出。`
  }

  if (message.includes('minimum order is')) {
    const [merchantName, minimumAmount] = message.split(' minimum order is ')
    return `${merchantName} 尚未達到低消 $${minimumAmount}。`
  }

  return message || '訂單建立失敗，請稍後再試。'
}

onMounted(fetchMerchantDetail)
watch(() => props.merchantId, fetchMerchantDetail)
</script>

<template>
  <main class="page">
    <button
      class="ghost-button"
      type="button"
      @click="navigateTo('/merchants')"
    >
      ← 返回商家
    </button>

    <p
      v-if="loadErrorMessage"
      class="status-message error"
    >
      {{ loadErrorMessage }}
    </p>

    <p
      v-else-if="isLoading"
      class="status-message"
    >
      商家與菜單載入中。
    </p>

    <template v-else-if="merchant">
      <section class="merchant-detail-hero">
        <div class="merchant-image large">
          {{ merchant.name.slice(0, 1) }}
        </div>

        <div>
          <p class="eyebrow">
            {{ merchant.campus }} · {{ merchant.category }}
          </p>
          <h1>{{ merchant.name }}</h1>
          <div class="merchant-meta">
            <span>★ {{ merchant.rating }}</span>
            <span>{{ merchant.orderCount }} 人訂過</span>
            <span>低消 ${{ merchant.minOrder }}</span>
            <span>{{ merchant.deliveryTime }}</span>
          </div>
          <div class="tag-list">
            <span
              v-for="tag in merchant.tags"
              :key="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </section>

      <section class="detail-layout">
        <div class="menu-section">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">
                Menu
              </p>
              <h2>今日菜單</h2>
            </div>
            <strong>${{ cartTotal }}</strong>
          </div>

          <div class="reservation-controls">
            <label class="date-picker vertical">
              <span>預訂日期</span>
              <input
                v-model="selectedServiceDate"
                type="date"
                :min="minServiceDate"
                :max="maxServiceDate"
                @change="orderErrorMessage = validateServiceDate(selectedServiceDate)"
              >
            </label>

            <label class="date-picker vertical">
              <span>取餐時段</span>
              <select v-model="selectedPickupSlot">
                <option
                  v-for="slot in pickupSlots"
                  :key="slot"
                  :value="slot"
                >
                  {{ slot }}
                </option>
              </select>
            </label>
          </div>

          <div class="menu-list">
            <MenuItemCard
              v-for="item in menuItems"
              :key="item.id"
              :item="item"
              @add="addToCart"
            />
          </div>
        </div>

        <CartPanel
          :items="cartItems"
          :submitting="isSubmitting"
          :error-message="orderErrorMessage"
          @increase="increaseQuantity"
          @decrease="decreaseQuantity"
          @submit="submitOrder"
        />

        <section
          v-if="soldOutMessage"
          class="content-panel sold-out-panel"
        >
          <span class="status-icon warning">!</span>
          <h2>預訂失敗</h2>
          <p>此餐點在該日期或時段已售完</p>
          <p>{{ soldOutMessage }}</p>
          <div class="status-actions wrap">
            <button
              class="primary-button"
              type="button"
              @click="soldOutMessage = ''"
            >
              選擇其他時段
            </button>
            <button
              class="ghost-button"
              type="button"
              @click="cartItems = []"
            >
              回到菜單
            </button>
            <button
              class="ghost-button"
              type="button"
              @click="navigateTo('/orders')"
            >
              回到訂單紀錄
            </button>
          </div>
        </section>
      </section>
    </template>
  </main>
</template>
