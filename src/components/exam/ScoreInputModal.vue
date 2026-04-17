<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal">

        <div class="modal-header">
          <h3>채점 결과 입력</h3>
          <p>응시 정보와 분야별 점수를 입력하세요 (0~20)</p>
        </div>

        <!-- 저장 방법 선택 (다시 풀기인 경우) -->
        <div v-if="hasOverwriteTarget" class="save-method-section">
          <label class="meta-label">저장 방법</label>
          <div class="save-method-options">
            <label :class="['method-btn', { active: saveMethod === 'overwrite' }]">
              <input type="radio" v-model="saveMethod" value="overwrite" />
              기존 결과 덮어쓰기
            </label>
            <label :class="['method-btn', { active: saveMethod === 'new' }]">
              <input type="radio" v-model="saveMethod" value="new" />
              새 결과로 저장
            </label>
          </div>
        </div>

        <!-- 메타데이터 입력 -->
        <div class="meta-section">
          <div class="meta-row">
            <label class="meta-label">응시 년도</label>
            <select v-model="selectedYear" class="meta-select">
              <option v-for="y in YEARS" :key="y" :value="y">{{ y }}년</option>
            </select>
          </div>

          <div class="meta-row">
            <label class="meta-label">시험 시기</label>
            <div class="meta-options">
              <button
                v-for="p in PERIODS"
                :key="p"
                :class="['meta-btn', { active: selectedPeriod === p }]"
                @click="selectedPeriod = p"
              >{{ p }}</button>
            </div>
          </div>

          <div class="meta-row">
            <label class="meta-label">플랫폼</label>
            <div class="meta-options platform-options">
              <button
                v-for="pl in PLATFORMS"
                :key="pl"
                :class="['meta-btn', { active: selectedPlatform === pl }]"
                @click="selectedPlatform = pl"
              >{{ pl }}</button>
              <input
                v-if="selectedPlatform === '기타'"
                v-model="customPlatform"
                class="platform-input"
                placeholder="직접 입력"
              />
            </div>
          </div>

          <div class="meta-row">
            <label class="meta-label">회차</label>
            <div class="round-input-wrap">
              <input
                type="number"
                min="1"
                v-model.number="selectedRound"
                class="round-input"
                placeholder="회차"
              />
              <span class="unit">회</span>
            </div>
          </div>
        </div>

        <div class="divider-line" />

        <button
          v-if="hasWrongMarks"
          class="btn-auto-calc"
          type="button"
          @click="autoFillScores"
        >틀린 마킹으로 자동 계산</button>

        <div class="score-fields">
          <div v-for="cat in CATEGORIES" :key="cat" class="score-row">
            <label class="cat-label">{{ cat }}</label>
            <div class="score-input-wrap">
              <input
                type="number"
                min="0"
                max="20"
                v-model.number="scores[cat]"
                class="score-input"
                placeholder="0"
              />
              <span class="unit">점</span>
            </div>
          </div>
        </div>

        <div class="total-row">
          <span class="total-label">총점</span>
          <span class="total-value">{{ totalScore }}점</span>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">취소</button>
          <button class="btn-submit" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '저장 중...' : authStore.isLoggedIn ? '제출하기' : '로그인하여 저장' }}
          </button>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useResultStore } from '@/stores/result'
import { useAuthStore } from '@/stores/auth'

const CATEGORY_RANGES = {
  '언어이해':  [1,  20],
  '자료해석':  [21, 40],
  '창의수리':  [41, 60],
  '언어추리':  [61, 80],
  '수열추리':  [81, 100],
}

const props = defineProps({
  visible: Boolean,
  sessionId: { type: [String, Number], default: null },
  answers:  { type: Object, default: () => ({}) },
  guesses:  { type: Object, default: () => ({}) },
  wrongs:   { type: Object, default: () => ({}) },
  elapsedSeconds: { type: Number, default: null },
  retryResultId: { type: [String, Number], default: null }
})
const emit = defineEmits(['close', 'saved'])

const resultStore = useResultStore()
const authStore = useAuthStore()

const CATEGORIES = ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리']
const YEARS = Array.from({ length: 7 }, (_, i) => 2020 + i)
const PERIODS = ['상반기', '하반기']
const PLATFORMS = ['해커스', '링커리어', '렛유인', '인크루트', '에듀윌', '기타']

const scores = ref(Object.fromEntries(CATEGORIES.map(c => [c, null])))
const selectedYear = ref(new Date().getFullYear())
const selectedPeriod = ref('상반기')
const selectedPlatform = ref('해커스')
const customPlatform = ref('')
const selectedRound = ref(null)  // number | null
const saveMethod = ref('overwrite') // 'overwrite' | 'new'
const submitting = ref(false)
const errorMsg = ref('')

const hasOverwriteTarget = computed(() => {
  const n = Number(props.retryResultId)
  return Number.isInteger(n) && n > 0
})

function buildQuestions() {
  const allNos = new Set([
    ...Object.keys(props.answers).map(Number),
    ...Object.keys(props.guesses).filter(k => props.guesses[k]).map(Number),
    ...Object.keys(props.wrongs).filter(k => props.wrongs[k]).map(Number)
  ])
  return [...allNos].sort((a, b) => a - b).map(no => ({
    questionNo: no,
    selectedAnswer: props.answers[no] ?? null,
    isGuessed: !!props.guesses[no],
    isWrong: !!props.wrongs[no]
  }))
}

const hasWrongMarks = computed(() =>
  Object.values(props.wrongs).some(v => v)
)

function autoFillScores() {
  for (const [cat, [start, end]] of Object.entries(CATEGORY_RANGES)) {
    let wrongCount = 0
    for (let no = start; no <= end; no++) {
      if (props.wrongs[no]) wrongCount++
    }
    scores.value[cat] = 20 - wrongCount
  }
}

const totalScore = computed(() => {
  const vals = CATEGORIES.map(c => scores.value[c]).filter(v => v !== null && v !== '')
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0)
})

const effectivePlatform = computed(() =>
  selectedPlatform.value === '기타' ? (customPlatform.value.trim() || '기타') : selectedPlatform.value
)

async function handleSubmit() {
  errorMsg.value = ''

  const filled = CATEGORIES.filter(c => scores.value[c] !== null && scores.value[c] !== '')
  if (filled.length < CATEGORIES.length) {
    errorMsg.value = '모든 분야의 점수를 입력해주세요.'
    return
  }
  const invalid = CATEGORIES.find(c => scores.value[c] < 0 || scores.value[c] > 20)
  if (invalid) {
    errorMsg.value = '점수는 0~20 사이로 입력해주세요.'
    return
  }
  if (selectedPlatform.value === '기타' && !customPlatform.value.trim()) {
    errorMsg.value = '기타 플랫폼의 이름을 직접 입력해주세요.'
    return
  }

  if (!authStore.isLoggedIn) {
    sessionStorage.setItem('pendingManualResult', JSON.stringify({
      scores: { ...scores.value },
      examYear: selectedYear.value,
      examPeriod: selectedPeriod.value,
      platform: effectivePlatform.value,
      examRound: selectedRound.value ? String(selectedRound.value) + '회' : null,
      questions: buildQuestions(),
      isDraft: false
    }))
    authStore.openModal('login')
    return
  }

  const meta = {
    examYear: selectedYear.value,
    examPeriod: selectedPeriod.value,
    platform: effectivePlatform.value,
    examRound: selectedRound.value ? String(selectedRound.value) + '회' : null,
    elapsedSeconds: props.elapsedSeconds,
    questions: buildQuestions(),
    isDraft: false
  }
  submitting.value = true
  const shouldOverwrite = hasOverwriteTarget.value && saveMethod.value === 'overwrite'
  const result = shouldOverwrite
    ? await resultStore.updateManualResult(props.retryResultId, { ...scores.value }, meta)
    : await resultStore.saveManualResult(props.sessionId, { ...scores.value }, meta)
  submitting.value = false

  if (result.success) {
    emit('saved', { resultId: result.resultId, isDraft: false })
  } else if (authStore.showModal) {
    // 로그인 만료로 인한 모달 → 재로그인 후 자동 재제출
    authStore.setPendingAction(() => handleSubmit())
  } else {
    errorMsg.value = '저장에 실패했습니다. 다시 시도해주세요.'
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}

.modal-header { margin-bottom: 20px; }
.modal-header h3 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
.modal-header p { font-size: 13px; color: #6b7280; }

.save-method-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  margin-bottom: 16px;
}
.save-method-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.method-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.15s;
}
.method-btn input[type="radio"] { accent-color: #4f46e5; }
.method-btn.active { border-color: #4f46e5; background: #eef2ff; color: #4338ca; font-weight: 600; }

.meta-section { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }

.meta-row { display: flex; align-items: flex-start; gap: 12px; }
.meta-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  min-width: 64px;
  padding-top: 6px;
}

.meta-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.platform-options { align-items: center; }

.meta-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.15s;
}
.meta-btn:hover { background: #e5e7eb; }
.meta-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }

.platform-input {
  padding: 5px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  width: 90px;
}
.platform-input:focus { border-color: #4f46e5; }

.meta-select {
  padding: 5px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #f9fafb;
  cursor: pointer;
}
.meta-select:focus { border-color: #4f46e5; }

.round-input-wrap { display: flex; align-items: center; gap: 6px; }
.round-input {
  width: 80px;
  padding: 5px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  outline: none;
}
.round-input:focus { border-color: #4f46e5; }

.divider-line {
  border-top: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.btn-auto-calc {
  width: 100%;
  padding: 9px;
  margin-bottom: 14px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #6ee7b7;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-auto-calc:hover { background: #d1fae5; }

.score-fields { display: flex; flex-direction: column; gap: 12px; }

.score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cat-label { font-size: 14px; font-weight: 500; color: #374151; }

.score-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-input {
  width: 72px;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  outline: none;
  transition: border-color 0.15s;
}
.score-input:focus { border-color: #4f46e5; }

.unit { font-size: 13px; color: #6b7280; }

.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
.total-label { font-size: 14px; font-weight: 600; color: #374151; }
.total-value { font-size: 20px; font-weight: 700; color: #1f2937; }

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}
.modal-actions button {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}
.btn-cancel { background: #f3f4f6; color: #374151; }
.btn-cancel:hover { background: #e5e7eb; }
.btn-submit { background: #4f46e5; color: #fff; }
.btn-submit:hover:not(:disabled) { background: #4338ca; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.error-msg {
  margin-top: 12px;
  font-size: 13px;
  color: #ef4444;
  text-align: center;
}
</style>
