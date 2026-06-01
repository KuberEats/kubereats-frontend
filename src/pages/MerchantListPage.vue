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
import { useI18n, type MessageKey } from '../i18n'

const campuses: Campus[] = ['竹科', '南科', '中科', '高科']
const { t } = useI18n()

const sortOptions: { labelKey: MessageKey; value: SortKey | 'name' }[] = [
  { labelKey: 'merchantList.sort.recommend', value: 'recommend' },
  { labelKey: 'merchantList.sort.people', value: 'people' },
  { labelKey: 'merchantList.sort.popular', value: 'popular' },
  { labelKey: 'merchantList.sort.name', value: 'name' },
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
  { label: t('merchantList.filter.all'), value: 'all' },
  { label: t('merchantList.filter.open'), value: 'open' },
  { label: t('merchantList.filter.hot'), value: 'hot' },
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
    errorMessage.value = error instanceof Error ? error.message : t('merchantList.loadFailed')
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
    errorMessage.value = t('merchantList.promptRequired')
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
    errorMessage.value = error instanceof Error ? error.message : t('merchantList.recommendFailed')
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
      :eyebrow="t('merchantList.eyebrow')"
      :title="t('merchantList.title', { campus: selectedCampus })"
      :subtitle="t('merchantList.subtitle')"
    >
      <template #action>
        <label class="date-picker">
          <span>{{ t('merchantList.date') }}</span>
          <input
            v-model="selectedDate"
            type="date"
            :aria-label="t('merchantList.date')"
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
        <span class="sr-only">{{ t('merchantList.search') }}</span>
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="t('merchantList.searchPlaceholder')"
          :aria-label="t('merchantList.search')"
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
          {{ t(option.labelKey) }}
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
        <h2>{{ t('merchantList.recommendation', { prompt: lastRecommendationPrompt }) }}</h2>
      </div>
      <button
        class="ghost-button"
        type="button"
        @click="isRecommendationDialogOpen = true"
      >
        {{ t('merchantList.reInput') }}
      </button>
    </section>

    <ErrorState
      v-if="errorMessage"
      :message="errorMessage"
      :retry-label="t('action.reload')"
      @retry="fetchMerchants"
    />

    <LoadingState
      v-else-if="isLoading"
      variant="list"
      :rows="4"
      :label="t('merchantList.loading')"
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
      :title="t('merchantList.emptyTitle')"
      :description="t('merchantList.emptyDescription')"
      :action-label="t('merchantList.clearFilters')"
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
              {{ t('merchantList.dialogTitle') }}
            </h2>
          </div>
          <button
            class="ghost-button"
            type="button"
            :disabled="isRecommendationLoading"
            @click="closeRecommendationDialog"
          >
            {{ t('merchantList.close') }}
          </button>
        </div>

        <textarea
          v-model="recommendationPrompt"
          class="recommendation-input"
          rows="4"
          :placeholder="t('merchantList.dialogPlaceholder')"
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
            {{ isRecommendationLoading ? t('merchantList.recommending') : t('merchantList.askRecommend') }}
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
