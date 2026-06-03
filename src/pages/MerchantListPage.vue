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

type MerchantSortOption = SortKey | 'leastPeople'

const sortOptions: { labelKey: MessageKey; value: MerchantSortOption }[] = [
  { labelKey: 'merchantList.sort.recommend', value: 'recommend' },
  { labelKey: 'merchantList.sort.people', value: 'people' },
  { labelKey: 'merchantList.sort.leastPeople', value: 'leastPeople' },
]

const selectedCampus = ref<Campus>('竹科')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedSort = ref<MerchantSortOption>('recommend')
const merchants = ref<Merchant[]>([])
const isLoading = ref(false)
const isRecommendationLoading = ref(false)
const errorMessage = ref('')
const recommendationPrompt = ref('')
const lastRecommendationPrompt = ref('')
const isRecommendationDialogOpen = ref(true)
const isRecommendationMode = ref(false)

const visibleMerchants = computed(() => {
  return [...merchants.value]
    .sort((a, b) => {
      if (selectedSort.value === 'leastPeople') {
        return (a.orderCount ?? 0) - (b.orderCount ?? 0)
      }
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
      selectedSort.value === 'leastPeople' ? 'people' : selectedSort.value,
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('merchantList.loadFailed')
  } finally {
    isLoading.value = false
  }
}

function selectSort(sort: MerchantSortOption) {
  selectedSort.value = sort
  if (sort === 'recommend') {
    isRecommendationDialogOpen.value = true
    errorMessage.value = ''
  }
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

    <section class="recommendation-controls">
      <div
        class="filter-bar compact"
        aria-label="排序"
      >
        <button
          v-for="option in sortOptions"
          :key="option.value"
          class="pill-button"
          :class="{ active: selectedSort === option.value, featured: option.value === 'recommend' }"
          type="button"
          :aria-label="`排序：${t(option.labelKey)}`"
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
      :action-label="t('merchantList.askRecommend')"
      @action="isRecommendationDialogOpen = true"
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
.recommendation-controls {
  display: grid;
  gap: 12px;
  margin: 16px 0;
}

.pill-button.featured {
  border-color: #f97316;
  font-weight: 800;
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
