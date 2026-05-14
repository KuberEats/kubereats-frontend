<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getMerchantDetail, listMerchantMenuItems } from '../api/merchants'
import { createOrder } from '../api/orders'
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
  const existingItem = cartItems.value.find(item => item.menuItem.id === menuItem.id)

  if (existingItem) {
    existingItem.quantity += 1
    return
  }

  cartItems.value.push({ menuItem, quantity: 1 })
}

function increaseQuantity(menuId: number) {
  orderErrorMessage.value = ''
  const item = cartItems.value.find(cartItem => cartItem.menuItem.id === menuId)
  if (item) item.quantity += 1
}

function decreaseQuantity(menuId: number) {
  orderErrorMessage.value = ''
  const item = cartItems.value.find(cartItem => cartItem.menuItem.id === menuId)
  if (!item) return

  if (item.quantity === 1) {
    cartItems.value = cartItems.value.filter(cartItem => cartItem.menuItem.id !== menuId)
    return
  }

  item.quantity -= 1
}

async function submitOrder() {
  isSubmitting.value = true
  orderErrorMessage.value = ''

  try {
    const order = await createOrder(1, cartItems.value)
    navigateTo(`/orders/${order.id}`)
  } catch (error) {
    orderErrorMessage.value = formatOrderError(
      error instanceof Error ? error.message : '訂單建立失敗',
    )
  } finally {
    isSubmitting.value = false
  }
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
    <button class="ghost-button" type="button" @click="navigateTo('/merchants')">
      ← 返回商家
    </button>

    <p v-if="loadErrorMessage" class="status-message error">
      {{ loadErrorMessage }}
    </p>

    <p v-else-if="isLoading" class="status-message">
      商家與菜單載入中。
    </p>

    <template v-else-if="merchant">
      <section class="merchant-detail-hero">
        <div class="merchant-image large">
          {{ merchant.name.slice(0, 1) }}
        </div>

        <div>
          <p class="eyebrow">{{ merchant.campus }} · {{ merchant.category }}</p>
          <h1>{{ merchant.name }}</h1>
          <div class="merchant-meta">
            <span>★ {{ merchant.rating }}</span>
            <span>{{ merchant.orderCount }} 人訂過</span>
            <span>低消 ${{ merchant.minOrder }}</span>
            <span>{{ merchant.deliveryTime }}</span>
          </div>
          <div class="tag-list">
            <span v-for="tag in merchant.tags" :key="tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </section>

      <section class="detail-layout">
        <div class="menu-section">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">Menu</p>
              <h2>今日菜單</h2>
            </div>
            <strong>${{ cartTotal }}</strong>
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
      </section>
    </template>
  </main>
</template>
