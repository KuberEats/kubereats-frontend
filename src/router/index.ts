import { createRouter, createWebHistory } from 'vue-router'
import MerchantDashboard from '../views/MerchantDashboard.vue'
import StaffDashboard from '../views/StaffDashboard.vue'
import FinanceReport from '../views/FinanceReport.vue'

const routes = [
  { path: '/', redirect: '/merchant' },
  { path: '/merchant', name: 'Merchant', component: MerchantDashboard },
  { path: '/staff', name: 'Staff', component: StaffDashboard },
  { path: '/finance', name: 'Finance', component: FinanceReport },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
