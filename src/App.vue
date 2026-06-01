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
import CheckoutPage from './pages/CheckoutPage.vue'
import OrderDetailPage from './pages/OrderDetailPage.vue'
import OrderHistoryPage from './pages/OrderHistoryPage.vue'
import ReservationStatusPage from './pages/ReservationStatusPage.vue'
import AppShell from './components/ux/AppShell.vue'

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
  <div class="app-root">
    <div
      v-if="authCheckPending"
      class="auth-loading"
    >
      驗證登入狀態...
    </div>
    <LoginPage v-else-if="currentRoute.name === 'login'" />
    <AppShell
      v-else-if="isLoggedIn"
      :active-route="currentRoute.name"
      :user-role="userRole"
      @navigate="navigateTo"
      @logout="handleLogout"
    >
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
      <CheckoutPage v-else-if="currentRoute.name === 'checkout'" />
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
    </AppShell>
  </div>
</template>

<style scoped>
.app-root { min-height: 100vh; background: var(--color-bg); }
.auth-loading {
  display: grid;
  min-height: 100vh;
  place-items: center;
  color: #555;
  font-weight: 600;
}
</style>
