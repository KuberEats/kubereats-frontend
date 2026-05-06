<script setup lang="ts">
import MerchantDetailPage from './pages/MerchantDetailPage.vue'
import MerchantListPage from './pages/MerchantListPage.vue'
import OrderDetailPage from './pages/OrderDetailPage.vue'
import { currentRoute, navigateTo } from './router'
</script>

<template>
  <div class="app-shell">
    <header class="app-topbar">
      <button class="brand-button" type="button" @click="navigateTo('/merchants')">
        KuberEats
      </button>

      <nav class="topbar-actions" aria-label="主要導覽">
        <button type="button" @click="navigateTo('/merchants')">
          商家
        </button>
        <button type="button" @click="navigateTo('/orders/1')">
          範例訂單
        </button>
      </nav>
    </header>

    <MerchantListPage v-if="currentRoute.name === 'merchant-list'" />
    <MerchantDetailPage
      v-else-if="currentRoute.name === 'merchant-detail'"
      :merchant-id="currentRoute.params.merchantId"
    />
    <OrderDetailPage
      v-else-if="currentRoute.name === 'order-detail'"
      :order-id="currentRoute.params.orderId"
    />
  </div>
</template>
