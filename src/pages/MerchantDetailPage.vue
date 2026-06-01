<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getMerchantDetail, listMerchantMenuItems } from '../api/merchants'
import type { MenuItem, Merchant } from '../api/types'
import { useCart } from '../composables/useCart'
import { addDays, formatDateInput } from '../utils/formatters'
import CartPanel from '../components/CartPanel.vue'
import EmptyState from '../components/ux/EmptyState.vue'
import ErrorState from '../components/ux/ErrorState.vue'
import LoadingState from '../components/ux/LoadingState.vue'
import MenuItemCard from '../components/MenuItemCard.vue'
import PageHeader from '../components/ux/PageHeader.vue'
import StatusBadge from '../components/ux/StatusBadge.vue'
import ToastNotification from '../components/ux/ToastNotification.vue'
import { navigateTo } from '../router'

const props = defineProps<{
  merchantId?: number
}>()

const cart = useCart()
const merchant = ref<Merchant | null>(null)
const menuItems = ref<MenuItem[]>([])
const isLoading = ref(false)
const loadErrorMessage = ref('')
const cartMessage = ref('')
const selectedServiceDate = ref(formatDateInput(new Date()))
const selectedPickupSlot = ref('12:00-12:30')

const pickupSlots = ['11:30-12:00', '12:00-12:30', '12:30-13:00', '18:00-18:30']
const minServiceDate = formatDateInput(new Date())
const maxServiceDate = formatDateInput(addDays(new Date(), 7))

const groupedMenuItems = computed(() => {
  const groups = new Map<string, MenuItem[]>()
  for (const item of menuItems.value) {
    const key = item.category || '今日菜單'
    groups.set(key, [...(groups.get(key) || []), item])
  }
  return Array.from(groups.entries()).map(([category, items]) => ({ category, items }))
})

const cartQuantities = computed(() => {
  const quantities = new Map<number, number>()
  for (const item of cart.items.value) {
    quantities.set(item.menuItem.id, item.quantity)
  }
  return quantities
})

function syncCartOptions() {
  if (!merchant.value || !props.merchantId) return
  cart.startCart({
    merchantId: props.merchantId,
    merchantName: merchant.value.name,
    minOrder: merchant.value.minOrder,
    serviceDate: selectedServiceDate.value,
    pickupSlot: selectedPickupSlot.value,
  })
}

async function fetchMerchantDetail() {
  if (!props.merchantId) return

  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const [merchantData, menuData] = await Promise.all([
      getMerchantDetail(props.merchantId),
      listMerchantMenuItems(props.merchantId),
    ])
    merchant.value = merchantData
    menuItems.value = menuData
    syncCartOptions()
  } catch (error) {
    loadErrorMessage.value = error instanceof Error ? error.message : '商家資料讀取失敗'
  } finally {
    isLoading.value = false
  }
}

function addToCart(menuItem: MenuItem) {
  syncCartOptions()
  cart.addItem(menuItem)
  cartMessage.value = `${menuItem.itemName} 已加入購物車`
}

function setQuantity(menuId: number, quantity: number) {
  cart.setQuantity(menuId, quantity)
}

function goCheckout() {
  const validationMessage = validateServiceDate(selectedServiceDate.value)
  if (validationMessage) {
    cartMessage.value = validationMessage
    return
  }
  cart.setOptions({
    serviceDate: selectedServiceDate.value,
    pickupSlot: selectedPickupSlot.value,
  })
  navigateTo('/checkout')
}

function validateServiceDate(date: string) {
  if (!date) return '請選擇預訂日期。'
  if (date < minServiceDate) return '無法預訂過去日期，請重新選擇。'
  if (date > maxServiceDate) return '僅能預訂今天起 7 天內的餐點。'
  return ''
}

onMounted(fetchMerchantDetail)
watch(() => props.merchantId, fetchMerchantDetail)
watch([selectedServiceDate, selectedPickupSlot], syncCartOptions)
</script>

<template>
  <main class="page detail-page">
    <PageHeader
      eyebrow="Menu"
      :title="merchant?.name || '商家菜單'"
      :subtitle="merchant ? `${merchant.campus} · ${merchant.category}` : '選擇餐點加入購物車'"
    >
      <template #action>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo('/merchants')"
        >
          返回商家
        </button>
      </template>
    </PageHeader>

    <ErrorState
      v-if="loadErrorMessage"
      :message="loadErrorMessage"
      show-home
      @retry="fetchMerchantDetail"
      @home="navigateTo('/merchants')"
    />

    <LoadingState
      v-else-if="isLoading"
      variant="list"
      :rows="4"
      label="商家與菜單載入中"
    />

    <template v-else-if="merchant">
      <section class="merchant-detail-hero">
        <div class="merchant-image large">
          {{ merchant.name.slice(0, 1) }}
        </div>

        <div class="merchant-hero-copy">
          <div class="merchant-hero-title">
            <div>
              <p class="eyebrow">
                {{ merchant.campus }} · {{ merchant.category }}
              </p>
              <h1>{{ merchant.name }}</h1>
            </div>
            <StatusBadge
              :label="merchant.isOpen === false ? '暫停接單' : '可訂餐'"
              :tone="merchant.isOpen === false ? 'warning' : 'success'"
            />
          </div>
          <p v-if="merchant.description">
            {{ merchant.description }}
          </p>
          <div class="merchant-meta">
            <span v-if="merchant.rating">★ {{ merchant.rating }}</span>
            <span v-if="merchant.orderCount !== undefined">{{ merchant.orderCount }} 人訂過</span>
            <span v-if="merchant.minOrder !== undefined">低消 ${{ merchant.minOrder }}</span>
            <span v-if="merchant.deliveryTime">{{ merchant.deliveryTime }}</span>
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
          <div class="reservation-controls">
            <label class="date-picker vertical">
              <span>預訂日期</span>
              <input
                v-model="selectedServiceDate"
                type="date"
                :min="minServiceDate"
                :max="maxServiceDate"
                aria-label="預訂日期"
              >
            </label>

            <label class="date-picker vertical">
              <span>取餐時段</span>
              <select
                v-model="selectedPickupSlot"
                aria-label="取餐時段"
              >
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

          <EmptyState
            v-if="menuItems.length === 0"
            icon="?"
            title="目前沒有可訂餐點"
            description="商家尚未上架今日菜單，請稍後再回來查看。"
          />

          <template v-else>
            <section
              v-for="group in groupedMenuItems"
              :key="group.category"
              class="menu-group"
            >
              <div class="section-title-row">
                <div>
                  <p class="eyebrow">
                    Menu
                  </p>
                  <h2>{{ group.category }}</h2>
                </div>
              </div>

              <div class="menu-list">
                <MenuItemCard
                  v-for="item in group.items"
                  :key="item.id"
                  :item="item"
                  :quantity="cartQuantities.get(item.id) || 0"
                  :disabled="merchant.isOpen === false"
                  @add="addToCart"
                  @quantity="setQuantity"
                />
              </div>
            </section>
          </template>
        </div>

        <CartPanel
          class="sticky-cart"
          :items="cart.items.value"
          :submitting="false"
          :min-order="merchant.minOrder"
          submit-label="前往確認訂單"
          @increase="menuId => setQuantity(menuId, (cartQuantities.get(menuId) || 0) + 1)"
          @decrease="menuId => setQuantity(menuId, (cartQuantities.get(menuId) || 0) - 1)"
          @submit="goCheckout"
        />
      </section>
    </template>

    <ToastNotification
      v-if="cartMessage"
      :message="cartMessage"
      tone="info"
      @close="cartMessage = ''"
    />
  </main>
</template>

<style scoped>
.detail-page {
  padding-bottom: 104px;
}

.merchant-hero-copy {
  display: grid;
  gap: 10px;
}

.merchant-hero-copy > p {
  color: var(--color-muted);
}

.merchant-hero-title {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
}

.menu-section {
  display: grid;
  gap: 18px;
}

.menu-group {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: 18px;
}

.sticky-cart {
  position: sticky;
  top: 82px;
  align-self: start;
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .sticky-cart {
    position: fixed;
    right: 12px;
    bottom: 76px;
    left: 12px;
    z-index: 35;
    max-height: min(46vh, 420px);
    overflow: auto;
    box-shadow: 0 18px 48px rgba(17, 24, 39, 0.2);
  }
}

@media (max-width: 640px) {
  .merchant-detail-hero {
    grid-template-columns: 1fr;
  }

  .merchant-image.large {
    min-height: 96px;
    aspect-ratio: auto;
  }

  .reservation-controls {
    grid-template-columns: 1fr;
  }
}
</style>
