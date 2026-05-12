<script setup lang="ts">
import { onMounted } from 'vue';
import { useFinanceStore } from '../stores/useFinanceStore';

const store = useFinanceStore();

onMounted(() => {
  store.fetchFinanceHistory();
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold">Finance Reports</h1>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Historical Records</h2>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Merchant ID</th>
                <th>Order ID</th>
                <th>Settlement</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in store.history" :key="record.id">
                <td>{{ record.id }}</td>
                <td>{{ record.merchant_id }}</td>
                <td>{{ record.order_id }}</td>
                <td>${{ record.settlement_amount }}</td>
                <td>{{ record.report_data }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
