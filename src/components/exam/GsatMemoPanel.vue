<template>
  <div class="gsat-memo-panel">
    <!-- 타이머 섹션 -->
    <div class="timer-section">
      <div class="timer-top">
        <select v-model="localMinutes" class="time-select" @change="onTimeSelect">
          <option v-for="m in timeOptions" :key="m" :value="m">{{ m }}분</option>
        </select>
      </div>
      <div class="timer-adjust">
        <button class="timer-btn adjust" @click="addSeconds(15)">+15초</button>
      </div>
      <div class="time-display" :class="{ warn: timerWarn, danger: timerDanger }">
        {{ formattedTime }}
      </div>
      <div class="timer-btns">
        <button
          :class="['timer-btn', timerRunning ? 'stop' : 'start']"
          @click="toggleTimer"
        >
          {{ timerRunning ? '정지' : '시작' }}
        </button>
        <button class="timer-btn reset" @click="resetTimer">리셋</button>
      </div>
    </div>

    <!-- 메모장 -->
    <div class="memo-header">
      <span class="panel-label">📝 메모장</span>
      <button class="memo-clear-btn" @click="clearMemo">전체 지우기</button>
    </div>
    <textarea
      class="memo-input"
      placeholder="메모를 입력하세요..."
      :value="props.memoText"
      @input="$emit('update-memo', $event.target.value)"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  memoText: { type: String, default: '' },
  totalSeconds: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  timerRunning: { type: Boolean, default: false }
})
const emit = defineEmits(['update-memo', 'update-time-limit', 'timer-start', 'timer-stop', 'timer-reset', 'add-seconds'])

const timeOptions = [0, 15, 30, 45, 60, 75, 90, 105, 120, 150, 180]
const localMinutes = ref(60)

const displaySeconds = computed(() => {
  if (props.remaining > 0 || props.timerRunning) return props.remaining
  return props.totalSeconds || localMinutes.value * 60
})

const timerWarn = computed(() => displaySeconds.value <= 300 && displaySeconds.value > 60)
const timerDanger = computed(() => displaySeconds.value <= 60)

const formattedTime = computed(() => {
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

function addSeconds(sec) {
  emit('add-seconds', sec)
}

function clearMemo() {
  emit('update-memo', '')
}

onMounted(() => {
  emit('update-time-limit', localMinutes.value)
})
</script>

<style scoped>
.gsat-memo-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.timer-section {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.timer-top {
  display: flex;
  align-items: center;
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

.time-display {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin: 6px 0;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
}
.time-display.warn { color: #f59e0b; }
.time-display.danger { color: #ef4444; }

.timer-btns {
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
.timer-btn.adjust { background: #6366f1; color: #fff; }

.timer-adjust {
  margin-bottom: 6px;
}

.memo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.panel-label {
  font-size: 13px;
  font-weight: 600;
}

.memo-clear-btn {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 3px 8px;
  border-radius: 4px;
}
.memo-clear-btn:hover { background: #e5e7eb; }

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
}
.memo-input::placeholder { color: #9ca3af; }
</style>
