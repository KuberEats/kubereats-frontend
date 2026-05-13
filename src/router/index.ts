import { computed, ref } from 'vue'

export type RouteName =
  | 'login'
  | 'merchant-apply'
  | 'merchant-dashboard'
  | 'merchant-orders'
  | 'committee-review'
  | 'merchant-list'
  | 'merchant-detail'
  | 'order-history'
  | 'order-detail'

interface AppRoute {
  name: RouteName
  params: {
    merchantId?: number
    orderId?: number
  }
}

const currentPath = ref(window.location.pathname)

function parseRoute(path: string): AppRoute {
  // 你的路由
  if (path === '/merchant/apply') {
    return { name: 'merchant-apply', params: {} }
  }
  if (path === '/merchant/dashboard') {
    return { name: 'merchant-dashboard', params: {} }
  }
  if (path === '/merchant/orders') {
    return { name: 'merchant-orders', params: {} }
  }
  if (path === '/committee/review') {
    return { name: 'committee-review', params: {} }
  }

  // 組員的路由
  const merchantDetailMatch = path.match(/^\/merchants\/(\d+)$/)
  if (merchantDetailMatch) {
    return {
      name: 'merchant-detail',
      params: { merchantId: Number(merchantDetailMatch[1]) },
    }
  }

  const orderDetailMatch = path.match(/^\/orders\/(\d+)$/)
  if (orderDetailMatch) {
    return {
      name: 'order-detail',
      params: { orderId: Number(orderDetailMatch[1]) },
    }
  }

  if (path === '/merchants') {
    return { name: 'merchant-list', params: {} }
  }
  if (path === '/orders') {
    return { name: 'order-history', params: {} }
  }

  // 預設回登入頁
  return { name: 'login', params: {} }
}

export const currentRoute = computed(() => parseRoute(currentPath.value))

export function navigateTo(path: string) {
  window.history.pushState({}, '', path)
  currentPath.value = path
}

window.addEventListener('popstate', () => {
  currentPath.value = window.location.pathname
})