<template>
  <div class="tool-panel">
    <!-- 타이머 / 스톱워치 -->
    <div class="mini-timer-section">
      <div class="timer-mode-tabs">
        <button :class="['mode-tab', { active: timerMode === 'timer' }]" @click="timerMode = 'timer'">타이머</button>
        <button :class="['mode-tab', { active: timerMode === 'stopwatch' }]" @click="timerMode = 'stopwatch'">스톱워치</button>
      </div>

      <!-- 타이머 (기존) -->
      <div v-if="timerMode === 'timer'" class="mini-timer-body">
        <div class="mini-timer-top">
          <select v-model="localMinutes" class="time-select" @change="onTimeSelect">
            <option v-for="m in timeOptions" :key="m" :value="m">{{ m }}분</option>
          </select>
          <button class="timer-help" title="도움말">?</button>
        </div>
        <div class="mini-time-display" :class="{ warn: timerWarn, danger: timerDanger }">
          {{ formattedLocalTime }}
        </div>
        <div class="mini-timer-btns">
          <button
            :class="['timer-btn', timerRunning ? 'stop' : 'start']"
            @click="toggleTimer"
          >
            {{ timerRunning ? '정지' : '시작' }}
          </button>
          <button class="timer-btn reset" @click="resetTimer">리셋</button>
        </div>
      </div>

      <!-- 스톱워치 (신규) -->
      <div v-else class="mini-timer-body">
        <div class="mini-time-display">{{ swDisplayTime }}</div>
        <div class="mini-timer-btns">
          <button v-if="!swRunning && !swStarted" class="timer-btn start" @click="swStart">시작</button>
          <button v-if="swRunning" class="timer-btn stop" @click="swPause">정지</button>
          <button v-if="!swRunning && swStarted" class="timer-btn start" @click="swStart">재개</button>
          <button v-if="swRunning || swStarted" class="timer-btn lap" @click="swLap">랩</button>
          <button class="timer-btn reset" @click="swReset">리셋</button>
        </div>
        <div v-if="laps.length" class="sw-lap-list">
          <div v-for="(lapSec, i) in laps" :key="i" class="sw-lap-item">
            <span class="sw-lap-no">Lap {{ i + 1 }}</span>
            <span class="sw-lap-split">{{ formatSw(lapSec - (i > 0 ? laps[i-1] : 0)) }}</span>
            <span class="sw-lap-total">{{ formatSw(lapSec) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 메모장 / 그림판 탭 -->
    <div class="tool-tabs">
      <button :class="['tool-tab', { active: activeTab === 'memo' }]" @click="activeTab = 'memo'">메모장</button>
      <button :class="['tool-tab', { active: activeTab === 'draw' }]" @click="activeTab = 'draw'">그림판</button>
    </div>

    <div class="tab-content">
      <!-- 메모장 -->
      <div v-show="activeTab === 'memo'" class="memo-area">
        <div class="memo-toolbar">
          <button class="memo-action" @click="clearMemo">전체 지우기</button>
        </div>
        <textarea
          class="memo-input"
          placeholder="메모를 입력하세요..."
          :value="props.memoText"
          @input="$emit('update-memo', $event.target.value)"
        ></textarea>
      </div>

      <!-- 그림판 -->
      <div v-show="activeTab === 'draw'" class="draw-area">
        <DrawingBoard ref="drawRef" />
      </div>
    </div>

    <!-- 계산기 -->
    <div class="calc-section">
      <div class="calc-label">계산기</div>
      <Calculator />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import DrawingBoard from './DrawingBoard.vue'
import Calculator from './Calculator.vue'

const props = defineProps({
  sessionId: String,
  memoText: String,
  totalSeconds: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  timerRunning: { type: Boolean, default: false }
})
const emit = defineEmits(['update-memo', 'update-time-limit', 'timer-start', 'timer-stop', 'timer-reset'])

const activeTab = ref('memo')
const drawRef = ref(null)

// 15분 단위 시간 선택
const timeOptions = [0, 15, 30, 45, 60, 75, 90, 105, 120, 150, 180]
const localMinutes = ref(75)

// 타이머 표시: 시작 후엔 remaining prop, 그 전엔 선택된 시간
const displaySeconds = computed(() => {
  if (props.remaining > 0 || props.timerRunning) return props.remaining
  return props.totalSeconds || localMinutes.value * 60
})

const timerWarn = computed(() => displaySeconds.value <= 300 && displaySeconds.value > 60)
const timerDanger = computed(() => displaySeconds.value <= 60)

const formattedLocalTime = computed(() => {
  const secs = displaySeconds.value
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}분 ${String(s).padStart(2, '0')}초`
})

function onTimeSelect() {
  emit('update-time-limit', localMinutes.value)
}

function toggleTimer() {
  if (props.timerRunning) {
    emit('timer-stop')
  } else {
    emit('timer-start')
  }
}

function resetTimer() {
  emit('timer-reset')
}

function clearMemo() {
  emit('update-memo', '')
}

watch(activeTab, async (tab) => {
  if (tab === 'draw') {
    await nextTick()
    requestAnimationFrame(() => {
      drawRef.value?.resize()
    })
  }
})

// 스톱워치
const timerMode = ref('timer')
const swElapsed = ref(0)
const swRunning = ref(false)
const swStarted = ref(false)
const laps = ref([])
let swTimer = null

function formatSw(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const swDisplayTime = computed(() => formatSw(swElapsed.value))

function swStart() {
  swRunning.value = true
  swStarted.value = true
  swTimer = setInterval(() => { swElapsed.value++ }, 1000)
}

function swPause() {
  swRunning.value = false
  clearInterval(swTimer)
  swTimer = null
}

function swLap() {
  laps.value.push(swElapsed.value)
}

function swReset() {
  swRunning.value = false
  swStarted.value = false
  clearInterval(swTimer)
  swTimer = null
  swElapsed.value = 0
  laps.value = []
}

onMounted(() => {
  emit('update-time-limit', localMinutes.value)
})

onUnmounted(() => {
  clearInterval(swTimer)
})
</script>

<style scoped>
.tool-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  overflow-y: auto;
}

.mini-timer-section {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.timer-mode-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}
.mode-tab {
  flex: 1;
  padding: 4px 0;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.15s;
}
.mode-tab.active {
  background: #1f2937;
  color: #fff;
  border-color: #1f2937;
}

.mini-timer-body {}

.timer-btn.lap { background: #6366f1; color: #fff; }

.sw-lap-list {
  margin-top: 8px;
  max-height: 120px;
  overflow-y: auto;
  border-top: 1px solid #f3f4f6;
}
.sw-lap-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 11px;
  color: #6b7280;
  border-bottom: 1px solid #f9fafb;
}
.sw-lap-no { color: #374151; font-weight: 600; }
.sw-lap-split { color: #4f46e5; }
.sw-lap-total { color: #9ca3af; }

.mini-timer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.time-select {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  background: #f9fafb;
  outline: none;
}

.timer-help {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-time-display {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin: 6px 0;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
}
.mini-time-display.warn { color: #f59e0b; }
.mini-time-display.danger { color: #ef4444; }

.mini-timer-btns {
  display: flex;
  gap: 8px;
}

.timer-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
}
.timer-btn.start { background: #10b981; color: #fff; }
.timer-btn.stop { background: #ef4444; color: #fff; }
.timer-btn.reset { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }

.tool-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.tool-tab {
  flex: 1;
  padding: 9px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tool-tab.active {
  color: #1f2937;
  font-weight: 600;
  border-bottom-color: #1f2937;
  background: #fff;
}

.tab-content {
  flex: 1;
  min-height: 160px;
}

.memo-area, .draw-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.memo-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 6px 10px;
  border-bottom: 1px solid #f3f4f6;
}
.memo-action {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 3px 8px;
  border-radius: 4px;
}
.memo-action:hover { background: #e5e7eb; }

.memo-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  color: #374151;
  background: #fff;
  min-height: 150px;
}
.memo-input::placeholder { color: #9ca3af; }

.draw-area { padding: 0; }

.calc-section {
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.calc-label {
  font-size: 13px;
  font-weight: 600;
  padding: 10px 14px 6px;
  border-bottom: 1px solid #f3f4f6;
}
</style>
