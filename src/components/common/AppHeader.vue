<template>
  <header class="app-header">
    <div class="header-left">
      <button class="hamburger" @click="toggleSidebar" aria-label="메뉴">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>
    <div class="header-right">
      <template v-if="auth.isLoggedIn">
        <button class="icon-btn" title="알림">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="notif-dot"></span>
        </button>
        <div class="user-avatar">{{ auth.user?.nickname?.charAt(0) || 'U' }}</div>
      </template>
      <template v-else>
        <button class="btn-login" @click="auth.openModal('login')">로그인</button>
      </template>
    </div>
  </header>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()

const toggleSidebar = inject('toggleSidebar')

const titleMap = {
  Dashboard: '대시보드',
  ExamSelect: '시험 응시',
  MyResults: '내 성적',
  Studies: '스터디',
  StudyDetail: '스터디 상세',
  Profile: '마이페이지',
  ResultDetail: '결과 확인',
  Timer: '타이머/메모/계산기'
}

const pageTitle = computed(() => titleMap[route.name] || '')
</script>

<style scoped>
.app-header {
  height: 58px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: background 0.15s;
}
.icon-btn:hover { background: var(--bg); }

.notif-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  background: #ef4444;
  border-radius: 50%;
  border: 1.5px solid #fff;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-login {
  background: var(--primary);
  color: #fff;
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;
}
.btn-login:hover { background: var(--primary-hover); }

.hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--text-muted);
  background: transparent;
  transition: background 0.15s;
  flex-shrink: 0;
}
.hamburger:hover { background: var(--bg); }

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
