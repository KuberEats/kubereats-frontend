// ── 共用 ──

export type UserRole = 'employee' | 'merchant' | 'committee'
export type Campus = '竹科' | '南科' | '中科' | '高科'
export type SortKey = 'people' | 'popular' | 'recommend'
export type OrderHistorySortKey = 'time' | 'merchant'
export type DietaryType = 'MEAT' | 'VEGAN' | 'OVO_LACTO' | 'OVO' | 'LACTO' | 'PESCATARIAN'

// ── Auth ──

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

// ── 組員的：員工端看到的商家 ──

export interface Merchant {
  id: number
  name: string
  campus: Campus
  category: string
  rating: number
  orderCount: number
  minOrder?: number
  deliveryTime: string
  tags: string[]
  isOpen?: boolean
  description?: string
  score?: number
  reason?: string
  signals?: Record<string, unknown>
  auditStatus?: number
  cooperationStartDate?: string | null
  cooperationEndDate?: string | null
  suspendedAt?: string | null
  suspensionReason?: string | null
  createdAt?: string
  updatedAt?: string
}

// ── 你的：商家管理用 ──

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
  cooperationStartDate?: string | null
  cooperationEndDate?: string | null
  suspendedAt?: string | null
  suspensionReason?: string | null
  createdAt: string
  updatedAt: string
}

// ── Menu ──

export interface MenuItem {
  id: number
  merchantId: number
  itemName: string
  price: number
  maxDailyQuantity: number
  imageId?: string | null
  dietaryType?: DietaryType | string | null
  allergens?: string[]
  certifications?: string[]
  imageUrl: string | null
  caloriesKcal?: number | null
  proteinG?: number | null
  carbsG?: number | null
  fatG?: number | null
  sodiumMg?: number | null
  sugarG?: number | null
  servingSize?: string | null
  ingredients?: string | null
  category?: string | null
  description?: string | null
  isAvailable?: boolean
  createdAt: string
  updatedAt: string
}

// ── 組員的：購物車 + 訂單 ──

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export type PickupOption = 'SELF_PICKUP' | 'DELIVERY'

export type ReservationStatus =
  | 'PENDING_RESERVATION'
  | 'PROCESSING'
  | 'RESERVED'
  | 'SOLD_OUT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED'

export interface ReservationRequestPayload {
  user_id: number
  merchant_id: number
  service_date: string
  pickup_slot: string
  pickup_option: PickupOption
  comments?: string
  items: {
    menu_id: number
    quantity: number
  }[]
}

export interface ReservationRequestResponse {
  reservation_id?: string
  order_token: string
  status: ReservationStatus
  message?: string
}

export interface ReservationStatusItem {
  id?: number | string
  menu_id?: number
  item_name?: string
  name?: string
  quantity?: number
  unit_price?: number
  subtotal?: number
}

export interface ReservationStatusResponse {
  order_token: string
  status: ReservationStatus
  service_date?: string
  pickup_slot?: string
  pickup_option?: PickupOption | string
  pickup_number?: string | number | null
  merchant_name?: string
  message?: string
  failure_reason?: string
  failed_items?: ReservationStatusItem[]
  items?: ReservationStatusItem[]
  order_time?: string
  comments?: string
  diner_name?: string
  diner_phone?: string
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

// ── 你的：商家端訂單彙整 ──

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

// ── 你的：福委會審核 ──

export interface AuditResult {
  id: number
  merchantName: string
  auditStatus: number
  message: string
}
