<script setup lang="ts">
import { computed, ref } from 'vue'

type Campus = '竹科' | '南科' | '中科' | '高科'
type SortKey = 'people' | 'popular' | 'recommend'

interface Restaurant {
  id: number
  name: string
  campus: Campus
  category: string
  rating: number
  orderCount: number
  minOrder: number
  deliveryTime: string
  tags: string[]
}

const campuses: Campus[] = ['竹科', '南科', '中科', '高科']

const sortOptions: { label: string; value: SortKey }[] = [
  { label: '最多人美食', value: 'people' },
  { label: '最常美食', value: 'popular' },
  { label: '系統推薦', value: 'recommend' },
]

const selectedCampus = ref<Campus>('竹科')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedSort = ref<SortKey>('recommend')

const restaurants = ref<Restaurant[]>([
  {
    id: 1,
    name: '阿明便當',
    campus: '竹科',
    category: '台式便當',
    rating: 4.8,
    orderCount: 126,
    minOrder: 80,
    deliveryTime: '25-35 分鐘',
    tags: ['熱賣', '雞腿飯', '可團訂'],
  },
  {
    id: 2,
    name: '小森咖哩',
    campus: '竹科',
    category: '日式咖哩',
    rating: 4.6,
    orderCount: 92,
    minOrder: 120,
    deliveryTime: '30-40 分鐘',
    tags: ['人氣', '咖哩飯', '今日可訂'],
  },
  {
    id: 3,
    name: '清爽蔬食盒',
    campus: '竹科',
    category: '健康餐盒',
    rating: 4.7,
    orderCount: 76,
    minOrder: 100,
    deliveryTime: '20-30 分鐘',
    tags: ['低卡', '蔬食', '午餐推薦'],
  },
  {
    id: 4,
    name: '南科牛肉麵',
    campus: '南科',
    category: '麵食',
    rating: 4.5,
    orderCount: 88,
    minOrder: 90,
    deliveryTime: '30-45 分鐘',
    tags: ['牛肉麵', '湯麵', '多人訂購'],
  },
  {
    id: 5,
    name: '中科港式燒臘',
    campus: '中科',
    category: '港式',
    rating: 4.4,
    orderCount: 104,
    minOrder: 95,
    deliveryTime: '25-35 分鐘',
    tags: ['燒臘', '三寶飯', '熱門'],
  },
])

const filteredRestaurants = computed(() => {
  const list = restaurants.value.filter(
    restaurant => restaurant.campus === selectedCampus.value,
  )

  return [...list].sort((a, b) => {
    if (selectedSort.value === 'people') {
      return b.orderCount - a.orderCount
    }

    if (selectedSort.value === 'popular') {
      return b.rating - a.rating
    }

    return b.rating * 20 + b.orderCount - (a.rating * 20 + a.orderCount)
  })
})
</script>

<template>
  <main class="order-page">
    <header class="order-header">
      <nav class="campus-tabs" aria-label="園區分類">
        <button
          v-for="campus in campuses"
          :key="campus"
          class="campus-tab"
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
        <p>
          選擇日期、園區與排序方式，快速找到今天適合團訂的店家。
        </p>
      </div>
    </section>

    <section class="filter-bar" aria-label="排序篩選">
      <button
        v-for="option in sortOptions"
        :key="option.value"
        class="filter-button"
        :class="{ active: selectedSort === option.value }"
        type="button"
        @click="selectedSort = option.value"
      >
        {{ option.label }}
      </button>
    </section>

    <section class="restaurant-list" aria-label="店家列表">
      <article
        v-for="restaurant in filteredRestaurants"
        :key="restaurant.id"
        class="restaurant-card"
      >
        <div class="restaurant-image">
          {{ restaurant.name.slice(0, 1) }}
        </div>

        <div class="restaurant-info">
          <div class="restaurant-title-row">
            <div>
              <h2>{{ restaurant.name }}</h2>
              <p>{{ restaurant.category }}</p>
            </div>

            <span class="rating">★ {{ restaurant.rating }}</span>
          </div>

          <div class="restaurant-meta">
            <span>{{ restaurant.orderCount }} 人訂過</span>
            <span>低消 ${{ restaurant.minOrder }}</span>
            <span>{{ restaurant.deliveryTime }}</span>
          </div>

          <div class="tag-list">
            <span v-for="tag in restaurant.tags" :key="tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </article>

      <p v-if="filteredRestaurants.length === 0" class="empty-state">
        目前這個園區還沒有可訂店家。
      </p>
    </section>
  </main>
</template>

<style scoped>
.order-page {
  min-height: 100vh;
  background: #f7f5f2;
  color: #1f2933;
  padding: 24px;
}

.order-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  background: #f7f5f2;
}

.campus-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.campus-tab,
.filter-button {
  border: 1px solid #d8d2c8;
  background: #ffffff;
  color: #374151;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 15px;
  white-space: nowrap;
  cursor: pointer;
}

.campus-tab.active,
.filter-button.active {
  border-color: #f97316;
  background: #f97316;
  color: #ffffff;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  font-size: 14px;
  color: #6b7280;
}

.date-picker input {
  border: 1px solid #d8d2c8;
  border-radius: 8px;
  padding: 9px 12px;
  background: #ffffff;
  color: #111827;
}

.hero-panel {
  display: flex;
  align-items: end;
  min-height: 160px;
  margin-top: 8px;
  padding: 28px;
  border: 1px solid #e3ded6;
  border-radius: 16px;
  background: #ffffff;
}

.eyebrow {
  margin: 0 0 8px;
  color: #f97316;
  font-size: 13px;
  font-weight: 700;
}

.hero-panel h1 {
  margin: 0 0 8px;
  font-size: 32px;
  line-height: 1.2;
}

.hero-panel p {
  margin: 0;
  color: #6b7280;
}

.filter-bar {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 18px 0;
}

.restaurant-list {
  display: grid;
  gap: 16px;
  padding-bottom: 48px;
}

.restaurant-card {
  display: grid;
  grid-template-columns: 128px 1fr;
  gap: 18px;
  padding: 16px;
  border: 1px solid #e3ded6;
  border-radius: 16px;
  background: #ffffff;
}

.restaurant-image {
  display: grid;
  place-items: center;
  min-height: 112px;
  border-radius: 12px;
  background: #ffe7d1;
  color: #c2410c;
  font-size: 36px;
  font-weight: 800;
}

.restaurant-info {
  min-width: 0;
}

.restaurant-title-row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.restaurant-title-row h2 {
  margin: 0 0 4px;
  font-size: 22px;
}

.restaurant-title-row p {
  margin: 0;
  color: #6b7280;
}

.rating {
  color: #f59e0b;
  font-weight: 700;
  white-space: nowrap;
}

.restaurant-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 14px;
  color: #4b5563;
  font-size: 14px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-list span {
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  padding: 6px 10px;
  font-size: 13px;
}

.empty-state {
  padding: 40px 16px;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 720px) {
  .order-page {
    padding: 16px;
  }

  .order-header {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-panel {
    min-height: 140px;
    padding: 22px;
  }

  .hero-panel h1 {
    font-size: 26px;
  }

  .restaurant-card {
    grid-template-columns: 1fr;
  }

  .restaurant-image {
    min-height: 140px;
  }
}
</style>
