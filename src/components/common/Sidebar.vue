<template>
  <aside class="sidebar" :class="{ open: sidebarOpen }">
    <button class="close-btn" @click="toggleSidebar" aria-label="사이드바 닫기">✕</button>
    <div class="sidebar-logo" @click="router.push(auth.isLoggedIn ? '/dashboard' : '/exam')" style="cursor: pointer;">
      <div class="logo-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" fill="white"/>
          <rect x="14" y="3" width="7" height="7" rx="1" fill="white" opacity="0.6"/>
          <rect x="3" y="14" width="7" height="7" rx="1" fill="white" opacity="0.6"/>
          <rect x="14" y="14" width="7" height="7" rx="1" fill="white" opacity="0.3"/>
        </svg>
      </div>
      <div>
        <div class="logo-title">AptitudePro</div>
        <div class="logo-sub">인적성 검사 플랫폼</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <template v-if="auth.isLoggedIn">
        <router-link to="/dashboard" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          대시보드
        </router-link>
        <router-link to="/exam" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
          시험 응시
        </router-link>
        <router-link to="/my/results" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          내 성적
        </router-link>
        <router-link to="/studies" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          스터디
        </router-link>
        <router-link to="/my/study-log" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          내 학습 기록
        </router-link>
        <router-link to="/timer" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          타이머/메모/계산기
        </router-link>
        <router-link to="/my/profile" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          마이페이지
        </router-link>
      </template>
      <template v-else>
        <router-link to="/exam" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          시험 응시
        </router-link>
        <router-link to="/timer" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          타이머/메모/계산기
        </router-link>
      </template>
    </nav>

    <div class="sidebar-footer" v-if="auth.isLoggedIn">
      <button class="nav-item logout-btn" @click="handleLogout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        로그아웃
      </button>
    </div>
  </aside>
</template>

<script setup>
import { inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const sidebarOpen = inject('sidebarOpen')
const toggleSidebar = inject('toggleSidebar')

async function handleLogout() {
  await auth.logout()
  router.push('/exam')
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  z-index: 100;
  padding: 0;
  transform: translateX(-100%);
  transition: transform 0.25s;
}
.sidebar.open {
  transform: translateX(0);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.logo-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  line-height: 1.2;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  color: rgba(255,255,255,0.55);
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.15s;
  background: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  color: rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.07);
}

.nav-item.active {
  color: #fff;
  background: rgba(255,255,255,0.12);
  font-weight: 600;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.logout-btn {
  color: rgba(255,255,255,0.45);
}
.logout-btn:hover {
  color: #ef4444;
  background: rgba(239,68,68,0.1);
}

.close-btn {
  display: none;
  position: absolute;
  top: 14px;
  right: 12px;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: rgba(255,255,255,0.6);
  background: transparent;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

@media (max-width: 768px) {
  .close-btn { display: flex; }
}
</style>
