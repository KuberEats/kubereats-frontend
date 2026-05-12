<script setup lang="ts">
import { onMounted } from 'vue';
import { useFinanceStore } from '../stores/useFinanceStore';

const store = useFinanceStore();
const userId = 1; // Default for local dev

onMounted(() => {
  store.fetchStaffExpenses(userId);
  store.fetchSalaryDeductions(userId);
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold">Staff Dashboard</h1>
    
    <div class="stats shadow w-full bg-base-100">
      <div class="stat">
        <div class="stat-title">Current Expenses</div>
        <div class="stat-value text-accent">${{ store.expenses.total_expense }}</div>
        <div class="stat-desc">{{ store.expenses.order_count }} orders</div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Salary Deductions</h2>
        <div class="overflow-x-auto">
          <table class="table table-compact w-full">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Order Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="deduction in store.salaryDeductions" :key="deduction.id">
                <td>{{ deduction.id }}</td>
                <td>${{ deduction.total_amount }}</td>
                <td>{{ new Date(deduction.order_time).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
