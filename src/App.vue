<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <a class="btn btn-ghost normal-case text-xl">KubeEats Finance</a>
      </div>
      <div class="flex-none">
        <ul class="menu menu-horizontal px-1">
          <li><router-link to="/merchant">Merchant</router-link></li>
          <li><router-link to="/staff">Staff</router-link></li>
          <li><router-link to="/finance">Reports</router-link></li>
        </ul>
      </div>
    </div>
    
    <div class="container mx-auto p-4">
      <router-view></router-view>
    </div>
  </div>
</template>

<style>
/* Reset some default styles from Vite template if needed */
body {
  background-color: transparent !important;
  color: inherit !important;
  display: block !important;
}
</style>
