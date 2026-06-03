<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getMyMerchant, listMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, uploadMenuImage } from '../../api/merchants'
import { navigateTo } from '../../router'
import type { DietaryType, MerchantInfo, MenuItem } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const merchant = ref<MerchantInfo | null>(null)
const menuItems = ref<MenuItem[]>([])
const error = ref('')
const loading = ref(true)
const deleting = ref(false)
const showAddForm = ref(false)
const editingId = ref<number | null>(null)
const pendingDeleteId = ref<number | null>(null)

interface MenuFormState {
  itemName: string
  price: number
  maxDailyQuantity: number
  dietaryType: DietaryType
  allergens: string[]
  certifications: string[]
  imageUrl: string
  caloriesKcal: number | null | ''
  proteinG: number | null | ''
  carbsG: number | null | ''
  fatG: number | null | ''
  sodiumMg: number | null | ''
  sugarG: number | null | ''
  servingSize: string
  ingredients: string
}

const dietaryOptions = [
  { value: 'MEAT', label: '葷食' },
  { value: 'VEGAN', label: '全素' },
  { value: 'OVO_LACTO', label: '蛋奶素' },
  { value: 'OVO', label: '蛋素' },
  { value: 'LACTO', label: '奶素' },
  { value: 'PESCATARIAN', label: '海鮮素' },
] satisfies { value: DietaryType; label: string }[]

const allergenOptions = ['花生', '堅果', '蛋', '奶', '麩質', '甲殼類', '魚', '大豆', '芝麻']
const certificationOptions = ['SGS', 'HACCP', 'ISO 22000', '清真', '產銷履歷']

const newItem = ref<MenuFormState>(createEmptyMenuForm())
const editItem = ref<MenuFormState>(createEmptyMenuForm())
const uploadingNew = ref(false)
const uploadingEdit = ref(false)

const auditStatusText: Record<number, string> = {
  0: '待審核',
  1: '已通過',
  2: '已拒絕',
}

function createEmptyMenuForm(): MenuFormState {
  return {
    itemName: '',
    price: 0,
    maxDailyQuantity: 0,
    dietaryType: 'MEAT',
    allergens: [],
    certifications: [],
    imageUrl: '',
    caloriesKcal: null,
    proteinG: null,
    carbsG: null,
    fatG: null,
    sodiumMg: null,
    sugarG: null,
    servingSize: '',
    ingredients: '',
  }
}

function dietaryText(value: string | null | undefined) {
  return dietaryOptions.find(option => option.value === value)?.label ?? '葷食'
}

function toggleValue(values: string[], value: string, checked: boolean) {
  if (checked) {
    return values.includes(value) ? values : [...values, value]
  }
  return values.filter(item => item !== value)
}

function updateMultiSelect(
  target: MenuFormState,
  field: 'allergens' | 'certifications',
  value: string,
  event: Event,
) {
  target[field] = toggleValue(target[field], value, (event.target as HTMLInputElement).checked)
}

function optionalNumber(value: number | null | '') {
  return value === '' ? null : value
}

function normalizeMenuForm(item: MenuFormState) {
  return {
    ...item,
    caloriesKcal: optionalNumber(item.caloriesKcal),
    proteinG: optionalNumber(item.proteinG),
    carbsG: optionalNumber(item.carbsG),
    fatG: optionalNumber(item.fatG),
    sodiumMg: optionalNumber(item.sodiumMg),
    sugarG: optionalNumber(item.sugarG),
    servingSize: item.servingSize.trim() || null,
    ingredients: item.ingredients.trim() || null,
  }
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
  error.value = ''
  try {
    const item = await createMenuItem(normalizeMenuForm(newItem.value))
    menuItems.value.push(item)
    showAddForm.value = false
    newItem.value = createEmptyMenuForm()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '新增失敗'
  }
}

function toggleAddForm() {
  showAddForm.value = !showAddForm.value
  if (showAddForm.value) {
    editingId.value = null
  }
}

function startEdit(item: MenuItem) {
  showAddForm.value = false
  editingId.value = item.id
  editItem.value = {
    itemName: item.itemName,
    price: item.price,
    maxDailyQuantity: item.maxDailyQuantity,
    dietaryType: (item.dietaryType as DietaryType | undefined) ?? 'MEAT',
    allergens: [...(item.allergens ?? [])],
    certifications: [...(item.certifications ?? [])],
    imageUrl: item.imageUrl ?? '',
    caloriesKcal: item.caloriesKcal ?? null,
    proteinG: item.proteinG ?? null,
    carbsG: item.carbsG ?? null,
    fatG: item.fatG ?? null,
    sodiumMg: item.sodiumMg ?? null,
    sugarG: item.sugarG ?? null,
    servingSize: item.servingSize ?? '',
    ingredients: item.ingredients ?? '',
  }
}

function cancelEdit() {
  editingId.value = null
  editItem.value = createEmptyMenuForm()
}

async function handleImageSelect(event: Event, target: 'new' | 'edit') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  error.value = ''
  if (target === 'new') uploadingNew.value = true
  else uploadingEdit.value = true

  try {
    const { imageUrl } = await uploadMenuImage(file)
    if (target === 'new') newItem.value.imageUrl = imageUrl
    else editItem.value.imageUrl = imageUrl
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '圖片上傳失敗'
  } finally {
    uploadingNew.value = false
    uploadingEdit.value = false
    input.value = ''
  }
}

async function handleUpdateItem(menuId: number) {
  error.value = ''
  try {
    const updated = await updateMenuItem(menuId, normalizeMenuForm(editItem.value))
    const idx = menuItems.value.findIndex(m => m.id === menuId)
    if (idx !== -1) menuItems.value[idx] = updated
    cancelEdit()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '更新失敗'
  }
}

function askDeleteItem(menuId: number) {
  pendingDeleteId.value = menuId
}

async function handleDeleteItem() {
  if (!pendingDeleteId.value) return
  deleting.value = true
  error.value = ''

  try {
    await deleteMenuItem(pendingDeleteId.value)
    menuItems.value = menuItems.value.filter(m => m.id !== pendingDeleteId.value)
    pendingDeleteId.value = null
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '刪除失敗'
  } finally {
    deleting.value = false
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
        <h2 data-testid="merchant-dashboard-name">
          {{ merchant.merchantName }}
        </h2>
        <div class="info-grid">
          <span>廠區：{{ merchant.campus }}</span>
          <span>分類：{{ merchant.category }}</span>
          <span>配送時間：{{ merchant.deliveryTime }}</span>
          <span>最低訂購：${{ merchant.minOrder }}</span>
          <span>最多訂購數量：{{ merchant.maxOrderQuantity === 0 ? '不限' : merchant.maxOrderQuantity }}</span>
          <span
            class="status"
            data-testid="merchant-audit-status"
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
        <div class="finance-actions">
          <button
            class="finance-btn"
            @click="navigateTo('/merchant/finance')"
          >
            <span class="finance-btn-icon">$</span>
            <span>收入總覽</span>
          </button>
        </div>

        <div class="section-header">
          <h3>菜單管理</h3>
          <button
            class="btn-small"
            data-testid="merchant-add-menu-toggle"
            @click="toggleAddForm"
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
          class="card menu-form-card add-form"
          data-testid="merchant-add-menu-form"
        >
          <div class="menu-form-header">
            <div>
              <h4>新增菜品</h4>
              <p>設定價格、每日供應量、飲食標示與圖片，員工會在訂餐頁看到這些資訊。</p>
            </div>
          </div>

          <div class="menu-form-primary">
            <input
              v-model="newItem.itemName"
              data-testid="merchant-menu-name-input"
              placeholder="品名"
            >
            <input
              v-model.number="newItem.price"
              data-testid="merchant-menu-price-input"
              type="number"
              placeholder="價格"
              min="1"
            >
            <input
              v-model.number="newItem.maxDailyQuantity"
              data-testid="merchant-menu-capacity-input"
              type="number"
              placeholder="每日限量"
              min="1"
            >
            <select v-model="newItem.dietaryType">
              <option
                v-for="option in dietaryOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <button
              class="btn-primary btn-small"
              data-testid="merchant-menu-create-button"
              :disabled="uploadingNew"
              @click="handleAddItem"
            >
              新增
            </button>
          </div>
          <div class="menu-meta-fields">
            <fieldset>
              <legend>過敏原</legend>
              <label
                v-for="allergen in allergenOptions"
                :key="allergen"
              >
                <input
                  type="checkbox"
                  :checked="newItem.allergens.includes(allergen)"
                  @change="updateMultiSelect(newItem, 'allergens', allergen, $event)"
                >
                {{ allergen }}
              </label>
            </fieldset>
            <fieldset>
              <legend>認證</legend>
              <label
                v-for="certification in certificationOptions"
                :key="certification"
              >
                <input
                  type="checkbox"
                  :checked="newItem.certifications.includes(certification)"
                  @change="updateMultiSelect(newItem, 'certifications', certification, $event)"
                >
                {{ certification }}
              </label>
            </fieldset>
          </div>
          <div class="menu-image-panel">
            <label class="upload-btn">
              <span>{{ uploadingNew ? '上傳中…' : (newItem.imageUrl ? '更換圖片' : '上傳圖片') }}</span>
              <small>JPG、PNG、WebP</small>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                :disabled="uploadingNew"
                data-testid="merchant-menu-image-input"
                @change="handleImageSelect($event, 'new')"
              >
            </label>
            <div
              v-if="newItem.imageUrl"
              class="image-preview-frame"
            >
              <img
                :src="newItem.imageUrl"
                class="image-preview"
                alt="菜品圖片預覽"
              >
            </div>
          </div>
          <div class="nutrition-fields">
            <input
              v-model.number="newItem.caloriesKcal"
              type="number"
              min="0"
              placeholder="熱量 kcal"
            >
            <input
              v-model.number="newItem.proteinG"
              type="number"
              min="0"
              step="0.1"
              placeholder="蛋白質 g"
            >
            <input
              v-model.number="newItem.carbsG"
              type="number"
              min="0"
              step="0.1"
              placeholder="碳水 g"
            >
            <input
              v-model.number="newItem.fatG"
              type="number"
              min="0"
              step="0.1"
              placeholder="脂肪 g"
            >
            <input
              v-model.number="newItem.sodiumMg"
              type="number"
              min="0"
              step="0.1"
              placeholder="鈉 mg"
            >
            <input
              v-model.number="newItem.sugarG"
              type="number"
              min="0"
              step="0.1"
              placeholder="糖 g"
            >
            <input
              v-model="newItem.servingSize"
              placeholder="份量，例如：1 份 / 350g"
            >
            <textarea
              v-model="newItem.ingredients"
              rows="2"
              placeholder="食材說明，例如：白飯、雞腿、青菜"
            />
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
          :class="{ 'menu-item-editing': editingId === item.id }"
          :data-menu-item-name="item.itemName"
        >
          <template v-if="editingId === item.id">
            <div class="menu-form-shell edit-form">
              <div class="menu-form-header">
                <div>
                  <h4>編輯菜品</h4>
                  <p>使用與新增菜品相同的欄位，調整後儲存即可更新員工看到的菜單。</p>
                </div>
                <div class="menu-form-actions">
                  <button
                    class="btn-small btn-primary"
                    :disabled="uploadingEdit"
                    @click="handleUpdateItem(item.id)"
                  >
                    儲存
                  </button>
                  <button
                    class="btn-small"
                    @click="cancelEdit"
                  >
                    取消
                  </button>
                </div>
              </div>

              <div class="menu-form-primary">
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
              <select v-model="editItem.dietaryType">
                <option
                  v-for="option in dietaryOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="menu-meta-fields">
              <fieldset>
                <legend>過敏原</legend>
                <label
                  v-for="allergen in allergenOptions"
                  :key="allergen"
                >
                  <input
                    type="checkbox"
                    :checked="editItem.allergens.includes(allergen)"
                    @change="updateMultiSelect(editItem, 'allergens', allergen, $event)"
                  >
                  {{ allergen }}
                </label>
              </fieldset>
              <fieldset>
                <legend>認證</legend>
                <label
                  v-for="certification in certificationOptions"
                  :key="certification"
                >
                  <input
                    type="checkbox"
                    :checked="editItem.certifications.includes(certification)"
                    @change="updateMultiSelect(editItem, 'certifications', certification, $event)"
                  >
                  {{ certification }}
                </label>
              </fieldset>
            </div>
            <div class="menu-image-panel">
              <label class="upload-btn">
                <span>{{ uploadingEdit ? '上傳中…' : (editItem.imageUrl ? '更換圖片' : '上傳圖片') }}</span>
                <small>JPG、PNG、WebP</small>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  :disabled="uploadingEdit"
                  @change="handleImageSelect($event, 'edit')"
                >
              </label>
              <div
                v-if="editItem.imageUrl"
                class="image-preview-frame"
              >
                <img
                  :src="editItem.imageUrl"
                  class="image-preview"
                  alt="菜品圖片預覽"
                >
              </div>
            </div>
            <div class="nutrition-fields">
              <input
                v-model.number="editItem.caloriesKcal"
                type="number"
                min="0"
                placeholder="熱量 kcal"
              >
              <input
                v-model.number="editItem.proteinG"
                type="number"
                min="0"
                step="0.1"
                placeholder="蛋白質 g"
              >
              <input
                v-model.number="editItem.carbsG"
                type="number"
                min="0"
                step="0.1"
                placeholder="碳水 g"
              >
              <input
                v-model.number="editItem.fatG"
                type="number"
                min="0"
                step="0.1"
                placeholder="脂肪 g"
              >
              <input
                v-model.number="editItem.sodiumMg"
                type="number"
                min="0"
                step="0.1"
                placeholder="鈉 mg"
              >
              <input
                v-model.number="editItem.sugarG"
                type="number"
                min="0"
                step="0.1"
                placeholder="糖 g"
              >
              <input
                v-model="editItem.servingSize"
                placeholder="份量，例如：1 份 / 350g"
              >
              <textarea
                v-model="editItem.ingredients"
                rows="2"
                placeholder="食材說明，例如：白飯、雞腿、青菜"
              />
            </div>
            </div>
          </template>
          <template v-else>
            <div class="menu-item-info">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                class="menu-item-thumb"
                :alt="item.itemName"
              >
              <strong>{{ item.itemName }}</strong>
              <span>${{ item.price }}</span>
              <span>每日限量 {{ item.maxDailyQuantity }} 份</span>
              <span>{{ dietaryText(item.dietaryType) }}</span>
              <span v-if="item.caloriesKcal != null">{{ item.caloriesKcal }} kcal</span>
              <span v-if="item.proteinG != null">蛋白質 {{ item.proteinG }}g</span>
              <div class="menu-badges">
                <span
                  v-for="badge in [...(item.allergens ?? []).map(allergen => `含${allergen}`), ...(item.certifications ?? [])]"
                  :key="badge"
                >
                  {{ badge }}
                </span>
              </div>
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
                @click="askDeleteItem(item.id)"
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

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="刪除菜品"
      message="確定要刪除此菜品嗎？刪除後員工將無法再選購此品項。"
      confirm-label="刪除"
      tone="danger"
      :loading="deleting"
      @confirm="handleDeleteItem"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>

<style scoped>
.page-container { max-width: 1120px; margin: 2rem auto; padding: 0 1rem; }
.loading { text-align: center; padding: 2rem; color: #999; }
.card { background: #ffffff; padding: 1.25rem; border: 1px solid #ece7df; border-radius: 8px; box-shadow: 0 8px 24px rgba(17,24,39,0.08); margin-bottom: 1rem; }
.merchant-info h2 { margin: 0 0 0.5rem; color: #333; }
.info-grid { display: flex; flex-wrap: wrap; gap: 1rem; color: #666; font-size: 0.9rem; }
.tags { margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.tag { background: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.status-0 { color: #f39c12; }
.status-1 { color: #27ae60; }
.status-2 { color: #e74c3c; }
.notice { text-align: center; padding: 1rem; color: #777; background: #fafafa; border-radius: 8px; margin-bottom: 1rem; }
.error-notice { color: #e74c3c; background: #fdf0f0; }
.section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.section-header h3 { margin: 0; flex: 1; color: #333; font-size: 1.35rem; }

.menu-form-card,
.menu-item-editing {
  display: grid;
  gap: 1rem;
}

.menu-form-shell {
  display: grid;
  width: 100%;
  gap: 1rem;
}

.menu-form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #f0ebe4;
  padding-bottom: 0.85rem;
}

.menu-form-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.05rem;
}

.menu-form-header p {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.88rem;
}

.menu-form-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.5rem;
}

.menu-form-primary {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) minmax(120px, 1fr) minmax(140px, 1fr) minmax(150px, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
}

.menu-form-primary input,
.menu-form-primary select,
.nutrition-fields input,
.nutrition-fields textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #d8d2c8;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  padding: 0.72rem 0.85rem;
  font-size: 0.95rem;
}

.menu-form-primary input:focus,
.menu-form-primary select:focus,
.nutrition-fields input:focus,
.nutrition-fields textarea:focus {
  outline: 2px solid rgba(249, 115, 22, 0.22);
  border-color: #f97316;
}

.menu-meta-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}

.menu-meta-fields fieldset {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
  gap: 0.65rem 0.75rem;
  min-width: 0;
  border: 1px solid #ddd6cc;
  border-radius: 8px;
  padding: 1rem;
}

.menu-meta-fields legend {
  color: #333;
  font-size: 0.9rem;
  font-weight: 800;
  padding: 0 0.35rem;
}

.menu-meta-fields label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #4b5563;
  font-size: 0.9rem;
  font-weight: 700;
}

.menu-meta-fields input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #f97316;
}

.menu-image-panel {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 96px;
}

.upload-btn {
  display: grid;
  min-width: 160px;
  min-height: 82px;
  place-items: center;
  border: 1px dashed #bbb3a7;
  border-radius: 8px;
  background: #fffaf5;
  color: #374151;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 800;
  padding: 0.85rem 1rem;
  text-align: center;
}

.upload-btn small {
  color: #8a8178;
  font-size: 0.78rem;
  font-weight: 700;
}

.upload-btn:hover { background: #fff4e8; border-color: #f97316; }
.image-preview-frame { border: 1px solid #eee4d8; border-radius: 8px; padding: 0.35rem; background: #ffffff; }
.image-preview { display: block; width: 88px; height: 88px; object-fit: cover; border-radius: 6px; }

.nutrition-fields {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.nutrition-fields textarea {
  grid-column: span 2;
  min-height: 90px;
  resize: vertical;
}

.menu-item-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid #eee; }
.menu-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 1rem; }
.menu-item-info { display: flex; gap: 0.85rem; align-items: center; flex-wrap: wrap; min-width: 0; }
.menu-item-info strong { font-size: 1rem; color: #1f2937; }
.menu-item-info > span { color: #555; font-size: 0.9rem; }
.menu-item-actions { display: flex; gap: 0.5rem; }
.menu-badges { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.menu-badges span { background: #f3f4f6; border-radius: 6px; color: #666; font-size: 0.78rem; padding: 0.22rem 0.5rem; }
.btn-primary { background: #f97316; color: white; border: none; border-radius: 8px; cursor: pointer; padding: 0.65rem 1rem; }
.btn-primary:hover { background: #ea580c; }
.btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
.btn-small { padding: 0.65rem 0.9rem; border: 1px solid #d8d2c8; border-radius: 8px; background: white; color: #333; cursor: pointer; font-size: 0.9rem; font-weight: 800; }
.btn-small:hover { background: #f7f3ef; }
.btn-secondary { background: #4f93d2; color: white; border: none; }
.btn-secondary:hover { background: #367ec0; }
.btn-danger { background: #dc2626; color: white; border: none; }
.btn-danger:hover { background: #b91c1c; }
.finance-actions { display: flex; gap: 1rem; margin-bottom: 1rem; }
.finance-btn { display: flex; align-items: center; gap: 0.75rem; flex: 1; padding: 1rem; background: white; border: 1px solid #eee; border-radius: 8px; cursor: pointer; font-size: 0.95rem; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: border-color 0.2s; }
.finance-btn:hover { border-color: #f97316; }
.finance-btn-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 8px; background: #fff7ed; color: #f97316; font-size: 0.75rem; font-weight: 800; flex-shrink: 0; }
.error-text { color: #e74c3c; font-size: 0.875rem; }

@media (max-width: 980px) {
  .menu-form-primary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .menu-form-primary input:first-child {
    grid-column: 1 / -1;
  }

  .menu-form-primary .btn-primary {
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .page-container { margin: 1rem auto; }
  .section-header { align-items: stretch; flex-direction: column; }
  .finance-actions { flex-direction: column; }
  .menu-form-header,
  .menu-image-panel { align-items: stretch; flex-direction: column; }
  .menu-form-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
  .menu-form-primary { grid-template-columns: 1fr; }
  .menu-form-primary input:first-child { grid-column: auto; }
  .menu-form-primary .btn-primary { justify-self: stretch; }
  .menu-meta-fields { grid-template-columns: 1fr; }
  .menu-meta-fields fieldset { grid-template-columns: 1fr; }
  .nutrition-fields { grid-template-columns: 1fr; }
  .nutrition-fields textarea { grid-column: auto; }
  .menu-item { align-items: stretch; flex-direction: column; gap: 0.75rem; }
  .menu-item-info { align-items: flex-start; flex-direction: column; gap: 0.35rem; }
  .menu-item-actions { display: grid; grid-template-columns: 1fr 1fr; }
}
</style>
