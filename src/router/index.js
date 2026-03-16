import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/exam'
    },
    {
      path: '/exam',
      name: 'ExamSelect',
      component: () => import('@/views/ExamSelectView.vue'),
      meta: { guestLayout: true }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exam/session/:sessionId',
      name: 'ExamSession',
      component: () => import('@/views/ExamView.vue'),
      meta: { fullscreen: true }
    },
    {
      path: '/results/:id',
      name: 'ResultDetail',
      component: () => import('@/views/ResultView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/my/results',
      name: 'MyResults',
      component: () => import('@/views/MyResultsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/studies',
      name: 'Studies',
      component: () => import('@/views/StudyView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/studies/:id',
      name: 'StudyDetail',
      component: () => import('@/views/StudyDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/my/profile',
      name: 'Profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/timer',
      name: 'Timer',
      component: () => import('@/views/TimerView.vue')
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    auth.setPendingRedirect(to.fullPath)
    auth.openModal('login')
    return false
  }
})

export default router
