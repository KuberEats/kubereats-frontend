<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { listMerchants } from '../api/merchants'
import type { Campus, Merchant, SortKey } from '../api/types'
import MerchantCard from '../components/MerchantCard.vue'
import { navigateTo } from '../router'

const campuses: Campus[] = ['竹科', '南科', '中科', '高科']

const sortOptions: { label: string; value: SortKey }[] = [
  { label: '最多人美食', value: 'people' },
  { label: '最常美食', value: 'popular' },
  { label: '系統推薦', value: 'recommend' },
]

const selectedCampus = ref<Campus>('竹科')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedSort = ref<SortKey>('recommend')
const merchants = ref<Merchant[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

async function fetchMerchants() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    merchants.value = await listMerchants(
      selectedCampus.value,
      selectedDate.value,
      selectedSort.value,
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '商家資料讀取失敗'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchMerchants)
watch([selectedCampus, selectedDate, selectedSort], fetchMerchants)
</script>

<template>
  <main class="page">
    <header class="page-header">
      <nav class="campus-tabs" aria-label="園區分類">
        <button
          v-for="campus in campuses"
          :key="campus"
          class="pill-button"
          :class="{ active: selectedCampus === campus }"
          type="button"
          @click="selectedCampus = campus"
        >
          {{ campus }}
        </button>
      </nav>

      <label class="date-picker">
        <span>日期</span>
        <input v-model="selectedDate" type="date" />
      </label>
    </header>

    <section class="hero-panel">
      <div>
        <p class="eyebrow">KuberEats Order</p>
        <h1>{{ selectedCampus }} 今日訂餐</h1>
        <p>選擇日期、園區與排序方式，快速找到今天適合團訂的店家。</p>
      </div>
    </section>

    <section class="filter-bar" aria-label="排序篩選">
      <button
        v-for="option in sortOptions"
        :key="option.value"
        class="pill-button"
        :class="{ active: selectedSort === option.value }"
        type="button"
        @click="selectedSort = option.value"
      >
        {{ option.label }}
      </button>
    </section>

    <p v-if="errorMessage" class="status-message error">
      {{ errorMessage }}
    </p>

    <p v-else-if="isLoading" class="status-message">
      商家載入中。
    </p>

    <section v-else class="merchant-list" aria-label="店家列表">
      <MerchantCard
        v-for="merchant in merchants"
        :key="merchant.id"
        :merchant="merchant"
        @select="navigateTo(`/merchants/${$event}`)"
      />

      <p v-if="merchants.length === 0" class="empty-state">
        目前這個園區還沒有可訂店家。
      </p>
    </section>
  </main>
</template>
