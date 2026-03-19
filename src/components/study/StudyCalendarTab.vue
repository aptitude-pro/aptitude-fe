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
            'has-log': cell.hasLog,
            'clickable': cell.inMonth && cell.hasLog
          }]"
          @click="cell.inMonth && cell.hasLog && openDayDetail(cell)"
        >
          <span class="cell-day">{{ cell.day }}</span>
          <template v-if="cell.logs && cell.logs.length">
            <div class="member-chips">
              <span
                v-for="m in cell.logs"
                :key="m.userId"
                :class="['member-chip', { 'my-chip': m.userId === myUserId }]"
                :title="m.nickname + ' · ' + m.totalProblems + '문제'"
              >
                {{ m.nickname?.charAt(0) }}·{{ m.totalProblems }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 팀원 기록 상세 팝업 -->
    <div v-if="selectedDayLogs" class="modal-overlay" @click.self="selectedDayLogs = null">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedDayLabel }} 학습 현황</h3>
          <button class="close-btn" @click="selectedDayLogs = null">✕</button>
        </div>
        <div class="day-log-list">
          <div v-for="m in selectedDayLogs" :key="m.userId" class="day-log-item">
            <div class="day-log-top">
              <div class="log-avatar" :class="{ 'my-avatar': m.userId === myUserId }">{{ m.nickname?.charAt(0) }}</div>
              <div class="log-name-wrap">
                <span class="log-name">{{ m.userId === myUserId ? `나 (${m.nickname})` : m.nickname }}</span>
                <span class="log-book">{{ m.bookTitle ? `[${m.bookTitle}]` : '[책 없이]' }}</span>
              </div>
              <span class="log-total-num">총 {{ m.totalProblems }}문제</span>
            </div>
            <div class="log-cats" v-if="m.categories?.length">
              <span v-for="c in m.categories" :key="c.categoryName" class="cat-chip">
                {{ c.categoryName }} {{ c.problemCount }}
              </span>
            </div>
          </div>
          <div v-if="!selectedDayLogs.length" class="empty">기록이 없습니다</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStudyStore } from '@/stores/study'

const props = defineProps({
  studyId: { type: [String, Number], required: true },
  examType: { type: String, required: true },
  books: { type: Array, default: () => [] },
  memberLogs: { type: Array, default: () => [] },
  myUserId: { type: [String, Number], default: null }
})

const studyStore = useStudyStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const selectedDayLogs = ref(null)
const selectedDayLabel = ref('')

// Build a map: 'YYYY-MM-DD' → [memberLog, ...]
const allLogMap = computed(() => {
  const map = {}
  props.memberLogs.forEach(l => {
    if (!map[l.logDate]) map[l.logDate] = []
    map[l.logDate].push(l)
  })
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
    cells.push({ key: `prev-${i}`, day: daysInPrev - i, inMonth: false, isToday: false, logs: null, hasLog: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const logs = allLogMap.value[dateStr] || null
    cells.push({
      key: dateStr,
      day: d,
      inMonth: true,
      isToday: dateStr === todayStr,
      dateStr,
      logs,
      hasLog: !!(logs && logs.length)
    })
  }

  const remaining = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    cells.push({ key: `next-${i}`, day: i, inMonth: false, isToday: false, logs: null, hasLog: false })
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

const emit = defineEmits(['month-change'])

async function loadLogs() {
  emit('month-change', monthStr())
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

function openDayDetail(cell) {
  selectedDayLogs.value = cell.logs || []
  const [y, m, d] = cell.dateStr.split('-')
  selectedDayLabel.value = `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`
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
  min-height: 80px;
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

.member-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  width: 100%;
}

.member-chip {
  font-size: 10px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 10px;
  padding: 1px 5px;
  font-weight: 600;
  white-space: nowrap;
}

.member-chip.my-chip {
  background: #4f46e5;
  color: #fff;
}

/* 팝업 모달 */
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
  width: 480px;
  max-width: calc(100vw - 32px);
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.modal-header h3 { font-size: 16px; font-weight: 700; }
.close-btn { background: none; border: none; font-size: 16px; color: var(--text-muted); cursor: pointer; }

.day-log-list { display: flex; flex-direction: column; gap: 12px; }
.day-log-item {
  padding: 12px;
  background: var(--bg);
  border-radius: 10px;
}
.day-log-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.log-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.log-avatar.my-avatar { background: #4f46e5; }
.log-name-wrap { flex: 1; }
.log-name { display: block; font-size: 14px; font-weight: 600; }
.log-book { font-size: 12px; color: var(--text-muted); }
.log-total-num { font-size: 15px; font-weight: 700; color: var(--primary); flex-shrink: 0; }
.log-cats { display: flex; flex-wrap: wrap; gap: 4px; }
.cat-chip {
  font-size: 11px;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 500;
}
.empty { padding: 20px; text-align: center; color: var(--text-muted); font-size: 14px; }
</style>
