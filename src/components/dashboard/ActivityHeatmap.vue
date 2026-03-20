<template>
  <div class="heatmap-wrap">
    <!-- 월 라벨 -->
    <div class="month-labels">
      <span
        v-for="m in monthLabels"
        :key="m.key"
        :style="{ gridColumn: m.col }"
        class="month-label"
      >{{ m.text }}</span>
    </div>

    <div class="heatmap-grid-outer">
      <!-- 요일 라벨 -->
      <div class="day-labels">
        <span class="day-label">월</span>
        <span class="day-label">수</span>
        <span class="day-label">금</span>
      </div>

      <!-- 주 단위 컬럼 -->
      <div class="weeks-grid">
        <div v-for="(week, wi) in weeks" :key="wi" class="week-col">
          <div
            v-for="cell in week"
            :key="cell.key"
            :style="{ background: LEVEL_COLORS[cell.level] }"
            :title="tooltipText(cell)"
            class="heatmap-cell"
          />
        </div>
      </div>
    </div>

    <!-- 범례 -->
    <div class="legend">
      <span class="legend-text">적음</span>
      <span
        v-for="(c, i) in LEVEL_COLORS"
        :key="i"
        :style="{ background: c }"
        class="legend-cell"
      />
      <span class="legend-text">많음</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

const LEVEL_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']

const dayMap = computed(() => {
  const m = {}
  props.data.forEach(d => { m[d.date] = d })
  return m
})

// today 기준 364일 전(일요일 정렬을 위해 첫 주 패딩 포함)부터 today까지
const weeks = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 364일 전 날짜
  const start = new Date(today)
  start.setDate(start.getDate() - 363)

  // 시작 날짜를 월요일로 맞춤 (0=일, 1=월, ..., 6=토)
  const startDow = start.getDay() // 0=일, 1=월, ..., 6=토
  // 월요일 기준: 월요일이면 0 패딩, 화요일이면 1 패딩, ..., 일요일이면 6 패딩
  const padDays = startDow === 0 ? 6 : startDow - 1
  const gridStart = new Date(start)
  gridStart.setDate(gridStart.getDate() - padDays)

  const result = []
  let week = []
  let d = new Date(gridStart)

  while (d <= today || week.length > 0) {
    const dateStr = d.toISOString().slice(0, 10)
    const dow = d.getDay() // 0=일, 1=월, ..., 6=토
    const isInRange = d >= start && d <= today
    const dayData = dayMap.value[dateStr]
    const level = isInRange ? (dayData ? dayData.level : 0) : -1

    week.push({
      key: dateStr,
      dateStr,
      level: Math.max(level, 0),
      visible: isInRange,
      label: isInRange ? formatDate(d) : '',
      dayData
    })

    // 일요일(0)이면 주 마무리 (월~일 = 1~0)
    // 월요일 시작이므로: 월(1), 화(2), 수(3), 목(4), 금(5), 토(6), 일(0) → 7개 채우면 주 완성
    if (week.length === 7) {
      result.push(week)
      week = []
    }

    d = new Date(d)
    d.setDate(d.getDate() + 1)

    if (d > today && week.length === 0) break
    if (d > today && week.length > 0) {
      // 마지막 주 패딩
      while (week.length < 7) {
        week.push({ key: 'pad-' + week.length, dateStr: '', level: 0, visible: false, label: '', dayData: null })
      }
      result.push(week)
      week = []
      break
    }
  }

  return result
})

// 월 라벨: 각 주의 첫 날이 속한 달이 바뀔 때 표시
const monthLabels = computed(() => {
  const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const labels = []
  let lastMonth = -1
  weeks.value.forEach((week, i) => {
    const firstVisible = week.find(c => c.visible)
    if (firstVisible) {
      const m = new Date(firstVisible.dateStr).getMonth()
      if (m !== lastMonth) {
        labels.push({ key: `m-${i}`, col: i + 1, text: MONTHS[m] })
        lastMonth = m
      }
    }
  })
  return labels
})

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tooltipText(cell) {
  if (!cell.visible) return ''
  const d = cell.dayData
  if (!d) return `${cell.label}\n활동 없음`
  const parts = []
  if (d.hasLog) parts.push('📝 학습기록')
  if (d.examCount) parts.push(`📋 시험 ${d.examCount}회`)
  return `${cell.label}\n${parts.join('  ')}`
}
</script>

<style scoped>
.heatmap-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.month-labels {
  display: grid;
  grid-template-columns: repeat(53, 15px);
  gap: 3px;
  padding-left: 24px;
  margin-bottom: 2px;
}
.month-label {
  font-size: 10px;
  color: var(--text-light, #9ca3af);
  white-space: nowrap;
}

.heatmap-grid-outer {
  display: flex;
  gap: 4px;
}

.day-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 0;
  padding-top: 1px;
}
.day-label {
  font-size: 10px;
  color: var(--text-light, #9ca3af);
  height: 15px;
  line-height: 15px;
  /* 월(row1), 수(row3), 금(row5) — 나머지는 공간만 */
}
/* 월요일: row1(index 0), 수요일: row3(index 2), 금요일: row5(index 4) */
.day-labels .day-label:nth-child(1) { margin-top: 0; }
.day-labels .day-label:nth-child(2) { margin-top: 15px; }  /* 화요일 건너뜀 */
.day-labels .day-label:nth-child(3) { margin-top: 15px; }  /* 목요일 건너뜀 */

.weeks-grid {
  display: flex;
  gap: 3px;
}

.week-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: default;
  transition: opacity 0.1s;
}
.heatmap-cell:hover {
  opacity: 0.8;
  outline: 1px solid rgba(0, 0, 0, 0.15);
}

.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  justify-content: flex-end;
}
.legend-text {
  font-size: 11px;
  color: var(--text-light, #9ca3af);
}
.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}
</style>
