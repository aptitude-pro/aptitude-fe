<template>
  <div class="timer-layout">
    <!-- 좌: 타이머 패널 -->
    <div class="panel timer-panel">
      <div class="panel-header">
        <button :class="['tab-btn', { active: mode === 'timer' }]" @click="mode = 'timer'">타이머</button>
        <button :class="['tab-btn', { active: mode === 'stopwatch' }]" @click="mode = 'stopwatch'">스톱워치</button>
      </div>
      <div v-if="mode === 'timer'" class="panel-body">
        <!-- 남은 시간 표시 -->
        <div :class="['timer-display', { warning: isWarning, finished: isFinished }]">
          {{ displayTime }}
        </div>

        <!-- 상태 메시지 -->
        <div v-if="isFinished" class="finish-msg">시간 종료!</div>
        <div v-else-if="isWarning && running" class="warn-msg">5분 이하 남았습니다</div>

        <!-- 프리셋 버튼 -->
        <div class="presets">
          <button
            v-for="p in PRESETS"
            :key="p"
            :class="['preset-btn', { active: selectedMinutes === p && !customMinutes }]"
            @click="applyPreset(p)"
            :disabled="running"
          >{{ p }}분</button>
        </div>

        <!-- ±1분 미세조정 -->
        <div class="adjust-row">
          <button class="btn-adjust" @click="adjustMinutes(-1)" :disabled="running || totalSeconds <= 60">-1분</button>
          <span class="adjust-display">{{ Math.floor(totalSeconds / 60) }}분 설정</span>
          <button class="btn-adjust" @click="adjustMinutes(1)" :disabled="running">+1분</button>
        </div>

        <!-- 직접 입력 -->
        <div class="custom-row">
          <input
            type="number"
            min="1"
            max="300"
            v-model.number="customInput"
            placeholder="분 직접 입력"
            class="custom-input"
            :disabled="running"
            @change="applyCustom"
          />
          <span class="unit">분</span>
          <button class="btn-apply" @click="applyCustom" :disabled="running">적용</button>
        </div>

        <!-- 컨트롤 버튼 -->
        <div class="controls">
          <button
            v-if="!running && !isFinished"
            class="btn-start"
            @click="start"
            :disabled="totalSeconds === 0"
          >시작</button>
          <button
            v-if="running"
            class="btn-pause"
            @click="pause"
          >일시정지</button>
          <button
            v-if="!running && started && !isFinished"
            class="btn-resume"
            @click="start"
          >재개</button>
          <button class="btn-reset" @click="reset">초기화</button>
        </div>

        <!-- 진행률 바 -->
        <div class="progress-wrap">
          <div class="progress-bar" :style="{ width: progressRate + '%', background: isWarning ? '#ef4444' : '#4f46e5' }"></div>
        </div>
      </div>

      <!-- 스톱워치 -->
      <div v-else class="panel-body">
        <div class="timer-display">{{ swDisplayTime }}</div>

        <div class="controls">
          <button v-if="!swRunning && !swStarted" class="btn-start" @click="swStart">시작</button>
          <button v-if="swRunning" class="btn-pause" @click="swPause">일시정지</button>
          <button v-if="!swRunning && swStarted" class="btn-resume" @click="swStart">재개</button>
          <button v-if="swRunning || swStarted" class="btn-lap" @click="swLap">랩</button>
          <button class="btn-reset" @click="swReset">초기화</button>
        </div>

        <div v-if="laps.length" class="lap-list">
          <div v-for="(lapSec, i) in laps" :key="i" class="lap-item">
            <span class="lap-no">Lap {{ i + 1 }}</span>
            <span class="lap-split">+{{ formatSw(lapSec - (i > 0 ? laps[i - 1] : 0)) }}</span>
            <span class="lap-total">{{ formatSw(lapSec) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 중: 메모 패널 -->
    <div class="panel memo-panel">
      <div class="panel-header">
        <button :class="['tab-btn', { active: memoTab === 'memo' }]" @click="memoTab = 'memo'">메모</button>
        <button :class="['tab-btn', { active: memoTab === 'draw' }]" @click="memoTab = 'draw'">그림판</button>
      </div>
      <div class="panel-body panel-body--fill">
        <textarea v-if="memoTab === 'memo'" v-model="memoText" class="memo-textarea" placeholder="메모를 입력하세요..." />
        <DrawingBoard v-else />
      </div>
      <!-- 계산기 (하단 고정) -->
      <div class="panel-calc-section">
        <Calculator />
      </div>
    </div>

    <!-- 우: 메모장 패널 -->
    <div class="panel right-panel">
      <div class="panel-header panel-header--text">메모장</div>
      <div class="panel-body panel-body--memo">
        <textarea v-model="calcMemoText" class="memo-textarea" placeholder="메모를 입력하세요..." />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import DrawingBoard from '@/components/exam/DrawingBoard.vue'
import Calculator from '@/components/exam/Calculator.vue'

const PRESETS = [0, 15, 30, 45, 60, 75, 90]

// 모드 전환 (타이머 / 스톱워치)
const mode = ref('timer')

const memoTab = ref('memo')
const memoText = ref('')
const calcMemoText = ref('')

const totalSeconds = ref(0)
const remaining = ref(0)
const running = ref(false)
const started = ref(false)
const isFinished = ref(false)
const selectedMinutes = ref(null)
const customMinutes = ref(false)
const customInput = ref(null)

let timer = null

const displayTime = computed(() => {
  const s = remaining.value
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

const isWarning = computed(() => remaining.value > 0 && remaining.value <= 300)
const progressRate = computed(() => {
  if (totalSeconds.value === 0) return 0
  return ((totalSeconds.value - remaining.value) / totalSeconds.value) * 100
})

function applyPreset(minutes) {
  if (running.value) return
  selectedMinutes.value = minutes
  customMinutes.value = false
  customInput.value = null
  totalSeconds.value = minutes * 60
  remaining.value = minutes * 60
  started.value = false
  isFinished.value = false
  clearTimer()
}

function applyCustom() {
  if (running.value) return
  const m = parseInt(customInput.value)
  if (!m || m < 1) return
  selectedMinutes.value = null
  customMinutes.value = true
  totalSeconds.value = m * 60
  remaining.value = m * 60
  started.value = false
  isFinished.value = false
  clearTimer()
}

function adjustMinutes(delta) {
  if (running.value) return
  const newSeconds = Math.max(60, totalSeconds.value + delta * 60)
  totalSeconds.value = newSeconds
  remaining.value = newSeconds
  started.value = false
  isFinished.value = false
  customMinutes.value = true
  selectedMinutes.value = null
}

function start() {
  if (remaining.value <= 0 || running.value) return
  running.value = true
  started.value = true
  timer = setInterval(() => {
    if (remaining.value <= 1) {
      remaining.value = 0
      running.value = false
      isFinished.value = true
      clearTimer()
      playBeep()
    } else {
      remaining.value--
    }
  }, 1000)
}

function pause() {
  running.value = false
  clearTimer()
}

function reset() {
  clearTimer()
  running.value = false
  started.value = false
  isFinished.value = false
  remaining.value = totalSeconds.value
}

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.4)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.3)
      osc.start(ctx.currentTime + i * 0.4)
      osc.stop(ctx.currentTime + i * 0.4 + 0.3)
    }
  } catch (_) {}
}

onUnmounted(() => {
  clearTimer()
  clearInterval(swTimer)
})

// 스톱워치
const swElapsed = ref(0)
const swRunning = ref(false)
const swStarted = ref(false)
const laps = ref([])
let swTimer = null

function padTwo(n) { return String(n).padStart(2, '0') }
function formatSw(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${padTwo(h)}:${padTwo(m)}:${padTwo(sec)}`
  return `${padTwo(m)}:${padTwo(sec)}`
}

const swDisplayTime = computed(() => formatSw(swElapsed.value))

function swStart() {
  if (swRunning.value) return
  swRunning.value = true
  swStarted.value = true
  swTimer = setInterval(() => { swElapsed.value++ }, 1000)
}
function swPause() { swRunning.value = false; clearInterval(swTimer); swTimer = null }
function swLap() { if (swStarted.value) laps.value.push(swElapsed.value) }
function swReset() {
  swRunning.value = false
  swStarted.value = false
  swElapsed.value = 0
  laps.value = []
  clearInterval(swTimer)
  swTimer = null
}
</script>

<style scoped>
.timer-layout {
  display: grid;
  grid-template-columns: 340px 1fr 400px;
  height: calc(100vh - 58px);
  margin: -28px -32px;
  overflow: hidden;
}

@media (max-width: 1100px) {
  .timer-layout {
    grid-template-columns: 340px 1fr;
  }
  .right-panel {
    display: none;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: #fff;
  overflow: hidden;
}
.panel:last-child { border-right: none; }

.panel-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
}
.timer-panel .panel-header {
  padding: 12px 20px;
}
.right-panel > .panel-header {
  padding: 12px 20px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.panel-body--fill {
  padding: 0;
  align-items: stretch;
}

/* 탭 버튼 */
.panel-header {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  align-items: center;
}
.tab-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover { background: #e5e7eb; }
.tab-btn.active { background: #1f2937; color: #fff; }

/* 텍스트 메모 */
.memo-textarea {
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  outline: none;
  padding: 12px;
  font-size: 16px;
  line-height: 1.7;
  font-family: inherit;
  background: #fff;
}

/* 메모장 영역 */
.panel-body--memo {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 계산기 (중간 패널 하단 고정) */
.panel-calc-section {
  flex-shrink: 0;
  border-top: 1px solid var(--border, #e5e7eb);
  padding: 12px;
  background: var(--bg, #f9fafb);
}

/* 타이머 컨트롤 */
.timer-display {
  font-size: 60px;
  font-weight: 800;
  letter-spacing: 4px;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
  text-align: center;
}
.timer-display.warning { color: #ef4444; }
.timer-display.finished { color: #ef4444; animation: pulse 0.6s infinite alternate; }

@keyframes pulse {
  from { opacity: 1; }
  to { opacity: 0.5; }
}

.finish-msg { font-size: 18px; font-weight: 700; color: #ef4444; margin-top: -12px; }
.warn-msg { font-size: 13px; color: #ef4444; margin-top: -12px; }

.presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.preset-btn {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  background: #f3f4f6;
  color: #374151;
  border: 2px solid transparent;
  transition: all 0.15s;
}
.preset-btn:hover:not(:disabled) { background: #e5e7eb; }
.preset-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }
.preset-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.adjust-row {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}
.adjust-display {
  font-size: 13px;
  color: var(--text-muted);
  min-width: 60px;
  text-align: center;
}
.btn-adjust {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.btn-adjust:hover:not(:disabled) { background: #e5e7eb; }
.btn-adjust:disabled { opacity: 0.4; cursor: not-allowed; }

.custom-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.custom-input {
  width: 90px;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  outline: none;
}
.custom-input:focus { border-color: #4f46e5; }
.custom-input:disabled { opacity: 0.5; }
.unit { font-size: 14px; color: var(--text-muted); }
.btn-apply {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  background: #e0e7ff;
  color: #4f46e5;
}
.btn-apply:hover:not(:disabled) { background: #c7d2fe; }
.btn-apply:disabled { opacity: 0.5; cursor: not-allowed; }

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.controls button {
  padding: 11px 22px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.15s;
}
.btn-start { background: #4f46e5; color: #fff; }
.btn-start:hover:not(:disabled) { background: #4338ca; }
.btn-start:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-pause { background: #f59e0b; color: #fff; }
.btn-pause:hover { background: #d97706; }
.btn-resume { background: #10b981; color: #fff; }
.btn-resume:hover { background: #059669; }
.btn-reset { background: #f3f4f6; color: #374151; }
.btn-reset:hover { background: #e5e7eb; }

.progress-wrap {
  width: 100%;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 1s linear, background 0.3s;
}

.btn-lap { background: #e0e7ff; color: #4f46e5; }
.btn-lap:hover { background: #c7d2fe; }

.lap-list {
  width: 100%;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  font-size: 13px;
}
.lap-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid var(--bg, #f3f4f6);
}
.lap-item:last-child { border-bottom: none; }
.lap-no { color: var(--text-muted); min-width: 48px; }
.lap-split { font-weight: 600; color: #1f2937; }
.lap-total { color: var(--text-muted); font-size: 12px; }
</style>
