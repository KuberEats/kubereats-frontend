<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { listMerchants, recommendMerchants } from '../api/merchants'
import type { Campus, Merchant, SortKey } from '../api/types'
import EmptyState from '../components/ux/EmptyState.vue'
import ErrorState from '../components/ux/ErrorState.vue'
import LoadingState from '../components/ux/LoadingState.vue'
import PageHeader from '../components/ux/PageHeader.vue'
import MerchantCard from '../components/MerchantCard.vue'
import { navigateTo } from '../router'

const campuses: Campus[] = ['竹科', '南科', '中科', '高科']

const sortOptions: { label: string; value: SortKey | 'name' }[] = [
  { label: '系統推薦', value: 'recommend' },
  { label: '最多人美食', value: 'people' },
  { label: '最常美食', value: 'popular' },
  { label: '名稱排序', value: 'name' },
]

const selectedCampus = ref<Campus>('竹科')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedSort = ref<SortKey | 'name'>('people')
const selectedFilter = ref('all')
const searchQuery = ref('')
const merchants = ref<Merchant[]>([])
const isLoading = ref(false)
const isRecommendationLoading = ref(false)
const errorMessage = ref('')
const recommendationPrompt = ref('')
const lastRecommendationPrompt = ref('')
const isRecommendationDialogOpen = ref(false)
const isRecommendationMode = ref(false)

const categoryFilters = computed(() => {
  const categories = new Set(merchants.value.map(merchant => merchant.category).filter(Boolean))
  return Array.from(categories).slice(0, 6)
})

const filterChips = computed(() => [
  { label: '全部', value: 'all' },
  { label: '營業中', value: 'open' },
  { label: '熱門', value: 'hot' },
  ...categoryFilters.value.map(category => ({ label: category, value: category })),
])

const visibleMerchants = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return merchants.value
    .filter(merchant => {
      if (selectedFilter.value === 'open' && merchant.isOpen === false) return false
      if (selectedFilter.value === 'hot' && (merchant.orderCount ?? 0) < 50) return false
      if (
        selectedFilter.value !== 'all' &&
        selectedFilter.value !== 'open' &&
        selectedFilter.value !== 'hot' &&
        merchant.category !== selectedFilter.value
      ) {
        return false
      }

      if (!query) return true
      const searchable = [
        merchant.name,
        merchant.category,
        merchant.campus,
        merchant.reason,
        ...(merchant.tags || []),
      ].join(' ').toLowerCase()
      return searchable.includes(query)
    })
    .sort((a, b) => {
      if (selectedSort.value === 'name') return a.name.localeCompare(b.name, 'zh-Hant')
      return 0
    })
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
      selectedSort.value === 'name' ? 'popular' : selectedSort.value,
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '商家資料讀取失敗'
  } finally {
    isLoading.value = false
  }
}

function selectSort(sort: SortKey | 'name') {
  selectedSort.value = sort
  if (sort === 'recommend') {
    isRecommendationDialogOpen.value = true
    errorMessage.value = ''
  }
}

function clearFilters() {
  searchQuery.value = ''
  selectedFilter.value = 'all'
}

function closeRecommendationDialog() {
  if (isRecommendationLoading.value) return
  isRecommendationDialogOpen.value = false
  if (merchants.value.length === 0) {
    selectedSort.value = 'people'
  }
}

function currentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: number }
    return user.id || 1
  } catch {
    return 1
  }
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
      userId: currentUserId(),
      campus: selectedCampus.value,
      prompt,
      limit: 8,
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
    <PageHeader
      eyebrow="KuberEats Order"
      :title="`${selectedCampus} 今日訂餐`"
      subtitle="搜尋店名、分類或標籤，快速找到今天想吃的餐點。"
    >
      <template #action>
        <label class="date-picker">
          <span>日期</span>
          <input
            v-model="selectedDate"
            type="date"
            aria-label="訂餐日期"
          >
        </label>
      </template>
    </PageHeader>

    <section
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
    </section>

    <section class="search-panel">
      <label class="search-box">
        <span class="sr-only">搜尋商家</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="搜尋店名、分類、標籤"
          aria-label="搜尋商家"
        >
      </label>

      <div
        class="filter-bar compact"
        aria-label="快速篩選"
      >
        <button
          v-for="chip in filterChips"
          :key="chip.value"
          class="pill-button"
          :class="{ active: selectedFilter === chip.value }"
          type="button"
          @click="selectedFilter = chip.value"
        >
          {{ chip.label }}
        </button>
      </div>

      <div
        class="filter-bar compact"
        aria-label="排序"
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
      </div>
    </section>

    <section
      v-if="isRecommendationMode"
      class="recommendation-summary"
    >
      <div>
        <p class="eyebrow">
          Recommendation
        </p>
        <h2>系統推薦：{{ lastRecommendationPrompt }}</h2>
      </div>
      <button
        class="ghost-button"
        type="button"
        @click="isRecommendationDialogOpen = true"
      >
        重新輸入
      </button>
    </section>

    <ErrorState
      v-if="errorMessage"
      :message="errorMessage"
      retry-label="重新載入"
      @retry="fetchMerchants"
    />

    <LoadingState
      v-else-if="isLoading"
      variant="list"
      :rows="4"
      label="商家載入中"
    />

    <section
      v-else-if="visibleMerchants.length > 0"
      class="merchant-list"
      aria-label="店家列表"
    >
      <MerchantCard
        v-for="merchant in visibleMerchants"
        :key="merchant.id"
        :merchant="merchant"
        @select="navigateTo(`/merchants/${$event}`)"
      />
    </section>

    <EmptyState
      v-else
      icon="?"
      title="找不到符合條件的商家"
      description="試著清除搜尋或切換園區、分類。"
      action-label="清除篩選"
      @action="clearFilters"
    />

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
          placeholder="例如：今天想吃清爽一點，不要牛肉，最好 150 以下"
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

<style scoped>
.search-panel {
  display: grid;
  gap: 12px;
  margin: 16px 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: 14px;
}

.search-box input {
  width: 100%;
  min-height: 46px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}

.merchant-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 760px) {
  .merchant-list {
    grid-template-columns: 1fr;
  }
}
</style>
