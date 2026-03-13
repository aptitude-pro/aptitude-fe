<template>
  <div id="app-root">
    <!-- 시험 응시 풀스크린 -->
    <template v-if="route.meta.fullscreen">
      <div style="width:100%;height:100vh;overflow:hidden;">
        <router-view />
      </div>
    </template>

    <!-- 일반 레이아웃 (사이드바 포함) -->
    <template v-else>
      <Sidebar />
      <div class="main-area">
        <AppHeader />
        <main class="page-content">
          <router-view />
        </main>
      </div>
    </template>

    <!-- 인증 모달 -->
    <AuthModal v-if="authStore.showModal" />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import Sidebar from '@/components/common/Sidebar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AuthModal from '@/components/common/AuthModal.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
</script>

<style>
#app-root {
  display: flex;
  min-height: 100vh;
}
.main-area {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
}
.page-content {
  flex: 1;
  padding: 28px 32px;
  overflow-y: auto;
}
</style>
