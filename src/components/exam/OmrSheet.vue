<template>
  <div class="omr-sheet">
    <div class="omr-header">
      <span class="panel-label">OMR 답안지</span>
      <div class="omr-actions">
        <button class="omr-btn score" @click="$emit('submit')">채점하기</button>
        <button class="omr-btn reset" @click="confirmReset">답안 초기화</button>
      </div>
    </div>

    <div class="omr-scroll">
      <div class="omr-list">
        <div
          v-for="n in props.questionCount"
          :key="n"
          :class="['omr-row', { answered: props.answers[n] }]"
        >
          <span class="q-num">{{ n }}</span>
          <div class="choices">
            <button
              v-for="c in 5"
              :key="c"
              :class="['choice-btn', { selected: props.answers[n] === c }]"
              @click="toggleAnswer(n, c)"
            >
              {{ c }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="omr-footer">
      표시한 답안: {{ answeredCount }} / {{ props.questionCount }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  questionCount: { type: Number, default: 40 },
  answers: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['mark', 'clear', 'submit'])

const answeredCount = computed(() => Object.keys(props.answers).length)

function toggleAnswer(questionNo, choice) {
  if (props.answers[questionNo] === choice) {
    emit('clear', questionNo)
  } else {
    emit('mark', questionNo, choice)
  }
}

function confirmReset() {
  if (confirm('모든 답안을 초기화하시겠습니까?')) {
    for (let i = 1; i <= props.questionCount; i++) {
      emit('clear', i)
    }
  }
}
</script>

<style scoped>
.omr-sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.omr-header {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-label {
  font-size: 13px;
  font-weight: 600;
}

.omr-actions { display: flex; gap: 6px; }

.omr-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
}
.omr-btn.score {
  background: #1f2937;
  color: #fff;
}
.omr-btn.score:hover { background: #111827; }
.omr-btn.reset {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.omr-btn.reset:hover { background: #e5e7eb; }

.omr-scroll {
  flex: 1;
  overflow-y: auto;
}

.omr-list { padding: 8px 6px; }

.omr-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 4px;
  border-radius: 6px;
  transition: background 0.1s;
}
.omr-row:hover { background: #f9fafb; }
.omr-row.answered { background: #f0fdf4; }

.q-num {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  width: 22px;
  text-align: right;
  flex-shrink: 0;
}

.choices {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.choice-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.choice-btn:hover {
  border-color: #1f2937;
  color: #1f2937;
}

.choice-btn.selected {
  background: #1f2937;
  border-color: #1f2937;
  color: #fff;
  font-weight: 700;
}

.omr-footer {
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
  flex-shrink: 0;
}

/* OMR 접기 버튼용 세로 텍스트 영역 */
</style>
