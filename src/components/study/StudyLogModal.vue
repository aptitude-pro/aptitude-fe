<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ formattedDate }} 학습 기록</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="form-group">
        <label>책 선택</label>
        <select v-model="form.bookId">
          <option :value="null">책 없이</option>
          <option v-for="b in books" :key="b.id" :value="b.id">{{ b.title }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>시험 유형</label>
        <div class="exam-type-btns">
          <button
            v-for="t in ['SKCT', 'GSAT']" :key="t"
            :class="['type-btn', { active: selectedExamType === t }]"
            @click="selectedExamType = t"
            type="button"
          >{{ t }}</button>
        </div>
      </div>

      <div class="form-group">
        <label>영역별 문제 수</label>
        <div class="category-inputs">
          <div v-for="cat in categories" :key="cat" class="category-row">
            <span class="cat-name">{{ cat }}</span>
            <input
              type="number"
              min="0"
              v-model.number="form.categoryMap[cat]"
              placeholder="0"
            />
            <span class="cat-unit">문제</span>
          </div>
        </div>
        <div class="total-hint">합계: {{ totalProblems }}문제</div>
      </div>

      <div class="form-group">
        <label>메모</label>
        <textarea v-model="form.memo" placeholder="오늘 공부 내용 메모..." rows="3"></textarea>
      </div>

      <div class="modal-actions">
        <button v-if="existingLog" class="btn-danger-outline" @click="handleDelete" :disabled="saving">삭제</button>
        <div class="right-actions">
          <button class="btn-primary" @click="handleSave" :disabled="saving">
            {{ saving ? '저장 중...' : '저장' }}
          </button>
          <button class="btn-secondary" @click="$emit('close')">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { EXAM_CATEGORIES } from '@/constants/examCategories'

const props = defineProps({
  date: { type: String, required: true },  // 'YYYY-MM-DD'
  examType: { type: String, required: true },
  books: { type: Array, default: () => [] },
  existingLog: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved', 'deleted'])

const saving = ref(false)

const selectedExamType = ref('SKCT')

const categories = computed(() => EXAM_CATEGORIES[selectedExamType.value] || [])

const formattedDate = computed(() => {
  const [y, m, d] = props.date.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`
})

const form = ref({
  bookId: null,
  memo: '',
  categoryMap: {}
})

// Initialize from existingLog
watch(() => props.existingLog, (log) => {
  if (log?.categories?.length) {
    // 역추론: 로그에 있는 카테고리명으로 유형 감지
    const logCatNames = log.categories.map(c => c.categoryName)
    const gsatCats = EXAM_CATEGORIES['GSAT'] || []
    const matchesGsat = logCatNames.some(n => gsatCats.includes(n))
    selectedExamType.value = matchesGsat ? 'GSAT' : 'SKCT'
  }

  const catMap = {}
  categories.value.forEach(c => { catMap[c] = 0 })
  if (log) {
    form.value.bookId = log.bookId || null
    form.value.memo = log.memo || ''
    log.categories?.forEach(c => { catMap[c.categoryName] = c.problemCount })
  } else {
    form.value.bookId = null
    form.value.memo = ''
  }
  form.value.categoryMap = catMap
}, { immediate: true })

// Also init categories when categories computed changes
watch(categories, (cats) => {
  const catMap = {}
  cats.forEach(c => { catMap[c] = form.value.categoryMap[c] || 0 })
  form.value.categoryMap = catMap
}, { immediate: true })

const totalProblems = computed(() =>
  Object.values(form.value.categoryMap).reduce((s, v) => s + (v || 0), 0)
)

async function handleSave() {
  saving.value = true
  try {
    const categoryInputs = categories.value
      .map(c => ({ categoryName: c, problemCount: form.value.categoryMap[c] || 0 }))
      .filter(c => c.problemCount > 0)
    emit('saved', {
      logDate: props.date,
      bookId: form.value.bookId,
      memo: form.value.memo,
      categories: categoryInputs
    })
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm('학습 기록을 삭제하시겠습니까?')) return
  emit('deleted', props.existingLog.id)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 460px;
  max-width: calc(100vw - 32px);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.modal-header h3 { font-size: 16px; font-weight: 700; }
.close-btn { background: none; border: none; font-size: 16px; color: var(--text-muted); cursor: pointer; }

.form-group { margin-bottom: 16px; }
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 7px;
  color: var(--text);
}
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.form-group select:focus,
.form-group textarea:focus { border-color: var(--primary); }

.exam-type-btns { display: flex; gap: 8px; }
.type-btn {
  padding: 6px 18px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}
.type-btn.active {
  border-color: var(--primary);
  color: var(--primary);
  background: #eff6ff;
}

.category-inputs { display: flex; flex-direction: column; gap: 8px; }
.category-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: var(--bg);
  border-radius: 7px;
}
.cat-name { font-size: 13px; width: 80px; flex-shrink: 0; font-weight: 500; }
.category-row input {
  width: 70px;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  text-align: right;
  outline: none;
}
.category-row input:focus { border-color: var(--primary); }
.cat-unit { font-size: 12px; color: var(--text-muted); }
.total-hint { font-size: 12px; color: var(--primary); font-weight: 600; text-align: right; margin-top: 6px; }

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  gap: 10px;
}
.right-actions { display: flex; gap: 8px; }

.btn-primary { background: var(--primary); color: #fff; padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); padding: 9px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; }
.btn-danger-outline { background: none; border: 1px solid #ef4444; color: #ef4444; padding: 9px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; }
.btn-danger-outline:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
