import { computed, ref, watch } from 'vue'
import type { CartItem, MenuItem } from '../api/types'

const STORAGE_KEY = 'kubereatsCheckoutCart'

interface StoredCart {
  merchantId: number
  merchantName: string
  minOrder?: number
  serviceDate: string
  pickupSlot: string
  items: CartItem[]
}

const merchantId = ref<number | null>(null)
const merchantName = ref('')
const minOrder = ref<number | undefined>()
const serviceDate = ref('')
const pickupSlot = ref('')
const items = ref<CartItem[]>([])

function loadCart() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return

  try {
    const parsed = JSON.parse(stored) as StoredCart
    merchantId.value = parsed.merchantId
    merchantName.value = parsed.merchantName
    minOrder.value = parsed.minOrder
    serviceDate.value = parsed.serviceDate
    pickupSlot.value = parsed.pickupSlot
    items.value = parsed.items || []
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function persistCart() {
  if (!merchantId.value || items.value.length === 0) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  const payload: StoredCart = {
    merchantId: merchantId.value,
    merchantName: merchantName.value,
    minOrder: minOrder.value,
    serviceDate: serviceDate.value,
    pickupSlot: pickupSlot.value,
    items: items.value,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

loadCart()
watch([merchantId, merchantName, minOrder, serviceDate, pickupSlot, items], persistCart, {
  deep: true,
})

export function useCart() {
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
  )
  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )
  const isBelowMinimum = computed(() =>
    typeof minOrder.value === 'number' && total.value < minOrder.value,
  )

  function startCart(options: {
    merchantId: number
    merchantName: string
    minOrder?: number
    serviceDate: string
    pickupSlot: string
  }) {
    if (merchantId.value !== options.merchantId) {
      items.value = []
    }
    merchantId.value = options.merchantId
    merchantName.value = options.merchantName
    minOrder.value = options.minOrder
    serviceDate.value = options.serviceDate
    pickupSlot.value = options.pickupSlot
  }

  function setOptions(options: { serviceDate: string; pickupSlot: string }) {
    serviceDate.value = options.serviceDate
    pickupSlot.value = options.pickupSlot
  }

  function addItem(menuItem: MenuItem, quantity = 1) {
    const existing = items.value.find(item => item.menuItem.id === menuItem.id)
    if (existing) {
      existing.quantity += quantity
      return
    }
    items.value.push({ menuItem, quantity })
  }

  function setQuantity(menuId: number, quantity: number) {
    if (quantity <= 0) {
      items.value = items.value.filter(item => item.menuItem.id !== menuId)
      return
    }

    const item = items.value.find(cartItem => cartItem.menuItem.id === menuId)
    if (item) item.quantity = quantity
  }

  function clearCart() {
    merchantId.value = null
    merchantName.value = ''
    minOrder.value = undefined
    serviceDate.value = ''
    pickupSlot.value = ''
    items.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    merchantId,
    merchantName,
    minOrder,
    serviceDate,
    pickupSlot,
    items,
    total,
    itemCount,
    isBelowMinimum,
    startCart,
    setOptions,
    addItem,
    setQuantity,
    clearCart,
  }
}
