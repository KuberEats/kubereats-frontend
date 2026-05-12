<script setup lang="ts">
import { onMounted } from 'vue';
import { useFinanceStore } from '../stores/useFinanceStore';

const store = useFinanceStore();
const merchantId = 1; // Default for local dev

onMounted(() => {
  store.fetchMerchantIncome(merchantId);
  store.fetchMerchantPayouts(merchantId);
  store.fetchMonthlyTotal(merchantId);
});

const triggerReport = async () => {
  await store.triggerReport(merchantId);
  alert('Report generation triggered!');
};
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold">Merchant Dashboard</h1>
    
    <div class="stats shadow w-full bg-base-100">
      <div class="stat">
        <div class="stat-title">Current Income</div>
        <div class="stat-value text-primary">${{ store.incomeStatus.total_income }}</div>
        <div class="stat-desc">{{ store.incomeStatus.order_count }} orders</div>
      </div>
      
      <div class="stat">
        <div class="stat-title">Monthly Total</div>
        <div class="stat-value text-secondary">${{ store.monthlyTotal }}</div>
        <div class="stat-desc">This month</div>
      </div>
      
      <div class="stat">
        <div class="stat-actions">
          <button class="btn btn-sm btn-success" @click="triggerReport">Generate Report</button>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Payout Results</h2>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Settlement</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payout in store.payouts" :key="payout.id">
                <td>{{ payout.order_id }}</td>
                <td>${{ payout.settlement_amount }}</td>
                <td>
                  <div class="badge" :class="payout.status === 'payout_done' ? 'badge-success' : 'badge-warning'">
                    {{ payout.status }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
