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
        <button class="btn-submit-exam" @click="showSubmitDialog = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>
          제출하기
        </button>
      </div>
    </header>

    <!-- 본문 3열 -->
    <div class="exam-body" ref="bodyRef">
      <!-- 좌: PDF 뷰어 -->
      <div class="panel panel-pdf" :style="{ flex: panelWidths[0] }">
        <PdfViewer />
      </div>

      <!-- 드래그 핸들 1 -->
      <div class="divider" @mousedown="startDrag(0)" />

      <!-- 중: OMR 답안지 -->
      <div class="panel panel-omr" :style="{ flex: panelWidths[1] }">
        <OmrSheet
          :questionCount="questionCount"
          :answers="examStore.answers"
          @mark="handleMark"
          @clear="handleClear"
          @submit="showSubmitDialog = true"
        />
      </div>

      <!-- 드래그 핸들 2 -->
      <div class="divider" @mousedown="startDrag(1)" />

      <!-- 우: 도구 패널 -->
      <div class="panel panel-tools" :style="{ flex: panelWidths[2] }">
        <ToolPanel
          :sessionId="sessionId"
          :memoText="examStore.memoText"
          :totalSeconds="totalSeconds"
          :remaining="remainingSeconds"
          :timerRunning="timerRunning"
          @update-memo="examStore.memoText = $event"
          @update-time-limit="handleTimeLimitUpdate"
          @timer-start="timerRunning = true"
          @timer-stop="timerRunning = false"
          @timer-reset="handleTimerReset"
        />
      </div>
    </div>

    <!-- SKCT 채점 결과 입력 모달 -->
    <ScoreInputModal
      :visible="showScoreModal"
      :sessionId="sessionId"
      @saved="onScoreSaved"
      @close="showScoreModal = false"
    />

    <!-- 나가기 다이얼로그 -->
    <div v-if="showExitDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>시험을 나가시겠습니까?</h3>
        <p>저장하고 나가면 현재까지의 답안과 점수가 저장됩니다.</p>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showExitDialog = false">계속 풀기</button>
          <button class="btn-danger" @click="exitWithoutSave">그냥 나가기</button>
          <button class="btn-primary" @click="exitWithSave" :disabled="submitting">
            {{ submitting ? '저장 중...' : '저장하고 나가기' }}
          </button>
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
        <p class="dialog-hint">제출 후에는 답안을 수정할 수 없습니다.</p>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showSubmitDialog = false">취소</button>
          <button class="btn-primary" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '제출 중...' : '최종 제출' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '@/stores/exam'
import ExamTimer from '@/components/exam/ExamTimer.vue'
import PdfViewer from '@/components/exam/PdfViewer.vue'
import OmrSheet from '@/components/exam/OmrSheet.vue'
import ToolPanel from '@/components/exam/ToolPanel.vue'
import ScoreInputModal from '@/components/exam/ScoreInputModal.vue'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()

const sessionId = route.params.sessionId
const examName = route.query.examName || 'SKCT 시험'
const examType = route.query.examType || ''
const questionCount = parseInt(route.query.questionCount) || 40
const totalSeconds = ref(0)
const remainingSeconds = ref(0)
const timerKey = ref(0)

const timerRunning = ref(false)
const showSubmitDialog = ref(false)
const showExitDialog = ref(false)
const showScoreModal = ref(false)
const submitting = ref(false)
const panelWidths = ref([3.5, 1, 1.5])
const bodyRef = ref(null)
let draggingIdx = -1
let startX = 0
let startWidths = []
let saveTimer = null

const answeredCount = computed(() => Object.keys(examStore.answers).length)
const unansweredCount = computed(() => questionCount - answeredCount.value)

onMounted(async () => {
  examStore.resetAll()
  if (!sessionId.startsWith('local-')) {
    await examStore.loadSession(sessionId)
  }

  // 30초마다 자동저장
  saveTimer = setInterval(() => {
    if (!sessionId.startsWith('local-')) {
      examStore.saveAnswers(sessionId)
    }
  }, 30000)

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
})

onUnmounted(() => {
  if (saveTimer) clearInterval(saveTimer)
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
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

function handleTimerReset() {
  timerRunning.value = false
  remainingSeconds.value = totalSeconds.value
  timerKey.value++
}

async function onTimeExpired() {
  timerRunning.value = false
  await handleSubmit(true)
}

function handleMark(questionNo, answer) {
  examStore.setAnswer(questionNo, answer)
  if (!sessionId.startsWith('local-')) {
    examStore.saveAnswers(sessionId)
  }
}

function handleClear(questionNo) {
  examStore.clearAnswer(questionNo)
}

async function handleSubmit(auto = false) {
  if (submitting.value) return
  showSubmitDialog.value = false
  timerRunning.value = false

  // SKCT는 로컬/서버 무관하게 항상 수동 채점 모달
  if (examType === 'SKCT') {
    showScoreModal.value = true
    return
  }

  // 서버 세션 (비-SKCT): 자동채점
  if (!sessionId.startsWith('local-')) {
    submitting.value = true
    const result = await examStore.submitExam(sessionId)
    submitting.value = false
    if (result.success) {
      router.push(`/results/${result.data.id}`)
      return
    }
  }

  // 로컬 세션 (비-SKCT): 답안 전달
  router.push({
    name: 'ResultDetail',
    params: { id: 'local' },
    query: { answers: JSON.stringify(examStore.answers), questionCount, examName }
  })
}

function onScoreSaved(resultIdOrScores) {
  if (typeof resultIdOrScores === 'number') {
    router.push(`/results/${resultIdOrScores}`)
  } else {
    router.push({
      name: 'ResultDetail',
      params: { id: 'local' },
      query: { categoryScores: JSON.stringify(resultIdOrScores), examName }
    })
  }
}

function exitWithoutSave() {
  router.push('/exam')
}

async function exitWithSave() {
  await handleSubmit()
  showExitDialog.value = false
}

// 패널 드래그
function startDrag(idx) {
  draggingIdx = idx
  startX = event.clientX
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
  newWidths[draggingIdx + 1] = Math.max(0.5, startWidths[draggingIdx + 1] - pct * 6)
  panelWidths.value = newWidths
}

function stopDrag() {
  draggingIdx = -1
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
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

.divider {
  width: 5px;
  background: #e5e7eb;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
}
.divider:hover { background: #9ca3af; }

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
.dialog-hint { font-size: 12px; color: var(--text-light); }
.dialog-actions { display: flex; gap: 10px; margin-top: 20px; }
.dialog-actions button { flex: 1; padding: 11px; border-radius: 8px; font-size: 14px; font-weight: 600; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
</style>
