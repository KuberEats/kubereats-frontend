<script setup lang="ts">
import { computed } from 'vue'
// 你的頁面
import LoginPage from './pages/LoginPage.vue'
import MerchantApplyPage from './pages/merchant/MerchantApplyPage.vue'
import MerchantDashboardPage from './pages/merchant/MerchantDashboardPage.vue'
import MerchantOrdersPage from './pages/merchant/MerchantOrdersPage.vue'
import CommitteeReviewPage from './pages/committee/CommitteeReviewPage.vue'
// 組員的頁面
import MerchantDetailPage from './pages/MerchantDetailPage.vue'
import MerchantListPage from './pages/MerchantListPage.vue'
import OrderDetailPage from './pages/OrderDetailPage.vue'
import OrderHistoryPage from './pages/OrderHistoryPage.vue'

import { currentRoute, navigateTo } from './router'
import { clearTokens, getAccessToken } from './api/client'

const isLoggedIn = computed(() => !!getAccessToken())

const userRole = computed(() => {
  const user = localStorage.getItem('user')
  if (!user) return null
  try {
    return JSON.parse(user).role as string
  } catch {
    return null
  }
})

function handleLogout() {
  clearTokens()
  navigateTo('/login')
}
</script>

<template>
  <div class="app-shell">
    <header v-if="isLoggedIn" class="app-topbar">
      <button class="brand-button" type="button" @click="navigateTo('/')">
        KuberEats
      </button>
      <nav class="topbar-actions">
        <template v-if="userRole === 'employee'">
          <button type="button" @click="navigateTo('/merchants')">商家</button>
          <button type="button" @click="navigateTo('/orders')">歷史訂單</button>
        </template>
        <template v-if="userRole === 'merchant'">
          <button type="button" @click="navigateTo('/merchant/dashboard')">商家後台</button>
          <button type="button" @click="navigateTo('/merchant/orders')">今日訂單</button>
        </template>
        <template v-if="userRole === 'committee'">
          <button type="button" @click="navigateTo('/committee/review')">商家審核</button>
        </template>
        <button type="button" class="logout-btn" @click="handleLogout">登出</button>
      </nav>
    </header>

    <main>
      <LoginPage v-if="currentRoute.name === 'login'" />
      <!-- 你的頁面 -->
      <MerchantApplyPage v-else-if="currentRoute.name === 'merchant-apply'" />
      <MerchantDashboardPage v-else-if="currentRoute.name === 'merchant-dashboard'" />
      <MerchantOrdersPage v-else-if="currentRoute.name === 'merchant-orders'" />
      <CommitteeReviewPage v-else-if="currentRoute.name === 'committee-review'" />
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
    </main>
  </div>
</template>

<style scoped>
.app-shell { min-height: 100vh; background: #f5f5f5; }
.app-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1.5rem; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.brand-button {
  background: none; border: none; font-size: 1.25rem; font-weight: 700;
  color: #e74c3c; cursor: pointer;
}
.topbar-actions { display: flex; gap: 0.5rem; }
.topbar-actions button {
  padding: 0.4rem 0.75rem; border: 1px solid #ddd; border-radius: 4px;
  background: white; color: #333; cursor: pointer; font-size: 0.85rem;
}
.topbar-actions button:hover { background: #f5f5f5; }
.logout-btn { color: #e74c3c; }
</style>