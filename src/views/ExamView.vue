<template>
  <div class="exam-view">
    <!-- 헤더 -->
    <header class="exam-header">
      <div class="header-left">
        <button class="btn-exit" @click="showExitDialog = true" title="나가기">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <span class="exam-title">{{ examName }}</span>
      </div>
      <div class="header-center">
        <ExamTimer
          :key="timerKey"
          :totalSeconds="totalSeconds"
          :running="timerRunning"
          @tick="onTick"
          @expired="onTimeExpired"
        />
      </div>
      <div class="header-right">
        <button v-if="!isStudyMode" class="btn-submit-exam" @click="showSubmitDialog = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>
          제출하기
        </button>
        <button v-else class="btn-submit-exam study" @click="handleStudyComplete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>
          완료
        </button>
      </div>
    </header>

    <!-- 타이머 경고 배너 -->
    <div v-if="timerWarning" class="timer-warning-banner">{{ timerWarning }}</div>

    <!-- 본문 3열 -->
    <div class="exam-body" :class="{ 'gsat-mode': examType === 'GSAT' }" ref="bodyRef">
      <!-- 좌: PDF 뷰어 -->
      <div v-show="!isNarrow" class="panel panel-pdf" :style="{ flex: panelWidths[0] }">
        <PdfViewer />
      </div>

      <!-- 드래그 핸들 1 -->
      <div v-show="!isNarrow" class="divider" @mousedown="startDrag(0, $event)" />

      <!-- 중: OMR 답안지 -->
      <div class="panel panel-omr" :style="{ flex: panelWidths[1] }">
        <OmrSheet
          :questionCount="questionCount"
          :answers="examStore.answers"
          :guesses="examStore.guesses"
          :wrongs="examStore.wrongs"
          :showUnansweredWarning="showSubmitDialog"
          @mark="handleMark"
          @clear="handleClear"
          @submit="showSubmitDialog = true"
          @save="handleSave"
          @toggleGuess="handleToggleGuess"
          @toggleWrong="handleToggleWrong"
          @reset="handleResetAll"
        />
      </div>

      <!-- 드래그 핸들 2 -->
      <div
        class="divider divider-right"
        :class="{ 'is-collapsed': !showToolPanel }"
        @mousedown="showToolPanel ? startDrag(1, $event) : null"
        @click="!showToolPanel ? openToolPanel() : null"
      >
        <button class="panel-toggle-btn" @click.stop="toggleToolPanel" title="패널 열기/닫기">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline v-if="showToolPanel" points="15,18 9,12 15,6"/>
            <polyline v-else points="9,18 15,12 9,6"/>
          </svg>
        </button>
      </div>

      <!-- 우: 도구 패널 (GSAT는 메모장만) -->
      <div v-show="showToolPanel" class="panel panel-tools" :style="{ flex: panelWidths[2] }">
        <GsatMemoPanel
          v-if="examType === 'GSAT'"
          :memoText="examStore.memoText"
          :totalSeconds="totalSeconds"
          :remaining="remainingSeconds"
          :timerRunning="timerRunning"
          @update-memo="examStore.memoText = $event"
          @update-time-limit="handleTimeLimitUpdate"
          @timer-start="handleTimerStart"
          @timer-stop="timerRunning = false"
          @timer-reset="handleTimerReset"
          @add-seconds="handleAddSeconds"
        />
        <ToolPanel
          v-else
          :sessionId="sessionId"
          :memoText="examStore.memoText"
          :totalSeconds="totalSeconds"
          :remaining="remainingSeconds"
          :timerRunning="timerRunning"
          @update-memo="examStore.memoText = $event"
          @update-time-limit="handleTimeLimitUpdate"
          @timer-start="handleTimerStart"
          @timer-stop="timerRunning = false"
          @timer-reset="handleTimerReset"
          @add-seconds="handleAddSeconds"
        />
      </div>
    </div>

    <!-- SKCT 채점 결과 입력 모달 -->
    <ScoreInputModal
      :visible="showScoreModal"
      :sessionId="sessionId"
      :answers="examStore.answers"
      :guesses="examStore.guesses"
      :wrongs="examStore.wrongs"
      :elapsedSeconds="timerElapsed"
      :retryResultId="retryResultId"
      @saved="onScoreSaved"
      @close="showScoreModal = false"
    />

    <!-- 나가기 다이얼로그 -->
    <div v-if="showExitDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>시험을 나가시겠습니까?</h3>
        <p>저장하고 나가면 현재까지의 답안이 저장됩니다.</p>
        <div class="dialog-actions">
          <button class="btn-primary" @click="exitWithSave" :disabled="submitting">
            {{ submitting ? '저장 중...' : '저장하고 나가기' }}
          </button>
          <button class="btn-danger" @click="exitWithoutSave">그냥 나가기</button>
          <button class="btn-secondary" @click="showExitDialog = false">계속 풀기</button>
        </div>
      </div>
    </div>

    <!-- 제출 확인 다이얼로그 -->
    <div v-if="showSubmitDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>시험 제출</h3>
        <p>응답한 문항: <strong>{{ answeredCount }}개</strong> / {{ questionCount }}개</p>
        <p v-if="unansweredCount > 0" class="warn-text">
          ⚠️ 미응답 문항이 {{ unansweredCount }}개 있습니다.
        </p>
        <p v-if="examType === 'GSAT'" class="gsat-penalty-hint">
          ⚠️ GSAT는 오답 감점제가 적용됩니다. 확실하지 않은 문항은 신중하게 선택하세요.
        </p>
        <p class="dialog-hint">제출 후에는 답안을 수정할 수 없습니다.</p>
        <textarea
          v-model="sessionNote"
          class="note-textarea"
          placeholder="이 시험에 대한 메모를 남겨보세요 (선택, 결과 페이지에서 수정 가능)"
          rows="3"
        ></textarea>
        <div class="dialog-actions">
          <button class="btn-primary" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '제출 중...' : '최종 제출' }}
          </button>
          <button class="btn-secondary" @click="showSubmitDialog = false">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const isNarrow = ref(window.innerWidth < 900)
function onResize() { isNarrow.value = window.innerWidth < 900 }
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '@/stores/exam'
import { useResultStore } from '@/stores/result'
import { useAuthStore } from '@/stores/auth'
import ExamTimer from '@/components/exam/ExamTimer.vue'
import PdfViewer from '@/components/exam/PdfViewer.vue'
import OmrSheet from '@/components/exam/OmrSheet.vue'
import ToolPanel from '@/components/exam/ToolPanel.vue'
import GsatMemoPanel from '@/components/exam/GsatMemoPanel.vue'
import ScoreInputModal from '@/components/exam/ScoreInputModal.vue'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()
const resultStore = useResultStore()
const authStore = useAuthStore()

const sessionId = route.params.sessionId
const examName = route.query.examName || 'SKCT 시험'
const examType = route.query.examType || ''
const retryResultId = route.query.retryResultId || null
const questionCount = parseInt(route.query.questionCount) || 40
const isStudyMode = computed(() => route.query.mode === 'study')
const isLocalSession = sessionId.startsWith('local-') || sessionId.startsWith('study-')

// localStorage 헬퍼
function saveLocalSessionData() {
  const data = {
    answers: { ...examStore.answers },
    guesses: { ...examStore.guesses },
    wrongs: { ...examStore.wrongs },
    memoText: examStore.memoText
  }
  localStorage.setItem(`skct_session_data_${sessionId}`, JSON.stringify(data))
}

// 서버 세션에서도 ?/x 마크를 localStorage에 별도 저장
function saveMarksLocally() {
  localStorage.setItem(`skct_marks_${sessionId}`, JSON.stringify({
    guesses: { ...examStore.guesses },
    wrongs: { ...examStore.wrongs }
  }))
}

function loadMarksLocally() {
  try {
    const data = JSON.parse(localStorage.getItem(`skct_marks_${sessionId}`) || 'null')
    if (!data) return
    if (data.guesses) Object.keys(data.guesses).forEach(k => examStore.setGuess(parseInt(k)))
    if (data.wrongs) Object.keys(data.wrongs).forEach(k => examStore.setWrong(parseInt(k)))
  } catch (_) {}
}

function saveSessionToLocalStorage() {
  const sessions = JSON.parse(localStorage.getItem('skct_sessions') || '[]')
  const idx = sessions.findIndex(s => s.sessionId === sessionId)
  const entry = {
    sessionId,
    examName,
    examType,
    questionCount,
    mode: isStudyMode.value ? 'study' : 'exam',
    savedAt: new Date().toISOString()
  }
  if (idx >= 0) sessions[idx] = entry
  else sessions.unshift(entry)
  localStorage.setItem('skct_sessions', JSON.stringify(sessions))
}

function removeSessionFromLocalStorage() {
  const sessions = JSON.parse(localStorage.getItem('skct_sessions') || '[]')
  localStorage.setItem('skct_sessions', JSON.stringify(sessions.filter(s => s.sessionId !== sessionId)))
  localStorage.removeItem(`skct_session_data_${sessionId}`)
  localStorage.removeItem(`skct_marks_${sessionId}`)
}
const totalSeconds = ref(0)
const remainingSeconds = ref(0)
const timerKey = ref(0)

const timerRunning = ref(false)
const timerEverStarted = ref(false)
const showSubmitDialog = ref(false)
const showExitDialog = ref(false)
const showScoreModal = ref(false)
const sessionNote = ref('')
const submitting = ref(false)
const panelWidths = ref(examType === 'GSAT' ? [5, 1.5, 1.5] : [5, 1.5, 1.5])
const showToolPanel = ref(true)
const bodyRef = ref(null)
let draggingIdx = -1
let startX = 0
let startWidths = []
let saveTimer = null

// 타이머 경고 상태
const timerWarning = ref('')

const timerElapsed = computed(() => {
  if (!timerEverStarted.value || !totalSeconds.value) return null
  return totalSeconds.value - remainingSeconds.value
})

function handleTimerStart() {
  timerRunning.value = true
  timerEverStarted.value = true
}

const answeredCount = computed(() => Object.keys(examStore.answers).length)
const unansweredCount = computed(() => questionCount - answeredCount.value)

onMounted(async () => {
  examStore.resetAll()
  if (!isLocalSession) {
    const loaded = await examStore.loadSession(sessionId)
    if (!loaded.success) {
      if (authStore.showModal) {
        authStore.setPendingAction(() => router.go(0))
      } else {
        alert('세션을 불러오지 못했습니다. 시험 목록으로 이동합니다.')
        router.push('/exam')
      }
      return
    }
  } else {
    // 1. localStorage 저장 답안 복원 (이어하기)
    const stored = localStorage.getItem(`skct_session_data_${sessionId}`)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.answers) Object.entries(data.answers).forEach(([k, v]) => examStore.setAnswer(parseInt(k), v))
        if (data.guesses) Object.keys(data.guesses).forEach(k => examStore.setGuess(parseInt(k)))
        if (data.wrongs) Object.keys(data.wrongs).forEach(k => examStore.setWrong(parseInt(k)))
        if (data.memoText) examStore.memoText = data.memoText
      } catch (_) {}
    }

    // 2. prevAnswers query param 복원 (다시 풀기) — localStorage 복원 이후 덮어씀
    if (route.query.prevAnswers) {
      try {
        const prev = JSON.parse(route.query.prevAnswers)
        Object.entries(prev).forEach(([k, v]) => examStore.setAnswer(parseInt(k), v))
      } catch (_) {}
    }
    // prevGuesses 복원
    if (route.query.prevGuesses) {
      try {
        JSON.parse(route.query.prevGuesses).forEach(no => examStore.setGuess(parseInt(no)))
      } catch (_) {}
    }
    // prevWrongs 복원
    if (route.query.prevWrongs) {
      try {
        JSON.parse(route.query.prevWrongs).forEach(no => examStore.setWrong(parseInt(no)))
      } catch (_) {}
    }

    saveSessionToLocalStorage()
  }

  // 30초마다 자동저장
  saveTimer = setInterval(() => {
    if (!isLocalSession) {
      examStore.saveAnswers(sessionId)
    } else {
      saveLocalSessionData()
    }
  }, 30000)

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  if (saveTimer) clearInterval(saveTimer)
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('resize', onResize)
})

function onTick(remaining) {
  remainingSeconds.value = remaining
}

function handleTimeLimitUpdate(minutes) {
  totalSeconds.value = minutes * 60
  remainingSeconds.value = minutes * 60
  timerRunning.value = false
  timerKey.value++
}

function handleAddSeconds(sec) {
  remainingSeconds.value = remainingSeconds.value + sec
  totalSeconds.value = totalSeconds.value + sec
}

function handleTimerReset() {
  timerRunning.value = false
  remainingSeconds.value = totalSeconds.value
  timerKey.value++
}


async function onTimeExpired() {
  timerRunning.value = false
  if (isStudyMode.value) {
    timerWarning.value = '⏱ 시간이 종료되었습니다. 계속 학습하거나 완료하세요.'
    setTimeout(() => { timerWarning.value = '' }, 10000)
  } else {
    timerWarning.value = '⏰ 시간이 종료되었습니다!'
    setTimeout(() => { timerWarning.value = '' }, 5000)
    await handleSubmit(true)
  }
}

function handleMark(questionNo, answer) {
  examStore.setAnswer(questionNo, answer)
  if (!isLocalSession) {
    examStore.saveAnswers(sessionId)
  } else {
    saveLocalSessionData()
  }
}

function handleClear(questionNo) {
  examStore.clearAnswer(questionNo)
  if (!isLocalSession) {
    examStore.saveAnswers(sessionId)
  } else {
    saveLocalSessionData()
  }
}

function handleResetAll() {
  examStore.resetAll()
  if (!isLocalSession) {
    examStore.saveAnswers(sessionId)
  } else {
    saveLocalSessionData()
  }
}

async function handleSubmit(auto = false) {
  if (submitting.value) return
  submitting.value = true
  showSubmitDialog.value = false
  timerRunning.value = false

  // SKCT는 로컬/서버 무관하게 항상 수동 채점 모달
  if (examType === 'SKCT') {
    showScoreModal.value = true
    submitting.value = false
    return
  }

  // 서버 세션 (비-SKCT): 자동채점
  if (!isLocalSession) {
    const result = await examStore.submitExam(sessionId)
    submitting.value = false
    if (result.success) {
      removeSessionFromLocalStorage()
      const trimmed = sessionNote.value.trim()
      if (trimmed) {
        localStorage.setItem(`result_note_session_${sessionId}`, trimmed)
        localStorage.setItem(`result_note_${result.data.id}`, trimmed)
      }
      router.push({ path: `/results/${result.data.id}`, query: { sessionId } })
      return
    }
    // 401로 인해 로그인 모달이 열린 경우 → 재로그인 후 제출 재시도
    if (authStore.showModal) {
      authStore.setPendingAction(() => handleSubmit())
    }
    return
  }

  // 로컬 세션 (비-SKCT): 답안 전달
  removeSessionFromLocalStorage()
  const trimmed = sessionNote.value.trim()
  if (trimmed) localStorage.setItem(`result_note_session_${sessionId}`, trimmed)
  router.push({
    name: 'ResultDetail',
    params: { id: 'local' },
    query: { answers: JSON.stringify(examStore.answers), questionCount, examName, sessionId }
  })
}

function onScoreSaved({ resultId, isDraft } = {}) {
  removeSessionFromLocalStorage()
  const trimmed = sessionNote.value.trim()

  if (typeof resultId === 'number') {
    if (trimmed) {
      localStorage.setItem(`result_note_session_${sessionId}`, trimmed)
      localStorage.setItem(`result_note_${resultId}`, trimmed)
    }
    if (isDraft) {
      router.push('/my/results')
    } else {
      router.push({ path: `/results/${resultId}`, query: { sessionId } })
    }
  } else {
    if (trimmed) localStorage.setItem(`result_note_session_${sessionId}`, trimmed)
    router.push({
      name: 'ResultDetail',
      params: { id: 'local' },
      query: { categoryScores: JSON.stringify(resultId), examName, sessionId }
    })
  }
}

async function exitWithoutSave() {
  if (!isLocalSession) {
    await examStore.deleteSession(sessionId)
  }
  removeSessionFromLocalStorage()
  router.push('/exam')
}

function buildDraftQuestions() {
  const allNos = new Set([
    ...Object.keys(examStore.answers).map(Number),
    ...Object.keys(examStore.guesses).filter(k => examStore.guesses[k]).map(Number),
    ...Object.keys(examStore.wrongs).filter(k => examStore.wrongs[k]).map(Number)
  ])
  return [...allNos].sort((a, b) => a - b).map(no => ({
    questionNo: no,
    selectedAnswer: examStore.answers[no] ?? null,
    isGuessed: !!examStore.guesses[no],
    isWrong: !!examStore.wrongs[no]
  }))
}

async function saveDraftToDb() {
  if (!authStore.isLoggedIn) return

  if (!retryResultId) {
    const count = await resultStore.fetchDraftCount()
    if (count >= 2) {
      alert('임시저장은 최대 2개까지 가능합니다.\n기존 임시저장을 삭제하거나 제출 후 다시 시도해주세요.')
      return
    }
  }

  const draftScores = Object.fromEntries(
    ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리'].map(c => [c, 0])
  )
  const meta = {
    examYear: null, examPeriod: null, platform: null, examRound: null,
    elapsedSeconds: timerElapsed.value,
    questions: buildDraftQuestions(),
    isDraft: true
  }
  if (retryResultId) {
    await resultStore.updateManualResult(retryResultId, draftScores, meta)
  } else {
    await resultStore.saveManualResult(isLocalSession ? null : sessionId, draftScores, meta)
  }
}

async function handleSave() {
  if (!isLocalSession) {
    await examStore.saveAnswers(sessionId)
  } else {
    saveLocalSessionData()
    saveSessionToLocalStorage()
  }
  router.push('/exam')
}

async function exitWithSave() {
  if (!isLocalSession) {
    await examStore.saveAnswers(sessionId)
  } else {
    saveLocalSessionData()
    saveSessionToLocalStorage()
  }
  if (examType === 'SKCT') {
    submitting.value = true
    showExitDialog.value = false
    await saveDraftToDb()
    submitting.value = false
    removeSessionFromLocalStorage()
    router.push('/my/results')
  } else {
    router.push('/exam')
  }
}

function handleToggleGuess(n) {
  if (examStore.guesses[n]) examStore.clearGuess(n)
  else examStore.setGuess(n)
  if (isLocalSession) saveLocalSessionData()
}

function handleToggleWrong(n) {
  if (examStore.wrongs[n]) examStore.clearWrong(n)
  else examStore.setWrong(n)
  if (isLocalSession) saveLocalSessionData()
}

function handleStudyComplete() {
  saveLocalSessionData()
  removeSessionFromLocalStorage()
  router.push('/exam')
}

// 패널 드래그
function startDrag(idx, e) {
  draggingIdx = idx
  startX = e.clientX
  startWidths = [...panelWidths.value]
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onDrag(e) {
  if (draggingIdx < 0 || !bodyRef.value) return
  const dx = e.clientX - startX
  const totalWidth = bodyRef.value.offsetWidth
  const pct = dx / totalWidth

  const newWidths = [...startWidths]
  newWidths[draggingIdx] = Math.max(0.5, startWidths[draggingIdx] + pct * 6)
  const newRight = startWidths[draggingIdx + 1] - pct * 6

  // 우측 패널 드래그 시: 임계값(0.3) 이하면 스냅해서 접기
  if (draggingIdx === 1 && newRight < 0.3) {
    showToolPanel.value = false
    stopDrag()
    return
  }

  newWidths[draggingIdx + 1] = Math.max(0.5, newRight)
  panelWidths.value = newWidths
}

function stopDrag() {
  draggingIdx = -1
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function toggleToolPanel() {
  if (showToolPanel.value) {
    showToolPanel.value = false
  } else {
    openToolPanel()
  }
}

function openToolPanel() {
  showToolPanel.value = true
}
</script>

<style scoped>
.exam-view {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f8f9fa;
}

.exam-header {
  height: 52px;
  background: #1f2937;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  gap: 16px;
}

.header-left { flex: 1; display: flex; align-items: center; gap: 8px; }
.exam-title { font-size: 14px; font-weight: 600; color: #fff; }

.btn-exit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  color: rgba(255,255,255,0.6);
  background: transparent;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.btn-exit:hover { background: rgba(255,255,255,0.1); color: #fff; }

.header-center { flex: 0 0 auto; }

.header-right { flex: 1; display: flex; justify-content: flex-end; }

.btn-submit-exam {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #4f46e5;
  color: #fff;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;
}
.btn-submit-exam:hover { background: #4338ca; }
.btn-submit-exam.study { background: #059669; }
.btn-submit-exam.study:hover { background: #047857; }

.timer-warning-banner {
  background: #fef3c7;
  color: #92400e;
  text-align: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  border-bottom: 1px solid #fde68a;
  animation: fadeInOut 0.3s ease;
}

@keyframes fadeInOut {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.exam-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.panel {
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
}

.panel-omr {
  display: flex;
}

.panel-omr > * {
  width: 100%;
  min-width: 0;
}


.divider {
  width: 5px;
  background: #e5e7eb;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
}
.divider:hover { background: #9ca3af; }

.divider-right {
  position: relative;
  width: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.divider-right.is-collapsed {
  width: 12px;
  background: #d1d5db;
  cursor: pointer;
}
.divider-right.is-collapsed:hover { background: #9ca3af; }

.panel-toggle-btn {
  position: absolute;
  width: 16px;
  height: 32px;
  background: #e5e7eb;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 1;
  cursor: pointer;
}
.divider-right:hover .panel-toggle-btn,
.divider-right.is-collapsed .panel-toggle-btn {
  opacity: 1;
}
.panel-toggle-btn:hover {
  background: #9ca3af;
  color: #fff;
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
.dialog h3 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.dialog p { font-size: 14px; color: var(--text-muted); margin-bottom: 8px; }
.dialog p strong { color: var(--text); }
.warn-text { color: var(--warning) !important; font-weight: 500; }
.gsat-penalty-hint { color: #b45309 !important; font-weight: 500; background: #fef3c7; padding: 6px 8px; border-radius: 6px; font-size: 12px; }
.dialog-hint { font-size: 12px; color: var(--text-light); }
.dialog-actions { display: flex; gap: 10px; margin-top: 20px; }
.dialog-actions button { flex: 1; padding: 11px; border-radius: 8px; font-size: 14px; font-weight: 600; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.note-textarea {
  width: 100%; border: 1px solid var(--border); border-radius: 8px;
  padding: 8px 10px; font-size: 13px; resize: none; font-family: inherit;
  margin-bottom: 12px; color: var(--text); box-sizing: border-box;
}
.note-textarea:focus { outline: none; border-color: var(--primary); }

@media (max-width: 900px) {
  .panel-tools { flex: 1; }
}
</style>
