<template>
  <div class="omr-sheet">
    <div class="omr-header">
      <span class="panel-label">OMR 답안지</span>
      <div class="omr-actions">
        <button class="omr-btn save" @click="$emit('save')">임시저장</button>
        <button class="omr-btn reset" @click="confirmReset">답안 초기화</button>
      </div>
    </div>

    <div class="omr-scroll">
      <div class="omr-list">
        <div
          v-for="n in props.questionCount"
          :key="n"
          :class="['omr-row', { answered: props.answers[n], unanswered: props.showUnansweredWarning && !props.answers[n], guessed: props.guesses[n], wronged: props.wrongs[n] }]"
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
          <button
            :class="['guess-btn', { active: props.guesses[n] }]"
            @click="$emit('toggleGuess', n)"
            title="찍었음"
          >?</button>
          <button
            :class="['wrong-btn', { active: props.wrongs[n] }]"
            @click="$emit('toggleWrong', n)"
            title="틀린 것 같음"
          >✗</button>
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
  answers: { type: Object, default: () => ({}) },
  guesses: { type: Object, default: () => ({}) },
  wrongs: { type: Object, default: () => ({}) },
  showUnansweredWarning: { type: Boolean, default: false }
})
const emit = defineEmits(['mark', 'clear', 'submit', 'save', 'toggleGuess', 'toggleWrong', 'reset'])

const answeredCount = computed(() => Object.keys(props.answers).length)

function toggleAnswer(questionNo, choice) {
  if (props.answers[questionNo] === choice) {
    emit('clear', questionNo)
  } else {
    emit('mark', questionNo, choice)
  }
}

function confirmReset() {
  if (confirm('모든 답안과 ?, ✗ 마킹을 초기화하시겠습니까?')) {
    emit('reset')
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
  white-space: nowrap;
  transition: all 0.15s;
}
.omr-btn.save {
  background: #1f2937;
  color: #fff;
}
.omr-btn.save:hover { background: #111827; }
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

.omr-list { padding: 6px 8px; }

.omr-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 4px 2px;
  border-radius: 6px;
  transition: background 0.1s;
}
.omr-row:hover { background: #f9fafb; }
.omr-row.answered { background: #f0fdf4; }
.omr-row.unanswered { background: #fff1f2; border: 1px solid #fca5a5; border-radius: 6px; }

.q-num {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  width: 22px;
  text-align: right;
  flex-shrink: 0;
}

.choices {
  display: flex;
  gap: 4px;
}

.choice-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  background: #fff;
  font-size: 14px;
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

.guess-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  background: #f3f4f6;
  color: #9ca3af;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.guess-btn:hover { border-color: #9ca3af; color: #6b7280; }
.guess-btn.active { background: #fef3c7; color: #d97706; border-color: #fcd34d; }
.omr-row.guessed .q-num { color: #d97706; }

.wrong-btn {
  width: 30px; height: 30px; border-radius: 50%;
  font-size: 14px; font-weight: 700;
  background: #f3f4f6; color: #9ca3af; border: 1px solid #e5e7eb;
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.wrong-btn:hover { border-color: #fca5a5; color: #ef4444; }
.wrong-btn.active { background: #fff1f2; color: #ef4444; border-color: #fca5a5; }
.omr-row.wronged .q-num { color: #ef4444; }

@media (max-width: 1440px) {
  .choice-btn {
    width: 22px;
    height: 22px;
    font-size: 11px;
  }

  .guess-btn,
  .wrong-btn {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }

  .omr-row {
    gap: 6px;
  }

  .choices {
    gap: 3px;
  }
}
</style>
