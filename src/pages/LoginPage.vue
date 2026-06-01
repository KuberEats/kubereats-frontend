<script setup lang="ts">
import { ref } from 'vue'
import { login, register } from '../api/auth'
import { setTokens } from '../api/client'
import { navigateTo } from '../router'
import type { UserRole } from '../api/types'

const isRegister = ref(false)
const username = ref('')
const password = ref('')
const role = ref<UserRole>('employee')
const error = ref('')
const successMessage = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    if (isRegister.value) {
      await register(username.value, password.value, role.value)
      isRegister.value = false
      error.value = ''
      password.value = ''
      successMessage.value = '註冊成功，請登入。'
      return
    }

    const tokens = await login(username.value, password.value)
    setTokens(tokens.accessToken, tokens.refreshToken)

    const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]))
    const userRole = payload.role as UserRole
    localStorage.setItem('user', JSON.stringify({ id: Number(payload.sub), role: userRole }))

    if (userRole === 'merchant') {
      navigateTo('/merchant/dashboard')
    } else if (userRole === 'committee') {
      navigateTo('/committee/review')
    } else {
      navigateTo('/merchants')
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '操作失敗'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>KuberEats</h1>
      <h2>{{ isRegister ? '註冊' : '登入' }}</h2>

      <form
        data-testid="auth-form"
        @submit.prevent="handleSubmit"
      >
        <div class="form-group">
          <label>帳號</label>
          <input
            v-model="username"
            data-testid="auth-username-input"
            type="text"
            placeholder="請輸入帳號"
            required
          >
        </div>

        <div class="form-group">
          <label>密碼</label>
          <input
            v-model="password"
            data-testid="auth-password-input"
            type="password"
            placeholder="請輸入密碼"
            required
          >
        </div>

        <div
          v-if="isRegister"
          class="form-group"
        >
          <label>角色</label>
          <select v-model="role">
            <option value="employee">
              員工
            </option>
            <option value="merchant">
              商家
            </option>
            <option value="committee">
              福委會
            </option>
          </select>
        </div>

        <p
          v-if="error"
          class="error-text"
        >
          {{ error }}
        </p>

        <p
          v-if="successMessage"
          class="success-text"
          role="status"
        >
          {{ successMessage }}
        </p>

        <button
          type="submit"
          class="btn-primary"
          data-testid="auth-submit-button"
          :disabled="loading"
        >
          {{ loading ? '處理中...' : (isRegister ? '註冊' : '登入') }}
        </button>
      </form>

      <p class="toggle-text">
        {{ isRegister ? '已有帳號？' : '還沒有帳號？' }}
        <button
          type="button"
          class="link-button"
          data-testid="auth-mode-toggle"
          @click="isRegister = !isRegister; error = ''; successMessage = ''"
        >
          {{ isRegister ? '登入' : '註冊' }}
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 1rem;
}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
.login-card h1 {
  text-align: center;
  color: #e74c3c;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}
.login-card h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: #555;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}
.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}
.btn-primary:hover { background: #c0392b; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.error-text { color: #e74c3c; font-size: 0.875rem; margin-bottom: 0.5rem; }
.success-text { color: #047857; font-size: 0.875rem; margin-bottom: 0.5rem; }
.toggle-text { text-align: center; margin-top: 1rem; color: #666; }
.link-button {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: inherit;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
}
</style>
