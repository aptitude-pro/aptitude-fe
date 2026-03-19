<template>
  <div class="calendar-tab">
    <div class="card">
      <!-- 월 이동 헤더 -->
      <div class="cal-header">
        <button class="nav-btn" @click="prevMonth">‹</button>
        <h3>{{ currentYear }}년 {{ currentMonth }}월</h3>
        <button class="nav-btn" @click="nextMonth">›</button>
      </div>

      <!-- 요일 헤더 -->
      <div class="cal-weekdays">
        <span v-for="d in weekdays" :key="d" class="weekday">{{ d }}</span>
      </div>

      <!-- 날짜 그리드 -->
      <div class="cal-grid">
        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          :class="['cal-cell', {
            'other-month': !cell.inMonth,
            'today': cell.isToday,
            'has-log': cell.log,
            'clickable': cell.inMonth
          }]"
          @click="cell.inMonth && openModal(cell)"
        >
          <span class="cell-day">{{ cell.day }}</span>
          <template v-if="cell.log">
            <span class="log-dot"></span>
            <span class="log-total">{{ cell.log.totalProblems }}문제</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 학습 기록 모달 -->
    <StudyLogModal
      v-if="modalDate"
      :date="modalDate"
      :examType="examType"
      :books="books"
      :existingLog="selectedLog"
      @close="modalDate = null"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStudyStore } from '@/stores/study'
import StudyLogModal from './StudyLogModal.vue'

const props = defineProps({
  studyId: { type: [String, Number], required: true },
  examType: { type: String, required: true },
  books: { type: Array, default: () => [] }
})

const studyStore = useStudyStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)  // 1-12

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const modalDate = ref(null)
const selectedLog = ref(null)

const myLogs = computed(() => studyStore.myLogs)

// Build a map: 'YYYY-MM-DD' → log
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

  // Prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ key: `prev-${i}`, day: daysInPrev - i, inMonth: false, isToday: false, log: null })
  }

  // Current month
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

  // Next month padding (fill to complete last row)
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

function monthStr() {
  return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`
}

async function loadLogs() {
  await studyStore.fetchMyLogs(props.studyId, monthStr())
}

onMounted(loadLogs)

watch([currentYear, currentMonth], loadLogs)

function prevMonth() {
  if (currentMonth.value === 1) {
    currentYear.value--
    currentMonth.value = 12
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentYear.value++
    currentMonth.value = 1
  } else {
    currentMonth.value++
  }
}

function openModal(cell) {
  modalDate.value = cell.dateStr
  selectedLog.value = cell.log || null
}

async function onSaved(payload) {
  const result = await studyStore.upsertLog(props.studyId, payload)
  if (result.success) {
    modalDate.value = null
    await loadLogs()
  } else {
    alert(result.message || '저장에 실패했습니다.')
  }
}

async function onDeleted(logId) {
  const result = await studyStore.deleteLog(props.studyId, logId)
  if (result.success) {
    modalDate.value = null
    await loadLogs()
  } else {
    alert(result.message || '삭제에 실패했습니다.')
  }
}
</script>

<style scoped>
.calendar-tab { display: flex; flex-direction: column; gap: 16px; }

.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

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
  min-height: 60px;
  border-radius: 8px;
  padding: 6px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  position: relative;
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

.log-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}

.log-total {
  font-size: 10px;
  color: var(--primary);
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}
</style>
