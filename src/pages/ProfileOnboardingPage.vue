<script setup lang="ts">
import CustomerProfileForm from '../components/profile/CustomerProfileForm.vue'
import PageHeader from '../components/ux/PageHeader.vue'
import SectionCard from '../components/ux/SectionCard.vue'
import { useCustomerProfile, type CustomerProfile } from '../composables/useCustomerProfile'
import { navigateTo } from '../router'

const customerProfile = useCustomerProfile()
customerProfile.load()

function handleSubmit(profile: CustomerProfile) {
  customerProfile.complete(profile)
  navigateTo('/merchants')
}
</script>

<template>
  <main class="page profile-page">
    <PageHeader
      eyebrow="Profile"
      title="個人訂餐資料"
      subtitle="先保存常用聯絡資訊、飲食禁忌與備註，結帳時只需要確認餐點。"
    />

    <SectionCard class="profile-card">
      <CustomerProfileForm
        :profile="customerProfile.profile.value"
        submit-label="儲存並開始訂餐"
        @submit="handleSubmit"
      />
    </SectionCard>
  </main>
</template>

<style scoped>
.profile-page {
  max-width: 820px;
}

.profile-card {
  margin-inline: auto;
}
</style>
