<template>
  <div class="timer-display">
    <div class="timer-time" :class="{ warning: remaining <= 300, danger: remaining <= 60 }">
      {{ formattedTime }}
    </div>
    <div class="timer-total">/ {{ totalMinutes }}분</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  totalSeconds: { type: Number, default: 3600 },
  running: { type: Boolean, default: false }
})
const emit = defineEmits(['tick', 'expired'])

const remaining = ref(props.totalSeconds)
let interval = null

// totalSeconds가 변경되면 (리셋 등) remaining도 동기화
watch(() => props.totalSeconds, (v) => {
  if (!props.running) remaining.value = v
})

watch(() => props.running, (val) => {
  if (val) {
    interval = setInterval(() => {
      remaining.value--
      emit('tick', remaining.value)
      if (remaining.value <= 0) {
        clearInterval(interval)
        emit('expired')
      }
    }, 1000)
  } else {
    clearInterval(interval)
  }
}, { immediate: true })

onUnmounted(() => clearInterval(interval))

const formattedTime = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${String(m).padStart(2, '0')}분 ${String(s).padStart(2, '0')}초`
})

const totalMinutes = computed(() => Math.floor(props.totalSeconds / 60))
</script>

<style scoped>
.timer-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.timer-time {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
  transition: color 0.3s;
}

.timer-time.warning { color: #fbbf24; }
.timer-time.danger { color: #f87171; animation: pulse 1s infinite; }

.timer-total {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
