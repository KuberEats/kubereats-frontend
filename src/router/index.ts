import { computed, ref } from 'vue'

type RouteName = 'merchant-list' | 'merchant-detail' | 'order-detail'

interface AppRoute {
  name: RouteName
  params: {
    merchantId?: number
    orderId?: number
  }
}

const currentPath = ref(window.location.pathname === '/' ? '/merchants' : window.location.pathname)

function parseRoute(path: string): AppRoute {
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

  return {
    name: 'merchant-list',
    params: {},
  }
}

export const currentRoute = computed(() => parseRoute(currentPath.value))

export function navigateTo(path: string) {
  window.history.pushState({}, '', path)
  currentPath.value = path
}

window.addEventListener('popstate', () => {
  currentPath.value = window.location.pathname
})
