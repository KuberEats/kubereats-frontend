<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getMyMerchant, listMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../../api/merchants'
import { navigateTo } from '../../router'
import type { MerchantInfo, MenuItem } from '../../api/types'

const merchant = ref<MerchantInfo | null>(null)
const menuItems = ref<MenuItem[]>([])
const error = ref('')
const loading = ref(true)
const showAddForm = ref(false)
const editingId = ref<number | null>(null)

const newItem = ref({ itemName: '', price: 0, maxDailyQuantity: 0 })
const editItem = ref({ itemName: '', price: 0, maxDailyQuantity: 0 })

const auditStatusText: Record<number, string> = {
  0: '待審核',
  1: '已通過',
  2: '已拒絕',
}

onMounted(async () => {
  try {
    merchant.value = await getMyMerchant()
    if (merchant.value.auditStatus === 1) {
      menuItems.value = await listMenuItems()
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('not found')) {
      navigateTo('/merchant/apply')
      return
    }
    error.value = e instanceof Error ? e.message : '載入失敗'
  } finally {
    loading.value = false
  }
})

async function handleAddItem() {
  try {
    const item = await createMenuItem(newItem.value)
    menuItems.value.push(item)
    showAddForm.value = false
    newItem.value = { itemName: '', price: 0, maxDailyQuantity: 0 }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '新增失敗'
  }
}

function startEdit(item: MenuItem) {
  editingId.value = item.id
  editItem.value = {
    itemName: item.itemName,
    price: item.price,
    maxDailyQuantity: item.maxDailyQuantity,
  }
}

async function handleUpdateItem(menuId: number) {
  try {
    const updated = await updateMenuItem(menuId, editItem.value)
    const idx = menuItems.value.findIndex(m => m.id === menuId)
    if (idx !== -1) menuItems.value[idx] = updated
    editingId.value = null
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '更新失敗'
  }
}

async function handleDeleteItem(menuId: number) {
  if (!confirm('確定要刪除此菜品嗎？')) return
  try {
    await deleteMenuItem(menuId)
    menuItems.value = menuItems.value.filter(m => m.id !== menuId)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '刪除失敗'
  }
}
</script>

<template>
  <div class="page-container">
    <div
      v-if="loading"
      class="loading"
    >
      載入中...
    </div>

    <template v-else-if="merchant">
      <div class="merchant-info card">
        <h2>{{ merchant.merchantName }}</h2>
        <div class="info-grid">
          <span>廠區：{{ merchant.campus }}</span>
          <span>分類：{{ merchant.category }}</span>
          <span>配送時間：{{ merchant.deliveryTime }}</span>
          <span>最低訂購：${{ merchant.minOrder }}</span>
          <span>最多訂購數量：{{ merchant.maxOrderQuantity === 0 ? '不限' : merchant.maxOrderQuantity }}</span>
          <span
            class="status"
            :class="'status-' + merchant.auditStatus"
          >
            狀態：{{ auditStatusText[merchant.auditStatus] ?? '未知' }}
          </span>
        </div>
        <div
          v-if="merchant.tags.length"
          class="tags"
        >
          <span
            v-for="tag in merchant.tags"
            :key="tag"
            class="tag"
          >{{ tag }}</span>
        </div>
      </div>

      <div
        v-if="merchant.auditStatus === 0"
        class="notice"
      >
        您的申請正在審核中，通過後即可管理菜單。
      </div>
      <div
        v-else-if="merchant.auditStatus === 2"
        class="notice error-notice"
      >
        您的申請已被拒絕，請聯繫福委會了解詳情。
      </div>

      <template v-if="merchant.auditStatus === 1">
        <div class="section-header">
          <h3>菜單管理</h3>
          <button
            class="btn-small"
            @click="showAddForm = !showAddForm"
          >
            {{ showAddForm ? '取消' : '+ 新增菜品' }}
          </button>
          <button
            class="btn-small btn-secondary"
            @click="navigateTo('/merchant/orders')"
          >
            查看今日訂單
          </button>
        </div>

        <div
          v-if="showAddForm"
          class="card add-form"
        >
          <div class="form-row">
            <input
              v-model="newItem.itemName"
              placeholder="品名"
            >
            <input
              v-model.number="newItem.price"
              type="number"
              placeholder="價格"
              min="1"
            >
            <input
              v-model.number="newItem.maxDailyQuantity"
              type="number"
              placeholder="每日限量"
              min="1"
            >
            <button
              class="btn-primary btn-small"
              @click="handleAddItem"
            >
              新增
            </button>
          </div>
        </div>

        <div
          v-if="menuItems.length === 0"
          class="notice"
        >
          尚未新增任何菜品
        </div>

        <div
          v-for="item in menuItems"
          :key="item.id"
          class="card menu-item"
        >
          <template v-if="editingId === item.id">
            <div class="form-row">
              <input
                v-model="editItem.itemName"
                placeholder="品名"
              >
              <input
                v-model.number="editItem.price"
                type="number"
                placeholder="價格"
              >
              <input
                v-model.number="editItem.maxDailyQuantity"
                type="number"
                placeholder="每日限量"
              >
              <button
                class="btn-small btn-primary"
                @click="handleUpdateItem(item.id)"
              >
                儲存
              </button>
              <button
                class="btn-small"
                @click="editingId = null"
              >
                取消
              </button>
            </div>
          </template>
          <template v-else>
            <div class="menu-item-info">
              <strong>{{ item.itemName }}</strong>
              <span>${{ item.price }}</span>
              <span>每日限量 {{ item.maxDailyQuantity }} 份</span>
            </div>
            <div class="menu-item-actions">
              <button
                class="btn-small"
                @click="startEdit(item)"
              >
                編輯
              </button>
              <button
                class="btn-small btn-danger"
                @click="handleDeleteItem(item.id)"
              >
                刪除
              </button>
            </div>
          </template>
        </div>
      </template>
    </template>

    <p
      v-if="error"
      class="error-text"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.loading { text-align: center; padding: 2rem; color: #999; }
.card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem; }
.merchant-info h2 { margin: 0 0 0.5rem; color: #333; }
.info-grid { display: flex; flex-wrap: wrap; gap: 1rem; color: #666; font-size: 0.9rem; }
.tags { margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.tag { background: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.status-0 { color: #f39c12; }
.status-1 { color: #27ae60; }
.status-2 { color: #e74c3c; }
.notice { text-align: center; padding: 1rem; color: #999; background: #fafafa; border-radius: 8px; margin-bottom: 1rem; }
.error-notice { color: #e74c3c; background: #fdf0f0; }
.section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.section-header h3 { margin: 0; flex: 1; color: #333; }
.form-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.form-row input { flex: 1; min-width: 100px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px; }
.menu-item { display: flex; justify-content: space-between; align-items: center; }
.menu-item-info { display: flex; gap: 1rem; align-items: center; }
.menu-item-actions { display: flex; gap: 0.5rem; }
.btn-primary { background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; padding: 0.4rem 0.75rem; }
.btn-primary:hover { background: #c0392b; }
.btn-small { padding: 0.4rem 0.75rem; border: 1px solid #ddd; border-radius: 4px; background: white; color: #333; cursor: pointer; font-size: 0.85rem; }
.btn-small:hover { background: #f5f5f5; }
.btn-secondary { background: #3498db; color: white; border: none; }
.btn-secondary:hover { background: #2980b9; }
.btn-danger { background: #e74c3c; color: white; border: none; }
.btn-danger:hover { background: #c0392b; }
.error-text { color: #e74c3c; font-size: 0.875rem; }
</style>
