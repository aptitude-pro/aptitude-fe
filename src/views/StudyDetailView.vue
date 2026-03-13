<template>
  <div class="study-detail">
    <div class="page-header">
      <router-link to="/studies" class="back-btn">← 스터디 목록</router-link>
      <div class="header-info" v-if="study">
        <h2>{{ study.name }}</h2>
        <div class="header-badges">
          <span class="type-badge">{{ study.examType }}</span>
          <button class="code-badge" @click="copyCode">
            초대코드: <strong>{{ study.inviteCode }}</strong>
            <span class="copy-icon">{{ codeCopied ? '✓' : '⎘' }}</span>
          </button>
        </div>
      </div>
      <button v-if="study && !study.myRole && study.isPublic"
              class="btn-primary" @click="handleJoinPublic" :disabled="joinLoading">
        {{ joinLoading ? '참가 중...' : '참가하기' }}
      </button>
      <button v-if="study && study.myRole && study.myRole !== 'LEADER'" class="btn-danger" @click="handleLeave">탈퇴</button>
    </div>

    <div class="tabs">
      <button :class="['tab', { active: tab === 'ranking' }]" @click="tab = 'ranking'">랭킹</button>
      <button :class="['tab', { active: tab === 'board' }]" @click="tab = 'board'">공지 게시판</button>
      <button :class="['tab', { active: tab === 'members' }]" @click="tab = 'members'">멤버</button>
      <button :class="['tab', { active: tab === 'dashboard' }]" @click="onDashboardTab">대시보드</button>
    </div>

    <!-- 랭킹 탭 -->
    <div v-if="tab === 'ranking'" class="tab-panel">
      <div class="card">
        <h3>스터디 랭킹</h3>
        <div v-if="ranking.length === 0" class="empty">아직 성적 데이터가 없습니다</div>
        <div v-else class="ranking-list">
          <div v-for="(member, idx) in ranking" :key="member.userId" class="ranking-item">
            <span :class="['rank-num', { top3: idx < 3 }]">{{ idx + 1 }}</span>
            <div class="rank-avatar">{{ member.nickname?.charAt(0) }}</div>
            <div class="rank-info">
              <span class="rank-name">{{ member.nickname }}</span>
              <span class="rank-count">{{ member.examCount }}회 응시</span>
            </div>
            <div class="rank-score">
              <span class="best-score">{{ member.bestScore }}점</span>
              <span class="avg-score">평균 {{ member.avgScore }}점</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 게시판 탭 -->
    <div v-if="tab === 'board'" class="tab-panel">
      <div class="card">
        <div class="card-header-row">
          <h3>공지사항</h3>
          <button v-if="study?.myRole === 'LEADER'" class="btn-primary sm" @click="showNoticeModal = true">+ 작성</button>
        </div>
        <div v-if="notices.length === 0" class="empty">공지사항이 없습니다</div>
        <div v-else class="notice-list">
          <div v-for="n in notices" :key="n.id" class="notice-item">
            <div class="notice-top">
              <span class="notice-title">{{ n.title }}</span>
              <span class="notice-date">{{ formatDate(n.createdAt) }}</span>
            </div>
            <p class="notice-content">{{ n.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 멤버 탭 -->
    <div v-if="tab === 'members'" class="tab-panel">
      <div class="card">
        <h3>멤버 ({{ study?.memberCount || 0 }}명)</h3>
        <div class="member-list">
          <div v-for="m in study?.members || []" :key="m.userId" class="member-item">
            <div class="member-avatar">{{ m.nickname?.charAt(0) }}</div>
            <div class="member-info">
              <span class="member-name">{{ m.nickname }}</span>
              <span class="member-joined">{{ formatDate(m.joinedAt) }} 가입</span>
            </div>
            <span :class="['role-badge', m.role === 'LEADER' ? 'leader' : 'member']">
              {{ m.role === 'LEADER' ? '👑 리더' : '멤버' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 대시보드 탭 -->
    <div v-if="tab === 'dashboard'" class="tab-panel">
      <!-- 멤버별 응시 횟수 -->
      <div class="card">
        <h3>멤버별 응시 횟수</h3>
        <div v-if="!dashboard || dashboard.memberStats.length === 0" class="empty">데이터가 없습니다</div>
        <div v-else class="member-bars">
          <div v-for="m in dashboard.memberStats" :key="m.userId" class="member-bar-row">
            <span class="mb-name">{{ m.nickname }}</span>
            <div class="mb-bar-wrap">
              <div class="mb-bar" :style="{ width: barWidth(m.examCount) + '%' }"></div>
            </div>
            <span class="mb-count">{{ m.examCount }}회</span>
          </div>
        </div>
      </div>

      <!-- 동일 회차 시계열 그래프 -->
      <template v-if="dashboard && dashboard.timeSeries.length > 0">
        <div v-for="group in dashboard.timeSeries" :key="group.groupKey" class="card">
          <h3>{{ formatGroupKey(group.groupKey) }}</h3>
          <div class="chart-wrap">
            <ScoreLineChart :data="buildChartData(group)" />
          </div>
        </div>
      </template>
      <div v-else-if="dashboard && dashboard.timeSeries.length === 0" class="card">
        <div class="empty">아직 공통 응시 데이터가 없습니다</div>
      </div>
    </div>

    <!-- 공지 작성 모달 -->
    <div v-if="showNoticeModal" class="modal-overlay" @click.self="showNoticeModal = false">
      <div class="modal">
        <h3>공지 작성</h3>
        <div class="form-group">
          <label>제목</label>
          <input v-model="noticeForm.title" placeholder="공지 제목" />
        </div>
        <div class="form-group">
          <label>내용</label>
          <textarea v-model="noticeForm.content" placeholder="내용 입력..." rows="4"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showNoticeModal = false">취소</button>
          <button class="btn-primary" @click="submitNotice">등록</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/stores/study'
import apiClient from '@/api'
import ScoreLineChart from '@/components/dashboard/ScoreLineChart.vue'

const route = useRoute()
const router = useRouter()
const studyStore = useStudyStore()
const tab = ref('ranking')
const showNoticeModal = ref(false)
const notices = ref([])
const noticeForm = ref({ title: '', content: '' })

const joinLoading = ref(false)
const codeCopied = ref(false)

const study = computed(() => studyStore.currentStudy)
const ranking = computed(() => studyStore.ranking)
const dashboard = computed(() => studyStore.dashboard)

const CATEGORY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

onMounted(async () => {
  const id = route.params.id
  await Promise.all([
    studyStore.fetchStudy(id),
    studyStore.fetchRanking(id)
  ])
  try {
    const res = await apiClient.get(`/studies/${id}/notices`)
    notices.value = res.data.data || []
  } catch (_) {}
})

async function onDashboardTab() {
  tab.value = 'dashboard'
  if (!studyStore.dashboard) {
    await studyStore.fetchDashboard(route.params.id)
  }
}

function barWidth(count) {
  const max = Math.max(...(dashboard.value?.memberStats.map(m => m.examCount) || [1]))
  return max === 0 ? 0 : Math.round((count / max) * 100)
}

function formatGroupKey(key) {
  const parts = key.split('_')
  if (parts.length === 3) return `${parts[0]}년 ${parts[1]} (${parts[2]})`
  return key
}

function buildChartData(group) {
  const nicknames = [...new Set(group.points.map(p => p.nickname))]
  const allDates = [...new Set(group.points.map(p => p.date))]
  const datasets = nicknames.map((nick, i) => {
    const pts = group.points.filter(p => p.nickname === nick)
    const dateMap = Object.fromEntries(pts.map(p => [p.date, p.score]))
    return {
      label: nick,
      data: allDates.map(d => dateMap[d] ?? null),
      borderColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] + '20',
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      spanGaps: true
    }
  })
  return { labels: allDates, datasets }
}

async function handleJoinPublic() {
  joinLoading.value = true
  const result = await studyStore.joinPublicStudyById(route.params.id)
  joinLoading.value = false
  if (result.success) {
    await studyStore.fetchStudy(route.params.id)
  } else {
    alert(result.message)
  }
}

function copyCode() {
  navigator.clipboard.writeText(study.value.inviteCode)
  codeCopied.value = true
  setTimeout(() => { codeCopied.value = false }, 2000)
}

async function handleLeave() {
  if (!confirm('스터디에서 탈퇴하시겠습니까?')) return
  await studyStore.leaveStudy(route.params.id)
  router.push('/studies')
}

async function submitNotice() {
  try {
    const res = await apiClient.post(`/studies/${route.params.id}/notices`, noticeForm.value)
    notices.value.unshift(res.data.data)
    showNoticeModal.value = false
    noticeForm.value = { title: '', content: '' }
  } catch (_) {}
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ko-KR')
}
</script>

<style scoped>
.study-detail { max-width: 800px; display: flex; flex-direction: column; gap: 20px; }

.page-header { display: flex; align-items: flex-start; gap: 12px; }
.back-btn { font-size: 13px; color: var(--text-muted); padding-top: 4px; white-space: nowrap; }
.header-info { flex: 1; }
.header-info h2 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
.header-badges { display: flex; gap: 8px; align-items: center; }
.type-badge { font-size: 11px; background: #1f2937; color: #fff; padding: 2px 8px; border-radius: 4px; }
.code-badge {
  font-size: 12px;
  color: var(--text-muted);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.code-badge strong { color: var(--primary); letter-spacing: 2px; }
.copy-icon { font-size: 13px; color: var(--primary); }

.btn-danger { background: #fee2e2; color: #ef4444; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; white-space: nowrap; }

.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); }
.tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  background: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s;
}
.tab.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }

.tab-panel { display: flex; flex-direction: column; gap: 16px; }

.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.card h3 { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
.card-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-header-row h3 { margin-bottom: 0; }

.empty { padding: 30px; text-align: center; color: var(--text-light); font-size: 14px; }

.ranking-list { display: flex; flex-direction: column; gap: 8px; }
.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  background: var(--bg);
}
.rank-num { font-size: 15px; font-weight: 700; width: 24px; text-align: center; color: var(--text-muted); }
.rank-num.top3 { color: #d97706; }
.rank-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.rank-info { flex: 1; }
.rank-name { display: block; font-size: 14px; font-weight: 600; }
.rank-count { font-size: 12px; color: var(--text-muted); }
.rank-score { text-align: right; }
.best-score { display: block; font-size: 16px; font-weight: 700; }
.avg-score { font-size: 11px; color: var(--text-muted); }

.notice-list { display: flex; flex-direction: column; gap: 12px; }
.notice-item { padding: 12px; background: var(--bg); border-radius: 8px; }
.notice-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
.notice-title { font-size: 14px; font-weight: 600; }
.notice-date { font-size: 12px; color: var(--text-muted); }
.notice-content { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

.member-list { display: flex; flex-direction: column; gap: 8px; }
.member-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--bg); }
.member-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.member-info { flex: 1; }
.member-name { display: block; font-size: 14px; font-weight: 500; }
.member-joined { font-size: 12px; color: var(--text-muted); }
.role-badge { font-size: 12px; font-weight: 500; }
.role-badge.leader { color: #d97706; }
.role-badge.member { color: var(--text-muted); }

.btn-primary { background: var(--primary); color: #fff; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.btn-primary.sm { padding: 6px 12px; font-size: 12px; }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 500; }
.modal { background: #fff; border-radius: 16px; padding: 24px; width: 400px; }
.modal h3 { font-size: 17px; font-weight: 700; margin-bottom: 20px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 5px; }
.form-group input, .form-group textarea { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; outline: none; }
.modal-actions { display: flex; gap: 10px; margin-top: 16px; }
.modal-actions button { flex: 1; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 600; }

.member-bars { display: flex; flex-direction: column; gap: 12px; }
.member-bar-row { display: flex; align-items: center; gap: 10px; }
.mb-name { font-size: 13px; width: 80px; flex-shrink: 0; font-weight: 500; }
.mb-bar-wrap { flex: 1; height: 10px; background: var(--bg); border-radius: 5px; overflow: hidden; }
.mb-bar { height: 100%; border-radius: 5px; background: #4f46e5; transition: width 0.6s; }
.mb-count { font-size: 12px; font-weight: 600; width: 32px; text-align: right; color: var(--text-muted); }

.chart-wrap { min-height: 200px; display: flex; align-items: center; justify-content: center; }
</style>
