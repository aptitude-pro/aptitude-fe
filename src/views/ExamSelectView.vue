<template>
  <div class="exam-select">
    <div class="section-header">
      <h2>시험 선택</h2>
      <p>로그인 없이도 시험을 볼 수 있습니다. 로그인하면 성적이 저장됩니다.</p>
    </div>

    <div class="exam-cards">
      <div
        v-for="exam in examTypes"
        :key="exam.id"
        :class="['exam-card', { available: exam.available, disabled: !exam.available }]"
      >
        <div class="exam-card-header">
          <div :class="['exam-icon', { active: exam.available }]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
          </div>
          <div>
            <div class="exam-name">
              {{ exam.name }}
              <span v-if="savedSessions.find(s => s.examType === exam.id)" class="badge-in-progress">진행 중</span>
            </div>
            <div class="exam-full-name">{{ exam.fullName }}</div>
          </div>
        </div>
        <p class="exam-desc">{{ exam.description }}</p>
        <div class="exam-meta">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            제한시간: {{ exam.timeLimit }}분
          </span>
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            문제 수: {{ exam.questionCount }}문제
          </span>
        </div>
        <button
          v-if="exam.available"
          class="btn-start"
          @click="startExam(exam)"
        >
          시험 시작하기
        </button>
        <button v-else class="btn-disabled" disabled>서비스 준비중</button>
      </div>
    </div>

    <!-- 진행 중인 시험 섹션 -->
    <section v-if="savedSessions.length" class="in-progress-section">
      <h3 class="in-progress-title">진행 중인 시험</h3>
      <div class="session-list">
        <div v-for="s in savedSessions" :key="s.sessionId" class="session-card">
          <div class="session-info">
            <span class="session-name">{{ s.examName }}</span>
            <span class="session-date">{{ formatDate(s.savedAt) }}</span>
          </div>
          <div class="session-actions">
            <button class="btn-resume" @click="doResumeSession(s)">이어하기</button>
            <button class="btn-delete" @click="deleteSession(s.sessionId)">삭제</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 시험 준비 팁 -->
    <div class="tips-section">
      <h3>시험 준비 팁</h3>
      <div class="tips-grid">
        <div class="tip-card" v-for="tip in tips" :key="tip.title">
          <div class="tip-icon">
            <component :is="'span'" v-html="tip.icon"></component>
          </div>
          <div class="tip-title">{{ tip.title }}</div>
          <div class="tip-desc">{{ tip.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 이어하기 다이얼로그 -->
    <div v-if="showResumeDialog" class="dialog-overlay" @click.self="showResumeDialog = false">
      <div class="dialog">
        <h3>진행 중인 세션이 있습니다</h3>
        <p>{{ resumeCandidate?.examName }} 세션이 저장되어 있습니다.</p>
        <p class="dialog-hint">저장 시각: {{ formatDate(resumeCandidate?.savedAt) }}</p>
        <div class="dialog-actions">
          <button class="btn-primary" @click="doResume">이어하기</button>
          <button class="btn-danger" @click="doFreshStart">새로 시작</button>
          <button class="btn-secondary" @click="showResumeDialog = false">취소</button>
        </div>
      </div>
    </div>

    <!-- 시험 시작 확인 다이얼로그 -->
    <div v-if="showStartDialog" class="dialog-overlay" @click.self="showStartDialog = false">
      <div class="dialog">
        <h3>{{ selectedExam?.name }} 시험 시작</h3>
        <p>문제 수: <strong>{{ selectedExam?.questionCount }}문제</strong></p>

        <p class="dialog-hint">시험 중 새로고침을 해도 답안이 자동저장됩니다.<br>시험 시간은 응시 화면 안에서 설정할 수 있습니다.</p>
        <div class="dialog-actions">
          <button class="btn-primary" @click="confirmStart" :disabled="starting">
            {{ starting ? '준비 중...' : '시험 시작' }}
          </button>
          <button class="btn-secondary" @click="showStartDialog = false">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api'

const router = useRouter()
const showStartDialog = ref(false)
const selectedExam = ref(null)
const starting = ref(false)
const savedSessions = ref([])
const showResumeDialog = ref(false)
const resumeCandidate = ref(null)

onMounted(() => {
  try {
    savedSessions.value = JSON.parse(localStorage.getItem('skct_sessions') || '[]')
      .filter(s => s.mode !== 'study')
  } catch (_) { savedSessions.value = [] }
})

const examTypes = [
  {
    id: 'SKCT',
    name: 'SKCT',
    fullName: 'SK그룹 종합역량검사',
    description: '언어이해, 수리논리, 추리, 시공간 영역 평가',
    timeLimit: 75,
    questionCount: 100,
    available: true
  },
  {
    id: 'GSAT',
    name: 'GSAT',
    fullName: '삼성직무적성검사',
    description: '수리논리 20문항(30분) + 추리 30문항(30분), 오답 감점제 적용',
    timeLimit: 60,
    questionCount: 50,
    available: true
  },
  {
    id: 'NCS',
    name: 'NCS',
    fullName: '국가직무능력표준',
    description: '의사소통, 수리능력, 문제해결, 정보능력 영역 평가',
    timeLimit: 50,
    questionCount: 50,
    available: false
  }
]

const tips = [
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
    title: '시간 관리',
    desc: '각 문제당 1~2분 내외로 풀이하는 연습이 중요합니다.'
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    title: '약점 파악',
    desc: '로그인 후 성적 분석으로 취약 영역을 집중 학습하세요.'
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    title: '반복 학습',
    desc: '주 3회 이상 꾸준히 풀면 점수 향상 효과가 큽니다.'
  }
]

function startExam(exam) {
  selectedExam.value = exam
  const existing = savedSessions.value.find(s => s.examType === exam.id)
  if (existing) {
    resumeCandidate.value = existing
    showResumeDialog.value = true
  } else {
    showStartDialog.value = true
  }
}

async function confirmStart() {
  starting.value = true
  try {
    // 로그인 여부 관계없이 로컬 세션으로 시험 시작
    const sessionId = `local-${Date.now()}`
    router.push({
      name: 'ExamSession',
      params: { sessionId },
      query: {
        examType: selectedExam.value.id,
        questionCount: selectedExam.value.questionCount,
        examName: selectedExam.value.name
      }
    })
  } catch (err) {
    console.error(err)
  } finally {
    starting.value = false
    showStartDialog.value = false
  }
}

function doResume() {
  showResumeDialog.value = false
  router.push({
    name: 'ExamSession',
    params: { sessionId: resumeCandidate.value.sessionId },
    query: { examType: resumeCandidate.value.examType, questionCount: resumeCandidate.value.questionCount, examName: resumeCandidate.value.examName }
  })
}

function doFreshStart() {
  const sid = resumeCandidate.value.sessionId
  localStorage.removeItem(`skct_session_data_${sid}`)
  localStorage.removeItem(`skct_marks_${sid}`)
  const sessions = JSON.parse(localStorage.getItem('skct_sessions') || '[]').filter(s => s.sessionId !== sid)
  localStorage.setItem('skct_sessions', JSON.stringify(sessions))
  savedSessions.value = sessions.filter(s => s.mode !== 'study')
  showResumeDialog.value = false
  showStartDialog.value = true
}

function doResumeSession(s) {
  router.push({
    name: 'ExamSession',
    params: { sessionId: s.sessionId },
    query: { examType: s.examType, questionCount: s.questionCount, examName: s.examName }
  })
}

function deleteSession(sid) {
  localStorage.removeItem(`skct_session_data_${sid}`)
  localStorage.removeItem(`skct_marks_${sid}`)
  const sessions = JSON.parse(localStorage.getItem('skct_sessions') || '[]').filter(s => s.sessionId !== sid)
  localStorage.setItem('skct_sessions', JSON.stringify(sessions))
  savedSessions.value = sessions.filter(s => s.mode !== 'study')
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.exam-select {
  max-width: 1100px;
}

.section-header {
  margin-bottom: 24px;
}
.section-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}
.section-header p {
  color: var(--text-muted);
  font-size: 14px;
}

.exam-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.exam-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s;
}

.exam-card.available {
  border-color: #d1d5db;
  box-shadow: var(--shadow-md);
}
.exam-card.available:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}
.exam-card.disabled {
  opacity: 0.55;
}

.exam-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.exam-icon:not(.active) {
  background: #9ca3af;
}

.exam-name {
  font-size: 16px;
  font-weight: 700;
}
.exam-full-name {
  font-size: 12px;
  color: var(--text-muted);
}

.exam-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}

.exam-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.exam-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.btn-start {
  background: var(--primary);
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
  transition: background 0.15s;
  width: 100%;
}
.btn-start:hover { background: var(--primary-hover); }

.btn-disabled {
  background: var(--bg);
  color: var(--text-light);
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
  cursor: not-allowed;
  border: 1px solid var(--border);
}

.tips-section h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}
.tips-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.tip-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tip-icon {
  width: 40px;
  height: 40px;
  background: #1f2937;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.tip-title {
  font-size: 14px;
  font-weight: 600;
}
.tip-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.dialog {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.dialog h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}
.dialog p {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.dialog p strong { color: var(--text); }
.dialog-hint {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 8px;
  margin-bottom: 0;
}
.dialog-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.dialog-actions button {
  flex: 1;
  padding: 11px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.badge-in-progress {
  font-size: 11px; font-weight: 600; color: #fff;
  background: #f59e0b; border-radius: 4px; padding: 2px 6px; margin-left: 6px;
  vertical-align: middle;
}
.in-progress-section { margin-bottom: 32px; }
.in-progress-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
.session-list { display: flex; flex-direction: column; gap: 8px; }
.session-card {
  background: #fff; border: 1px solid var(--border); border-radius: var(--radius);
  padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;
}
.session-info { display: flex; flex-direction: column; gap: 2px; }
.session-name { font-size: 14px; font-weight: 600; }
.session-date { font-size: 12px; color: var(--text-muted); }
.session-actions { display: flex; gap: 8px; }
.btn-resume { background: var(--primary); color: #fff; padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; }
.btn-delete { background: #fff; color: #ef4444; border: 1px solid #fca5a5; padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; }

@media (max-width: 768px) {
  .exam-cards, .tips-grid {
    grid-template-columns: 1fr;
  }
}
</style>
