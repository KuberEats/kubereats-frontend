export type UserRole = 'employee' | 'merchant' | 'committee'

export interface User {
  id: number
  username: string
  email: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export interface MerchantInfo {
  id: number
  userId: number
  merchantName: string
  campus: string
  category: string
  rating: number
  orderCount: number
  minOrder: number
  maxOrderQuantity: number
  deliveryTime: string
  tags: string[]
  auditStatus: number
  createdAt: string
  updatedAt: string
}

export interface MenuItem {
  id: number
  merchantId: number
  itemName: string
  price: number
  maxDailyQuantity: number
  imageId: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItemSummary {
  menuId: number
  itemName: string
  totalQuantity: number
  totalAmount: number
}

export interface TodayOrderSummary {
  date: string
  totalOrders: number
  totalAmount: number
  items: OrderItemSummary[]
}

export interface AuditResult {
  id: number
  merchantName: string
  auditStatus: number
  message: string
}
