<template>
  <div class="my-study-log">
    <div class="page-title">
      <h2>내 학습 기록</h2>
    </div>

    <!-- 개인 책 관리 -->
    <div class="card">
      <div class="card-header-row">
        <h3>내 책 관리 ({{ myBooks.length }})</h3>
        <button class="btn-primary sm" @click="showBookForm = !showBookForm">
          {{ showBookForm ? '취소' : '+ 책 등록' }}
        </button>
      </div>

      <div v-if="showBookForm" class="book-form">
        <div class="form-row">
          <div class="form-group">
            <label>제목 *</label>
            <input v-model="bookForm.title" placeholder="책 제목" />
          </div>
          <div class="form-group narrow">
            <label>년도</label>
            <input v-model.number="bookForm.year" type="number" placeholder="2025" min="2000" max="2099" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>시험유형</label>
            <div class="exam-type-btns">
              <button
                v-for="t in examTypes"
                :key="t"
                :class="['exam-type-btn', { active: bookForm.examType === t }]"
                @click="bookForm.examType = t"
                type="button"
              >{{ t }}</button>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" @click="submitBook" :disabled="!bookForm.title.trim() || bookLoading">
            {{ bookLoading ? '등록 중...' : '등록' }}
          </button>
        </div>
      </div>

      <div v-if="myBooks.length === 0 && !showBookForm" class="empty">등록된 책이 없습니다</div>
      <div v-else class="book-list">
        <div v-for="book in myBooks" :key="book.id" class="book-item">
          <div class="book-icon">📖</div>
          <div class="book-info">
            <span class="book-title">{{ book.title }}</span>
            <span class="book-meta">
              <template v-if="book.year">{{ book.year }}</template>
              <template v-if="book.year && book.examType"> · </template>
              <template v-if="book.examType">{{ book.examType }}</template>
            </span>
          </div>
          <button class="btn-icon-danger" @click="removeBook(book.id)" title="삭제">✕</button>
        </div>
      </div>
    </div>

    <!-- 달력 -->
    <div class="card">
      <div class="cal-header">
        <button class="nav-btn" @click="prevMonth">‹</button>
        <h3>{{ currentYear }}년 {{ currentMonth }}월</h3>
        <button class="nav-btn" @click="nextMonth">›</button>
      </div>

      <div class="cal-weekdays">
        <span v-for="d in weekdays" :key="d" class="weekday">{{ d }}</span>
      </div>

      <div class="cal-grid">
        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          :class="['cal-cell', {
            'other-month': !cell.inMonth,
            'today': cell.isToday,
            'has-log': cell.log || (studyLogsByDate[cell.dateStr] && studyLogsByDate[cell.dateStr].length > 0),
            'clickable': cell.inMonth
          }]"
          @click="cell.inMonth && openModal(cell)"
        >
          <span class="cell-day">{{ cell.day }}</span>
          <template v-if="cell.log">
            <span class="log-book-name" v-if="cell.log.bookTitle">{{ cell.log.bookTitle }}</span>
            <span class="log-total">{{ cell.log.totalProblems }}문제</span>
          </template>
          <span
            v-for="sl in (studyLogsByDate[cell.dateStr] || [])"
            :key="sl.id"
            class="study-log-chip"
            :title="sl.studyName + ' · ' + sl.totalProblems + '문제'"
            @click.stop="openStudyLogDetail(sl)"
          >📚 {{ sl.totalProblems }}</span>
        </div>
      </div>
    </div>

    <!-- 학습 기록 모달 -->
    <StudyLogModal
      v-if="modalDate"
      :date="modalDate"
      :examType="'SKCT'"
      :books="myBooks"
      :existingLog="selectedLog"
      @close="modalDate = null"
      @saved="onSaved"
      @deleted="onDeleted"
    />

    <!-- 스터디 기록 상세 팝업 (읽기전용) -->
    <div v-if="selectedStudyLog" class="modal-overlay" @click.self="selectedStudyLog = null">
      <div class="modal study-log-detail">
        <div class="modal-header">
          <h3>📚 {{ selectedStudyLog.studyName }}</h3>
          <button class="close-btn" @click="selectedStudyLog = null">✕</button>
        </div>
        <p class="detail-date">{{ selectedStudyLog.logDate }} · 총 {{ selectedStudyLog.totalProblems }}문제</p>
        <div v-if="selectedStudyLog.categories && selectedStudyLog.categories.length" class="detail-cats">
          <div v-for="c in selectedStudyLog.categories" :key="c.categoryName" class="detail-cat-row">
            <span class="cat-name">{{ c.categoryName }}</span>
            <span class="cat-count">{{ c.problemCount }}문제</span>
          </div>
        </div>
        <p v-if="selectedStudyLog.memo" class="detail-memo">{{ selectedStudyLog.memo }}</p>
        <router-link :to="`/studies/${selectedStudyLog.studyId}`" class="study-link">
          스터디로 이동 →
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import apiClient from '@/api'
import StudyLogModal from '@/components/study/StudyLogModal.vue'

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const myBooks = ref([])
const myLogs = ref([])
const studyLogsByDate = ref({})
const modalDate = ref(null)
const selectedLog = ref(null)
const selectedStudyLog = ref(null)
const showBookForm = ref(false)
const bookLoading = ref(false)
const examTypes = ['SKCT', 'GSAT', '종합']
const bookForm = ref({ title: '', year: new Date().getFullYear(), examType: 'SKCT' })

function monthStr() {
  return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`
}

async function loadBooks() {
  try {
    const res = await apiClient.get('/my/books')
    myBooks.value = res.data.data || []
  } catch (_) {}
}

async function loadLogs() {
  try {
    const month = monthStr()
    const [logsRes, studyLogsRes] = await Promise.all([
      apiClient.get('/my/logs', { params: { month } }),
      apiClient.get('/my/study-logs', { params: { month } })
    ])
    myLogs.value = logsRes.data.data || []
    const map = {}
    for (const sl of (studyLogsRes.data.data || [])) {
      if (!map[sl.logDate]) map[sl.logDate] = []
      map[sl.logDate].push(sl)
    }
    studyLogsByDate.value = map
  } catch (_) {}
}

onMounted(async () => {
  await Promise.all([loadBooks(), loadLogs()])
})

watch([currentYear, currentMonth], loadLogs)

const logMap = computed(() => {
  const map = {}
  myLogs.value.forEach(l => { map[l.logDate] = l })
  return map
})

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrev = new Date(year, month - 1, 0).getDate()

  const todayStr = formatDate(today)
  const cells = []

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ key: `prev-${i}`, day: daysInPrev - i, inMonth: false, isToday: false, log: null })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({
      key: dateStr,
      day: d,
      inMonth: true,
      isToday: dateStr === todayStr,
      dateStr,
      log: logMap.value[dateStr] || null
    })
  }

  const remaining = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    cells.push({ key: `next-${i}`, day: i, inMonth: false, isToday: false, log: null })
  }

  return cells
})

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function prevMonth() {
  if (currentMonth.value === 1) { currentYear.value--; currentMonth.value = 12 }
  else { currentMonth.value-- }
}

function nextMonth() {
  if (currentMonth.value === 12) { currentYear.value++; currentMonth.value = 1 }
  else { currentMonth.value++ }
}

function openModal(cell) {
  modalDate.value = cell.dateStr
  selectedLog.value = cell.log || null
}

function openStudyLogDetail(sl) {
  selectedStudyLog.value = sl
}

async function onSaved(payload) {
  try {
    await apiClient.post('/my/logs', payload)
    modalDate.value = null
    await loadLogs()
  } catch (_) {
    alert('저장에 실패했습니다.')
  }
}

async function onDeleted(logId) {
  if (!confirm('학습 기록을 삭제하시겠습니까?')) return
  try {
    await apiClient.delete(`/my/logs/${logId}`)
    modalDate.value = null
    await loadLogs()
  } catch (_) {
    alert('삭제에 실패했습니다.')
  }
}

async function submitBook() {
  if (!bookForm.value.title.trim()) return
  bookLoading.value = true
  try {
    const res = await apiClient.post('/my/books', bookForm.value)
    myBooks.value.unshift(res.data.data)
    bookForm.value = { title: '', year: new Date().getFullYear(), examType: 'SKCT' }
    showBookForm.value = false
  } catch (_) {
    alert('책 등록에 실패했습니다.')
  } finally {
    bookLoading.value = false
  }
}

async function removeBook(bookId) {
  if (!confirm('책을 삭제하시겠습니까?')) return
  try {
    await apiClient.delete(`/my/books/${bookId}`)
    myBooks.value = myBooks.value.filter(b => b.id !== bookId)
  } catch (_) {
    alert('삭제에 실패했습니다.')
  }
}
</script>

<style scoped>
.my-study-log { max-width: 800px; display: flex; flex-direction: column; gap: 20px; }

.page-title h2 { font-size: 20px; font-weight: 700; }

.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.card h3 { font-size: 15px; font-weight: 600; }
.card-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-header-row h3 { margin-bottom: 0; }

.book-form {
  background: var(--bg);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
.form-row { display: flex; gap: 12px; margin-bottom: 10px; }
.form-group { flex: 1; }
.form-group label { display: block; font-size: 12px; font-weight: 500; margin-bottom: 4px; color: var(--text-muted); }
.form-group input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.form-group input:focus { border-color: var(--primary); }
.form-group.narrow { max-width: 100px; flex: 0 0 100px; }
.form-actions { display: flex; justify-content: flex-end; }

.exam-type-btns { display: flex; gap: 6px; }
.exam-type-btn {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-muted);
  font-weight: 500;
}
.exam-type-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}

.book-list { display: flex; flex-direction: column; gap: 8px; }
.book-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg);
  border-radius: 8px;
}
.book-icon { font-size: 20px; flex-shrink: 0; }
.book-info { flex: 1; min-width: 0; }
.book-title { display: block; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.book-meta { font-size: 12px; color: var(--text-muted); }
.btn-icon-danger {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.btn-icon-danger:hover { background: #fee2e2; }

/* 달력 */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
}
.cal-header h3 { font-size: 16px; font-weight: 700; min-width: 120px; text-align: center; }
.nav-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-btn:hover { border-color: var(--primary); color: var(--primary); }

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.weekday {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 4px 0;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.cal-cell {
  min-height: 80px;
  border-radius: 8px;
  padding: 6px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.cal-cell.clickable { cursor: pointer; }
.cal-cell.clickable:hover { background: var(--bg); }
.cal-cell.other-month .cell-day { color: #d1d5db; }

.cal-cell.today .cell-day {
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal-cell.has-log { background: #eff6ff; }
.cal-cell.has-log.clickable:hover { background: #dbeafe; }

.cell-day { font-size: 13px; font-weight: 500; line-height: 24px; }

.log-book-name {
  font-size: 10px;
  color: #6366f1;
  font-weight: 500;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-total {
  font-size: 12px;
  color: var(--primary);
  font-weight: 700;
  text-align: center;
  background: #dbeafe;
  border-radius: 4px;
  padding: 2px 5px;
  width: calc(100% - 4px);
}

.empty { padding: 30px; text-align: center; color: var(--text-light); font-size: 14px; }

.btn-primary { background: var(--primary); color: #fff; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.btn-primary.sm { padding: 6px 12px; font-size: 12px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* 스터디 기록 칩 */
.study-log-chip {
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  background: #d1fae5;
  border-radius: 4px;
  padding: 2px 5px;
  width: calc(100% - 4px);
  text-align: center;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.study-log-chip:hover { background: #a7f3d0; }

/* 스터디 기록 상세 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-width: 320px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.modal-header h3 { font-size: 16px; font-weight: 700; }
.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 2px 6px;
  border-radius: 4px;
}
.close-btn:hover { background: var(--bg); }
.detail-date { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.detail-cats { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.detail-cat-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 10px;
  background: var(--bg);
  border-radius: 6px;
}
.cat-name { color: var(--text); }
.cat-count { font-weight: 600; color: var(--primary); }
.detail-memo {
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 12px;
  white-space: pre-wrap;
}
.study-link {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
}
.study-link:hover { text-decoration: underline; }
</style>
