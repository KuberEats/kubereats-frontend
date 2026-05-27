<script setup lang="ts">
import { ref } from 'vue'
import { applyMerchant } from '../../api/merchants'
import { navigateTo } from '../../router'

const form = ref({
  merchantName: '',
  campus: '',
  category: '',
  minOrder: 0,
  maxOrderQuantity: 0,
  deliveryTime: '',
  tags: '',
})
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await applyMerchant({
      ...form.value,
      tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    alert('申請已送出，請等待福委會審核')
    navigateTo('/merchant/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '申請失敗'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <h2>商家申請加入平台</h2>
    <form
      class="apply-form"
      @submit.prevent="handleSubmit"
    >
      <div class="form-group">
        <label>商家名稱</label>
        <input
          v-model="form.merchantName"
          type="text"
          required
        >
      </div>
      <div class="form-group">
        <label>廠區</label>
        <select
          v-model="form.campus"
          required
        >
          <option
            value=""
            disabled
          >
            請選擇廠區
          </option>
          <option value="竹科">
            竹科
          </option>
          <option value="南科">
            南科
          </option>
          <option value="中科">
            中科
          </option>
          <option value="高科">
            高科
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>分類</label>
        <input
          v-model="form.category"
          type="text"
          placeholder="例如：便當、麵食"
          required
        >
      </div>
      <div class="form-group">
        <label>最低訂購金額</label>
        <input
          v-model.number="form.minOrder"
          type="number"
          min="0"
        >
      </div>
      <div class="form-group">
        <label>最多訂購數量</label>
        <input
          v-model.number="form.maxOrderQuantity"
          type="number"
          min="0"
          placeholder="0 表示不限制"
        >
      </div>
      <div class="form-group">
        <label>配送時間</label>
        <input
          v-model="form.deliveryTime"
          type="text"
          placeholder="例如：30分鐘"
          required
        >
      </div>
      <div class="form-group">
        <label>標籤（逗號分隔）</label>
        <input
          v-model="form.tags"
          type="text"
          placeholder="例如：便當, 台式, 健康"
        >
      </div>
      <p
        v-if="error"
        class="error-text"
      >
        {{ error }}
      </p>
      <button
        type="submit"
        class="btn-primary"
        :disabled="loading"
      >
        {{ loading ? '送出中...' : '送出申請' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.page-container { max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
.apply-form { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-weight: 600; color: #555; }
.form-group input, .form-group select {
  width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; box-sizing: border-box;
}
.btn-primary {
  width: 100%; padding: 0.75rem; background: #e74c3c; color: white;
  border: none; border-radius: 4px; font-size: 1rem; cursor: pointer;
}
.btn-primary:hover { background: #c0392b; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.error-text { color: #e74c3c; font-size: 0.875rem; }
</style>
