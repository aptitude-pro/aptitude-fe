<template>
  <div class="my-results">
    <div class="page-header">
      <h2>내 성적</h2>
      <p>응시 이력과 성장 그래프를 확인하세요</p>
    </div>

    <!-- 성장 그래프 -->
    <div class="card chart-card">
      <div class="card-header">
        <div>
          <div class="chart-tabs">
            <button :class="['chart-tab', { active: chartTab === 'total' }]" @click="chartTab = 'total'">총점 추이</button>
            <button :class="['chart-tab', { active: chartTab === 'category' }]" @click="chartTab = 'category'">분야별 추이</button>
          </div>
          <p>회차별 점수 변화</p>
        </div>
        <div class="filter-group">
          <select v-model="selectedType" class="filter-select">
            <option value="">전체</option>
            <option value="SKCT">SKCT</option>
            <option value="GSAT">GSAT</option>
            <option value="NCS">NCS</option>
          </select>
          <select v-model="selectedYear" class="filter-select">
            <option value="">년도</option>
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}년</option>
          </select>
          <select v-model="selectedPeriod" class="filter-select">
            <option value="">시기</option>
            <option value="상반기">상반기</option>
            <option value="하반기">하반기</option>
          </select>
          <select v-model="selectedPlatform" class="filter-select">
            <option value="">플랫폼</option>
            <option v-for="p in availablePlatforms" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
      </div>

      <!-- 총점 추이 -->
      <div v-if="chartTab === 'total'" class="chart-wrap">
        <template v-if="hasData">
          <ScoreLineChart :data="growthChartData" />
        </template>
        <div v-else class="empty-state">
          <p>성적 데이터가 없습니다</p>
        </div>
      </div>

      <!-- 분야별 추이 -->
      <div v-if="chartTab === 'category'">
        <div class="category-checks">
          <button
            v-for="(cat, idx) in activeCategories"
            :key="cat"
            :class="['cat-pill', { active: selectedCategories.includes(cat) }]"
            :style="selectedCategories.includes(cat) ? { background: CATEGORY_COLORS[idx], borderColor: CATEGORY_COLORS[idx] } : {}"
            @click="toggleCategory(cat)"
          >
            <span class="pill-dot" :style="{ background: selectedCategories.includes(cat) ? '#fff' : CATEGORY_COLORS[idx] }"></span>
            {{ cat }}
          </button>
        </div>
        <div class="chart-wrap">
          <template v-if="hasCategoryData">
            <ScoreLineChart :data="categoryGrowthChartData" :max="20" />
          </template>
          <div v-else class="empty-state"><p>{{ selectedType || 'SKCT' }} 데이터가 없습니다</p></div>
        </div>
      </div>
    </div>

    <!-- 영역별 분석 -->
    <div class="card chart-card">
      <div class="card-header">
        <h3>영역별 분석</h3>
      </div>
      <div class="chart-wrap radar-wrap">
        <template v-if="hasData">
          <CategoryRadarChart :data="radarData" />
        </template>
        <div v-else class="empty-state"><p>데이터 없음</p></div>
      </div>
    </div>

    <!-- 응시 이력 -->
    <div class="card">
      <div class="card-header">
        <h3>응시 이력</h3>
        <span class="total-count">총 {{ filteredResults.length }}회</span>
      </div>
      <div v-if="filteredResults.length === 0" class="empty-state">
        <p>응시 이력이 없습니다</p>
        <router-link to="/exam" class="btn-primary" style="font-size:13px;padding:8px 16px;border-radius:8px;margin-top:8px;">
          첫 시험 응시하기
        </router-link>
      </div>
      <div v-else class="result-table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>시험명</th>
              <th>유형</th>
              <th>년도</th>
              <th>시기</th>
              <th>플랫폼</th>
              <th>점수</th>
              <th>응시일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filteredResults" :key="r.id">
              <td class="name-cell">{{ r.examTitle || r.examType }}</td>
              <td><span :class="['type-badge', r.examType]">{{ r.examType }}</span></td>
              <td class="meta-cell">{{ r.examYear || '-' }}</td>
              <td class="meta-cell">{{ r.examPeriod || '-' }}</td>
              <td class="meta-cell">{{ r.platform || '-' }}</td>
              <td>
                <span :class="['score-val', scoreClass(r.totalScore)]">{{ r.totalScore }}점</span>
              </td>
              <td class="date-cell">{{ formatDate(r.finishedAt || r.createdAt) }}</td>
              <td>
                <router-link :to="`/results/${r.id}`" class="view-btn">상세 →</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useResultStore } from '@/stores/result'
import ScoreLineChart from '@/components/dashboard/ScoreLineChart.vue'
import CategoryRadarChart from '@/components/dashboard/CategoryRadarChart.vue'

const resultStore = useResultStore()
const selectedType = ref('')
const selectedYear = ref('')
const selectedPeriod = ref('')
const selectedPlatform = ref('')
const chartTab = ref('total')

const EXAM_CATEGORIES = {
  SKCT: ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리'],
  GSAT: ['수리논리', '추리'],
  NCS: []
}
const SKCT_CATEGORIES = EXAM_CATEGORIES.SKCT
const CATEGORY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

const activeCategories = computed(() => EXAM_CATEGORIES[selectedType.value] || SKCT_CATEGORIES)
const selectedCategories = ref([...SKCT_CATEGORIES])

onMounted(async () => {
  await Promise.all([
    resultStore.fetchResults(),
    resultStore.fetchGrowthData(),
    resultStore.fetchCategoryData()
  ])
})

watch(selectedType, (type) => {
  resultStore.fetchGrowthData(type)
  selectedCategories.value = [...(EXAM_CATEGORIES[type] || SKCT_CATEGORIES)]
})

const results = computed(() => resultStore.results)

const availableYears = computed(() => {
  const years = [...new Set(results.value.map(r => r.examYear).filter(Boolean))]
  return years.sort((a, b) => b - a)
})

const availablePlatforms = computed(() => {
  return [...new Set(results.value.map(r => r.platform).filter(Boolean))]
})

const filteredResults = computed(() => {
  return results.value.filter(r => {
    if (selectedType.value && r.examType !== selectedType.value) return false
    if (selectedYear.value && r.examYear !== selectedYear.value) return false
    if (selectedPeriod.value && r.examPeriod !== selectedPeriod.value) return false
    if (selectedPlatform.value && r.platform !== selectedPlatform.value) return false
    return true
  })
})

const hasData = computed(() => results.value.length > 0)

const hasCategoryData = computed(() => {
  const data = resultStore.growthData || []
  return data.some(d => d.categoryScores && Object.keys(d.categoryScores).length > 0)
})

const categoryGrowthChartData = computed(() => {
  const data = resultStore.growthData || []
  const labels = data.map((_, i) => `#${i + 1}`)
  const cats = activeCategories.value
  const datasets = cats
    .filter(c => selectedCategories.value.includes(c))
    .map((cat) => ({
      label: cat,
      data: data.map(d => d.categoryScores?.[cat] ?? null),
      borderColor: CATEGORY_COLORS[cats.indexOf(cat)],
      backgroundColor: CATEGORY_COLORS[cats.indexOf(cat)] + '20',
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      spanGaps: true
    }))
  return { labels, datasets }
})

const growthChartData = computed(() => {
  const data = resultStore.growthData || []
  return {
    labels: data.map((d, i) => `#${i + 1}`),
    datasets: [{
      label: '점수',
      data: data.map(d => d.score),
      borderColor: '#111827',
      backgroundColor: 'rgba(17,24,39,0.07)',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: '#111827'
    }]
  }
})

const radarData = computed(() => {
  const data = resultStore.categoryData || {}
  return {
    labels: Object.keys(data),
    datasets: [{
      label: '점수',
      data: Object.values(data),
      backgroundColor: 'rgba(17,24,39,0.1)',
      borderColor: '#111827',
      pointBackgroundColor: '#111827'
    }]
  }
})

function toggleCategory(cat) {
  const idx = selectedCategories.value.indexOf(cat)
  if (idx >= 0) {
    if (selectedCategories.value.length > 1) selectedCategories.value.splice(idx, 1)
  } else {
    selectedCategories.value.push(cat)
  }
}

function scoreClass(score) {
  if (score >= 400) return 'high'
  if (score >= 300) return 'mid'
  return 'low'
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.my-results { max-width: 900px; display: flex; flex-direction: column; gap: 20px; }
.page-header { margin-bottom: 4px; }
.page-header h2 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.page-header p { color: var(--text-muted); font-size: 14px; }

.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-header h3 { font-size: 15px; font-weight: 600; }
.card-header p { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.chart-wrap { min-height: 200px; display: flex; align-items: center; justify-content: center; }
.radar-wrap { max-height: 240px; }

.chart-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}
.chart-tab {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  transition: all 0.15s;
}
.chart-tab.active { background: #1f2937; color: #fff; }
.chart-tab:hover:not(.active) { background: var(--bg); }

.category-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0 8px;
}

.cat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px 5px 10px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: #fff;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.cat-pill:hover { border-color: #9ca3af; color: var(--text); }
.cat-pill.active { color: #fff; font-weight: 600; }

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.filter-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-select {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 13px;
  background: var(--bg);
  outline: none;
}

.total-count {
  font-size: 13px;
  color: var(--text-muted);
  align-self: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px;
  color: var(--text-light);
}

.result-table-wrap { overflow-x: auto; }
.result-table {
  width: 100%;
  border-collapse: collapse;
}
.result-table th {
  padding: 8px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.result-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f9fafb;
  font-size: 13px;
}
.name-cell { font-weight: 500; }
.type-badge {
  font-size: 11px;
  background: #f3f4f6;
  color: var(--text-muted);
  padding: 2px 7px;
  border-radius: 4px;
}
.type-badge.SKCT { background: #dbeafe; color: #1d4ed8; }
.type-badge.GSAT { background: #fef3c7; color: #92400e; }
.type-badge.NCS  { background: #d1fae5; color: #065f46; }
.score-val { font-weight: 700; font-size: 14px; }
.score-val.high { color: var(--success); }
.score-val.mid { color: var(--warning); }
.score-val.low { color: var(--danger); }
.date-cell { color: var(--text-muted); }
.meta-cell { color: var(--text-muted); font-size: 12px; }
.view-btn {
  font-size: 12px;
  color: var(--primary);
  font-weight: 500;
}
</style>
