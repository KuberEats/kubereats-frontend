export type Campus = '竹科' | '南科' | '中科' | '高科'
export type SortKey = 'people' | 'popular' | 'recommend'
export type OrderHistorySortKey = 'time' | 'merchant'

export interface Merchant {
  id: number
  name: string
  campus: Campus
  category: string
  rating: number
  orderCount: number
  minOrder: number
  deliveryTime: string
  tags: string[]
  auditStatus?: number
  createdAt?: string
  updatedAt?: string
}

export interface MenuItem {
  id: number
  merchantId: number
  itemName: string
  maxDailyQuantity: number
  imageId: string | null
  price: number
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface OrderItem {
  id: number
  menuId: number
  itemName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface FinanceRecord {
  id: number
  merchantId: number
  merchantName: string
  settlementAmount: number
  reportData: Record<string, unknown> | null
}

export interface Order {
  id: number
  userId: number
  totalAmount: number
  orderStatus: number
  orderTime: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  financeRecords: FinanceRecord[]
}
