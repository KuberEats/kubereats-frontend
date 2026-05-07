<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { listOrders } from '../api/orders'
import type { Order, OrderHistorySortKey } from '../api/types'
import { navigateTo } from '../router'

const CURRENT_USER_ID = 1

const sortOptions: { label: string; value: OrderHistorySortKey }[] = [
  { label: '依時間', value: 'time' },
  { label: '依商家', value: 'merchant' },
]

const selectedSort = ref<OrderHistorySortKey>('time')
const orders = ref<Order[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const orderCount = computed(() => orders.value.length)

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function merchantNames(order: Order) {
  const names = order.financeRecords.map(record => record.merchantName)
  return [...new Set(names)].join('、') || '尚無商家資料'
}

function statusLabel(status: number) {
  if (status === 1) return '完成'
  if (status === 2) return '取消'
  return '處理中'
}

async function fetchOrders() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    orders.value = await listOrders(CURRENT_USER_ID, selectedSort.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '歷史訂單讀取失敗'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchOrders)
watch(selectedSort, fetchOrders)
</script>

<template>
  <main class="page">
    <section class="history-header">
      <div>
        <p class="eyebrow">Order History</p>
        <h1>歷史訂單</h1>
        <p>共 {{ orderCount }} 筆訂單</p>
      </div>

      <div class="filter-bar compact" aria-label="歷史訂單排序">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          class="pill-button"
          :class="{ active: selectedSort === option.value }"
          type="button"
          @click="selectedSort = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <p v-if="errorMessage" class="status-message error">
      {{ errorMessage }}
    </p>

    <p v-else-if="isLoading" class="status-message">
      歷史訂單載入中。
    </p>

    <section v-else class="history-list" aria-label="歷史訂單列表">
      <article
        v-for="order in orders"
        :key="order.id"
        class="history-order-row"
        @click="navigateTo(`/orders/${order.id}`)"
      >
        <div class="history-order-main">
          <div>
            <p class="eyebrow">Order #{{ order.id }}</p>
            <h2>{{ merchantNames(order) }}</h2>
          </div>
          <span class="status-badge">{{ statusLabel(order.orderStatus) }}</span>
        </div>

        <div class="history-order-meta">
          <span>{{ formatDate(order.orderTime) }}</span>
          <span>{{ order.items.length }} 項餐點</span>
          <strong>${{ order.totalAmount }}</strong>
        </div>
      </article>

      <p v-if="orders.length === 0" class="empty-state">
        目前還沒有歷史訂單。
      </p>
    </section>
  </main>
</template>
