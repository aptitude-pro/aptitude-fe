<template>
  <div class="question-area">
    <div class="question-header">
      <span class="question-no">Q.{{ questionNo }}</span>
    </div>
    <p class="question-text">{{ question.text }}</p>
    <div class="choices">
      <button
        v-for="(choice, idx) in question.choices"
        :key="idx"
        :class="['choice-btn', choiceState(idx)]"
        :disabled="answered"
        @click="select(idx)"
      >
        <span class="choice-no">{{ idx + 1 }}</span>
        <span class="choice-label">{{ choice.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  questionNo: { type: Number, default: 1 }
})
const emit = defineEmits(['answer'])

const selected = ref(null)
const answered = ref(false)

function select(idx) {
  if (answered.value) return
  selected.value = idx
  answered.value = true
  const isCorrect = idx === props.question.answerIndex
  // 0.55초 피드백 후 이벤트 발생
  setTimeout(() => {
    emit('answer', { isCorrect })
    selected.value = null
    answered.value = false
  }, 550)
}

function choiceState(idx) {
  if (!answered.value) return ''
  if (idx === props.question.answerIndex) return 'correct'
  if (idx === selected.value) return 'wrong'
  return ''
}
</script>

<style scoped>
.question-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-no {
  font-size: 11px;
  font-weight: 700;
  color: #4f46e5;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 999px;
}

.question-text {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.5;
  padding: 12px 14px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
}

.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.choice-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.choice-btn:hover:not(:disabled) {
  border-color: #4f46e5;
  background: #eef2ff;
  color: #4338ca;
}

.choice-btn:disabled { cursor: default; }

.choice-btn.correct {
  border-color: #10b981;
  background: #ecfdf5;
  color: #065f46;
  font-weight: 700;
}

.choice-btn.wrong {
  border-color: #ef4444;
  background: #fef2f2;
  color: #991b1b;
}

.choice-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e5e7eb;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.choice-btn.correct .choice-no { background: #10b981; color: #fff; }
.choice-btn.wrong .choice-no   { background: #ef4444; color: #fff; }
.choice-btn:hover:not(:disabled) .choice-no { background: #4f46e5; color: #fff; }
</style>
