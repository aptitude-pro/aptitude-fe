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
      <div v-if="sidebarOpen" class="mobile-overlay" @click="toggleSidebar" />
      <div class="main-area" :class="{ 'sidebar-open': sidebarOpen }">
        <AppHeader />
        <main class="page-content">
          <router-view />
        </main>
      </div>
    </template>

    <!-- 인증 모달 -->
    <AuthModal v-if="authStore.showModal" />

    <!-- 공지사항 모달 -->
    <NoticeModal v-if="showNotice" @close="handleNoticeClose" />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/common/Sidebar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AuthModal from '@/components/common/AuthModal.vue'
import NoticeModal from '@/components/common/NoticeModal.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const sidebarOpen = ref(window.innerWidth > 768)
function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
provide('sidebarOpen', sidebarOpen)
provide('toggleSidebar', toggleSidebar)

const today = new Date().toISOString().slice(0, 10)
const showNotice = ref(localStorage.getItem('noticeHiddenDate') !== today)

function handleNoticeClose(hideToday) {
  if (hideToday) {
    localStorage.setItem('noticeHiddenDate', today)
  }
  showNotice.value = false
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('notificationSettings')
    if (saved) {
      const s = JSON.parse(saved)
      if (s.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    }
  } catch (_) {}
})
</script>

<style>
#app-root {
  display: flex;
  min-height: 100vh;
}
.main-area {
  flex: 1;
  margin-left: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
  transition: margin-left 0.25s;
}
.main-area.sidebar-open {
  margin-left: var(--sidebar-width);
}
.page-content {
  flex: 1;
  padding: 28px 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-content > * {
  width: 100%;
}

@media (max-width: 768px) {
  .main-area,
  .main-area.sidebar-open { margin-left: 0; }
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 99;
  }
}
</style>
