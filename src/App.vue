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

    <!-- 공지사항 모달 -->
    <NoticeModal v-if="showNotice" @close="handleNoticeClose" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/common/Sidebar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AuthModal from '@/components/common/AuthModal.vue'
import NoticeModal from '@/components/common/NoticeModal.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

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
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-content > * {
  width: 100%;
}
</style>
