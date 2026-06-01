<template>
  <section class="section-card">
    <slot />
  </section>
</template>

<style scoped>
.section-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: 18px;
}
</style>
