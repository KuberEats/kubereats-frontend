<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { listMerchants, recommendMerchants } from '../api/merchants'
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
const selectedSort = ref<SortKey>('people')
const merchants = ref<Merchant[]>([])
const isLoading = ref(false)
const isRecommendationLoading = ref(false)
const errorMessage = ref('')
const recommendationPrompt = ref('')
const lastRecommendationPrompt = ref('')
const isRecommendationDialogOpen = ref(false)
const isRecommendationMode = ref(false)

const currentListLabel = computed(() => {
  if (isRecommendationMode.value && lastRecommendationPrompt.value) {
    return `系統推薦：${lastRecommendationPrompt.value}`
  }

  return '店家列表'
})

async function fetchMerchants() {
  if (selectedSort.value === 'recommend') return

  isLoading.value = true
  errorMessage.value = ''
  isRecommendationMode.value = false
  lastRecommendationPrompt.value = ''

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

function selectSort(sort: SortKey) {
  if (sort === 'recommend') {
    selectedSort.value = sort
    isRecommendationDialogOpen.value = true
    errorMessage.value = ''
    return
  }

  selectedSort.value = sort
}

function closeRecommendationDialog() {
  if (isRecommendationLoading.value) return
  isRecommendationDialogOpen.value = false
}

async function submitRecommendationPrompt() {
  const prompt = recommendationPrompt.value.trim()

  if (!prompt) {
    errorMessage.value = '請先輸入你今天想吃什麼。'
    return
  }

  isRecommendationLoading.value = true
  errorMessage.value = ''

  try {
    merchants.value = await recommendMerchants({
      userId: 1,
      campus: selectedCampus.value,
      prompt,
      limit: 5,
    })
    lastRecommendationPrompt.value = prompt
    isRecommendationMode.value = true
    isRecommendationDialogOpen.value = false
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '系統推薦失敗'
  } finally {
    isRecommendationLoading.value = false
  }
}

onMounted(fetchMerchants)
watch([selectedCampus, selectedDate, selectedSort], fetchMerchants)
</script>

<template>
  <main class="page">
    <header class="page-header">
      <nav
        class="campus-tabs"
        aria-label="園區分類"
      >
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
        <input
          v-model="selectedDate"
          type="date"
        >
      </label>
    </header>

    <section class="hero-panel">
      <div>
        <p class="eyebrow">
          KuberEats Order
        </p>
        <h1>{{ selectedCampus }} 今日訂餐</h1>
        <p>選擇日期、園區與排序方式，或輸入一句話讓系統推薦適合的店家。</p>
      </div>
    </section>

    <section
      class="filter-bar"
      aria-label="排序篩選"
    >
      <button
        v-for="option in sortOptions"
        :key="option.value"
        class="pill-button"
        :class="{ active: selectedSort === option.value }"
        type="button"
        @click="selectSort(option.value)"
      >
        {{ option.label }}
      </button>
    </section>

    <section
      v-if="isRecommendationMode"
      class="recommendation-summary"
    >
      <div>
        <p class="eyebrow">
          Recommendation
        </p>
        <h2>{{ currentListLabel }}</h2>
      </div>
      <button
        class="ghost-button"
        type="button"
        @click="isRecommendationDialogOpen = true"
      >
        重新輸入
      </button>
    </section>

    <p
      v-if="errorMessage"
      class="status-message error"
    >
      {{ errorMessage }}
    </p>

    <p
      v-else-if="isLoading"
      class="status-message"
    >
      商家載入中。
    </p>

    <section
      v-else
      class="merchant-list"
      aria-label="店家列表"
    >
      <MerchantCard
        v-for="merchant in merchants"
        :key="merchant.id"
        :merchant="merchant"
        @select="navigateTo(`/merchants/${$event}`)"
      />

      <p
        v-if="merchants.length === 0"
        class="empty-state"
      >
        目前這個園區還沒有可訂店家。
      </p>
    </section>

    <div
      v-if="isRecommendationDialogOpen"
      class="dialog-backdrop"
      role="presentation"
      @click.self="closeRecommendationDialog"
    >
      <section
        class="recommendation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recommendation-dialog-title"
      >
        <div class="section-title-row">
          <div>
            <p class="eyebrow">
              System Recommendation
            </p>
            <h2 id="recommendation-dialog-title">
              想吃什麼？
            </h2>
          </div>
          <button
            class="ghost-button"
            type="button"
            :disabled="isRecommendationLoading"
            @click="closeRecommendationDialog"
          >
            關閉
          </button>
        </div>

        <textarea
          v-model="recommendationPrompt"
          class="recommendation-input"
          rows="4"
          placeholder="例如：今天想吃清爽一點，不要牛肉，最好是最近沒吃過的，150 以下"
          @keydown.meta.enter.prevent="submitRecommendationPrompt"
          @keydown.ctrl.enter.prevent="submitRecommendationPrompt"
        />

        <div class="dialog-actions">
          <button
            class="primary-button"
            type="button"
            :disabled="isRecommendationLoading"
            @click="submitRecommendationPrompt"
          >
            {{ isRecommendationLoading ? '推薦中' : '求推薦' }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>
