<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getOrderById, updateOrderStatus } from '../api/orders'
import type { Order } from '../api/types'
import { navigateTo } from '../router'

const props = defineProps<{
  orderId?: number
}>()

const order = ref<Order | null>(null)
const isLoading = ref(false)
const isUpdating = ref(false)
const errorMessage = ref('')

const statusLabel = computed(() => {
  if (!order.value) return ''
  if (order.value.orderStatus === 1) return '完成'
  if (order.value.orderStatus === 2) return '取消'
  return '處理中'
})

async function fetchOrder() {
  if (!props.orderId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    order.value = await getOrderById(props.orderId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '訂單資料讀取失敗'
  } finally {
    isLoading.value = false
  }
}

async function setStatus(status: number) {
  if (!order.value) return

  isUpdating.value = true
  errorMessage.value = ''

  try {
    order.value = await updateOrderStatus(order.value.id, status)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '訂單狀態更新失敗'
  } finally {
    isUpdating.value = false
  }
}

onMounted(fetchOrder)
watch(() => props.orderId, fetchOrder)
</script>

<template>
  <main class="page">
    <button class="ghost-button" type="button" @click="navigateTo('/merchants')">
      ← 返回商家
    </button>

    <p v-if="errorMessage" class="status-message error">
      {{ errorMessage }}
    </p>

    <p v-else-if="isLoading" class="status-message">
      訂單載入中。
    </p>

    <section v-else-if="order" class="order-detail">
      <div class="section-title-row">
        <div>
          <p class="eyebrow">Order #{{ order.id }}</p>
          <h1>訂單詳情</h1>
        </div>
        <span class="status-badge">{{ statusLabel }}</span>
      </div>

      <div class="order-grid">
        <section class="content-panel">
          <h2>餐點明細</h2>

          <div class="order-item-list">
            <div v-for="item in order.items" :key="item.id" class="order-item-row">
              <div>
                <strong>{{ item.itemName }}</strong>
                <span>${{ item.unitPrice }} × {{ item.quantity }}</span>
              </div>
              <strong>${{ item.subtotal }}</strong>
            </div>
          </div>

          <div class="total-row">
            <span>總金額</span>
            <strong>${{ order.totalAmount }}</strong>
          </div>
        </section>

        <section class="content-panel">
          <h2>訂單狀態</h2>

          <div class="status-actions">
            <button
              class="primary-button"
              type="button"
              :disabled="isUpdating || order.orderStatus !== 0"
              @click="setStatus(1)"
            >
              標記完成
            </button>
            <button
              class="danger-button"
              type="button"
              :disabled="isUpdating || order.orderStatus !== 0"
              @click="setStatus(2)"
            >
              取消訂單
            </button>
          </div>

          <div class="finance-list">
            <div
              v-for="record in order.financeRecords"
              :key="record.id"
              class="finance-row"
            >
              <span>{{ record.merchantName }}</span>
              <strong>結算 ${{ record.settlementAmount }}</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
