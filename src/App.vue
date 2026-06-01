<script setup lang="ts">
import { computed, ref, watch } from 'vue'
// 你的頁面
import LoginPage from './pages/LoginPage.vue'
import MerchantApplyPage from './pages/merchant/MerchantApplyPage.vue'
import MerchantDashboardPage from './pages/merchant/MerchantDashboardPage.vue'
import MerchantOrdersPage from './pages/merchant/MerchantOrdersPage.vue'
import CommitteeReviewPage from './pages/committee/CommitteeReviewPage.vue'
// finance / tagging 頁面
import MerchantFinancePage from './pages/merchant/MerchantFinancePage.vue'
import StaffExpensesPage from './pages/StaffExpensesPage.vue'
import FinanceReportPage from './pages/committee/FinanceReportPage.vue'
// 組員的頁面
import MerchantDetailPage from './pages/MerchantDetailPage.vue'
import MerchantListPage from './pages/MerchantListPage.vue'
import OrderDetailPage from './pages/OrderDetailPage.vue'
import OrderHistoryPage from './pages/OrderHistoryPage.vue'
import ReservationStatusPage from './pages/ReservationStatusPage.vue'

import { currentRoute, navigateTo } from './router'
import { clearTokens, getAccessToken } from './api/client'
import { getMe } from './api/auth'
import type { User } from './api/types'

function readStoredUser() {
  const user = localStorage.getItem('user')
  if (!user) return null

  try {
    return JSON.parse(user) as Pick<User, 'id' | 'role'>
  } catch {
    return null
  }
}

function storeCurrentUser(user: User) {
  localStorage.setItem('user', JSON.stringify({ id: user.id, role: user.role }))
}

const authenticatedUser = ref<Pick<User, 'id' | 'role'> | null>(readStoredUser())
const authCheckPending = ref(false)
let authCheckId = 0

const isLoggedIn = computed(() => {
  void currentRoute.value // track route changes
  return !!getAccessToken()
})

const userRole = computed(() => {
  void currentRoute.value // track route changes so this re-evaluates on login/logout
  return authenticatedUser.value?.role ?? readStoredUser()?.role ?? null
})

const homePath = computed(() => {
  if (userRole.value === 'merchant') return '/merchant/dashboard'
  if (userRole.value === 'committee') return '/committee/review'
  return '/merchants'
})

function handleHomeClick() {
  navigateTo(isLoggedIn.value ? homePath.value : '/login')
}

function handleLogout() {
  clearTokens()
  authenticatedUser.value = null
  navigateTo('/login')
}

async function validateSession() {
  const checkId = ++authCheckId
  authCheckPending.value = true

  try {
    const user = await getMe()
    if (checkId !== authCheckId) return false
    authenticatedUser.value = { id: user.id, role: user.role }
    storeCurrentUser(user)
    return true
  } catch {
    if (checkId === authCheckId) {
      clearTokens()
      authenticatedUser.value = null
    }
    return false
  } finally {
    if (checkId === authCheckId) {
      authCheckPending.value = false
    }
  }
}

watch(
  () => currentRoute.value.name,
  async routeName => {
    if (!getAccessToken()) {
      authenticatedUser.value = null
      if (routeName !== 'login') {
        navigateTo('/login')
      }
      return
    }

    const isValidSession = await validateSession()
    if (!isValidSession) {
      if (currentRoute.value.name !== 'login') {
        navigateTo('/login')
      }
      return
    }

    if (currentRoute.value.name === 'login') {
      navigateTo(homePath.value)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="app-shell">
    <header
      v-if="isLoggedIn && !authCheckPending"
      class="app-topbar"
    >
      <button
        class="brand-button"
        type="button"
        @click="handleHomeClick"
      >
        KuberEats
      </button>
      <nav class="topbar-actions">
        <template v-if="userRole === 'employee'">
          <button
            type="button"
            @click="navigateTo('/merchants')"
          >
            商家
          </button>
          <button
            type="button"
            @click="navigateTo('/orders')"
          >
            歷史訂單
          </button>
          <button
            type="button"
            @click="navigateTo('/staff/expenses')"
          >
            我的支出
          </button>
        </template>
        <template v-if="userRole === 'merchant'">
          <button
            type="button"
            @click="navigateTo('/merchant/dashboard')"
          >
            商家後台
          </button>
          <button
            type="button"
            @click="navigateTo('/merchant/orders')"
          >
            今日訂單
          </button>
        </template>
        <template v-if="userRole === 'committee'">
          <button
            type="button"
            @click="navigateTo('/committee/review')"
          >
            商家審核
          </button>
        </template>
        <button
          type="button"
          class="logout-btn"
          @click="handleLogout"
        >
          登出
        </button>
      </nav>
    </header>

    <main>
      <div
        v-if="authCheckPending"
        class="auth-loading"
      >
        驗證登入狀態...
      </div>
      <LoginPage v-else-if="currentRoute.name === 'login'" />
      <template v-else-if="isLoggedIn">
        <!-- 你的頁面 -->
        <MerchantApplyPage v-if="currentRoute.name === 'merchant-apply'" />
        <MerchantDashboardPage v-else-if="currentRoute.name === 'merchant-dashboard'" />
        <MerchantOrdersPage v-else-if="currentRoute.name === 'merchant-orders'" />
        <CommitteeReviewPage v-else-if="currentRoute.name === 'committee-review'" />
        <!-- finance / tagging 頁面 -->
        <MerchantFinancePage v-else-if="currentRoute.name === 'merchant-finance'" />
        <StaffExpensesPage v-else-if="currentRoute.name === 'staff-expenses'" />
        <FinanceReportPage v-else-if="currentRoute.name === 'merchant-finance-reports'" />
        <!-- 組員的頁面 -->
        <MerchantListPage v-else-if="currentRoute.name === 'merchant-list'" />
        <MerchantDetailPage
          v-else-if="currentRoute.name === 'merchant-detail'"
          :merchant-id="currentRoute.params.merchantId"
        />
        <OrderHistoryPage v-else-if="currentRoute.name === 'order-history'" />
        <OrderDetailPage
          v-else-if="currentRoute.name === 'order-detail'"
          :order-id="currentRoute.params.orderId"
        />
        <ReservationStatusPage
          v-else-if="currentRoute.name === 'reservation-status'"
          :order-token="currentRoute.params.orderToken"
        />
      </template>
    </main>
  </div>
</template>

<style scoped>
.app-shell { min-height: 100vh; background: #f5f5f5; }
.app-topbar {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  padding: 0.75rem 1.5rem; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.brand-button {
  background: none; border: none; font-size: 1.25rem; font-weight: 700;
  color: #e74c3c; cursor: pointer;
}
.topbar-actions { display: flex; gap: 0.5rem; overflow-x: auto; }
.topbar-actions button {
  padding: 0.4rem 0.75rem; border: 1px solid #ddd; border-radius: 4px;
  background: white; color: #333; cursor: pointer; font-size: 0.85rem; white-space: nowrap;
  flex: 0 0 auto;
}
.topbar-actions button:hover { background: #f5f5f5; }
.logout-btn { color: #e74c3c; }
.auth-loading {
  display: grid;
  min-height: 100vh;
  place-items: center;
  color: #555;
  font-weight: 600;
}

@media (max-width: 700px) {
  .app-topbar {
    align-items: stretch;
    flex-direction: column;
    padding: 0.75rem 1rem;
  }

  .brand-button {
    align-self: flex-start;
  }

  .topbar-actions {
    margin: 0 -1rem;
    padding: 0 1rem 0.25rem;
  }
}
</style>
