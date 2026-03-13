<template>
  <div class="dashboard">
    <div class="welcome">
      <h2>안녕하세요, {{ auth.user?.nickname }}님! 👋</h2>
      <p>오늘도 목표를 향해 한 걸음 더 나아가세요</p>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statCards" :key="stat.label">
        <div class="stat-card-top">
          <div class="stat-icon">
            <span v-html="stat.icon"></span>
          </div>
          <span class="stat-badge">{{ stat.badge }}</span>
        </div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 차트 영역 -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h3>점수 추이</h3>
            <p>시간에 따른 점수 변화를 확인하세요</p>
          </div>
          <div class="chart-tabs">
            <button :class="['tab', { active: chartTab === 'all' }]" @click="chartTab = 'all'">전체</button>
            <button :class="['tab', { active: chartTab === 'recent' }]" @click="chartTab = 'recent'">최근</button>
            <button :class="['tab', { active: chartTab === 'category' }]" @click="chartTab = 'category'">영역별</button>
          </div>
        </div>
        <div class="chart-body">
          <template v-if="chartTab === 'category'">
            <div v-if="hasData" style="width:100%">
              <div class="category-checks">
                <label v-for="(cat, idx) in SKCT_CATEGORIES" :key="cat" class="check-label">
                  <input type="checkbox" :value="cat" v-model="selectedCategories" />
                  <span class="check-dot" :style="{ background: CATEGORY_COLORS[idx] }"></span>
                  {{ cat }}
                </label>
              </div>
              <ScoreLineChart :data="categoryGrowthChartData" :max="20" />
            </div>
            <div v-else class="empty-state">
              <p>아직 시험 기록이 없습니다</p>
            </div>
          </template>
          <template v-else-if="hasData">
            <ScoreLineChart :data="growthChartData" />
          </template>
          <div v-else class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>아직 시험 기록이 없습니다</p>
            <span>첫 시험을 응시하고 성장을 시작하세요!</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h3>영역별 분석</h3>
            <p>최근 성적 분포</p>
          </div>
        </div>
        <div class="chart-body">
          <template v-if="hasData">
            <CategoryRadarChart :data="radarChartData" />
          </template>
          <div v-else class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            <p>분석할 데이터가 없습니다</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 최근 응시 기록 & 영역별 점수 -->
    <div class="bottom-grid">
      <div class="card">
        <div class="card-header">
          <h3>최근 응시 기록</h3>
          <router-link to="/my/results" class="link-more">전체 보기 →</router-link>
        </div>
        <div v-if="recentResults.length === 0" class="empty-state small">
          <p>응시 기록이 없습니다</p>
        </div>
        <div v-else class="result-list">
          <div class="result-item" v-for="r in recentResults" :key="r.id">
            <div class="result-info">
              <span class="result-type">{{ r.examType }}</span>
              <span class="result-name">{{ r.examTitle }}</span>
            </div>
            <div class="result-score" :class="scoreClass(r.totalScore)">
              {{ r.totalScore }}점
            </div>
            <div class="result-date">{{ formatDate(r.createdAt) }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>영역별 점수</h3>
        </div>
        <div v-if="!categoryData" class="empty-state small">
          <p>데이터가 없습니다</p>
        </div>
        <div v-else class="category-bars">
          <div class="category-item" v-for="cat in categoryBars" :key="cat.name">
            <div class="cat-label">{{ cat.name }}</div>
            <div class="cat-bar-wrap">
              <div class="cat-bar" :style="{ width: (cat.rate / 20 * 100).toFixed(1) + '%', background: cat.color }"></div>
            </div>
            <div class="cat-rate">{{ cat.rate }}점</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useResultStore } from '@/stores/result'
import ScoreLineChart from '@/components/dashboard/ScoreLineChart.vue'
import CategoryRadarChart from '@/components/dashboard/CategoryRadarChart.vue'

const auth = useAuthStore()
const resultStore = useResultStore()
const chartTab = ref('all')

const SKCT_CATEGORIES = ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리']
const CATEGORY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
const selectedCategories = ref([...SKCT_CATEGORIES])

onMounted(async () => {
  await Promise.all([
    resultStore.fetchStats(),
    resultStore.fetchResults(),
    resultStore.fetchGrowthData(),
    resultStore.fetchCategoryData()
  ])
})

const statCards = computed(() => [
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    badge: '누적',
    value: resultStore.stats.totalCount,
    label: '총 응시 횟수'
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>`,
    badge: '-',
    value: resultStore.stats.avgScore || 0,
    label: '평균 점수'
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
    badge: '최고',
    value: resultStore.stats.maxScore || 0,
    label: '최고 점수'
  },
])

const hasData = computed(() => resultStore.results.length > 0)
const recentResults = computed(() => resultStore.results.slice(0, 5))
const categoryData = computed(() => resultStore.categoryData)

const growthChartData = computed(() => {
  const data = resultStore.growthData || []
  return {
    labels: data.map(d => d.date || d.label),
    datasets: [{
      label: '점수',
      data: data.map(d => d.score),
      borderColor: '#111827',
      backgroundColor: 'rgba(17,24,39,0.08)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#111827'
    }]
  }
})

const categoryGrowthChartData = computed(() => {
  const data = resultStore.growthData || []
  const labels = data.map((_, i) => `#${i + 1}`)
  const datasets = SKCT_CATEGORIES
    .filter(c => selectedCategories.value.includes(c))
    .map(cat => ({
      label: cat,
      data: data.map(d => d.categoryScores?.[cat] ?? null),
      borderColor: CATEGORY_COLORS[SKCT_CATEGORIES.indexOf(cat)],
      backgroundColor: CATEGORY_COLORS[SKCT_CATEGORIES.indexOf(cat)] + '20',
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      spanGaps: true
    }))
  return { labels, datasets }
})

const radarChartData = computed(() => {
  const data = resultStore.categoryData || {}
  const labels = Object.keys(data)
  const values = Object.values(data)
  return {
    labels,
    datasets: [{
      label: '점수',
      data: values,
      backgroundColor: 'rgba(17,24,39,0.1)',
      borderColor: '#111827',
      pointBackgroundColor: '#111827',
      pointRadius: 4
    }]
  }
})

const categoryBars = computed(() => {
  const data = resultStore.categoryData || {}
  const colors = ['#111827', '#374151', '#6b7280', '#9ca3af']
  return Object.entries(data).map(([name, rate], i) => ({
    name, rate, color: colors[i % colors.length]
  }))
})

function scoreClass(score) {
  if (score >= 400) return 'score-high'
  if (score >= 300) return 'score-mid'
  return 'score-low'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.dashboard { max-width: 1100px; }

.welcome { margin-bottom: 24px; }
.welcome h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.welcome p { color: var(--text-muted); font-size: 14px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow);
}
.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.stat-icon {
  width: 36px;
  height: 36px;
  background: var(--bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
.stat-badge {
  font-size: 11px;
  color: var(--text-light);
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px;
  color: var(--text-muted);
}

.charts-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}
.chart-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.chart-card-header h3 { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.chart-card-header p { font-size: 12px; color: var(--text-muted); }
.chart-body { min-height: 200px; display: flex; align-items: center; justify-content: center; }

.chart-tabs { display: flex; gap: 4px; }
.tab {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid transparent;
}
.tab.active {
  background: var(--primary);
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  width: 100%;
  color: var(--text-light);
}
.empty-state p { font-size: 14px; font-weight: 500; }
.empty-state span { font-size: 12px; }
.empty-state.small { padding: 30px 0; }

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-header h3 { font-size: 15px; font-weight: 600; }
.link-more { font-size: 12px; color: var(--text-muted); }
.link-more:hover { color: var(--primary); }

.result-list { display: flex; flex-direction: column; gap: 8px; }
.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--bg);
}
.result-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.result-type {
  font-size: 11px;
  background: #f3f4f6;
  color: var(--text-muted);
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
}
.result-name { font-size: 13px; font-weight: 500; }
.result-score { font-size: 15px; font-weight: 700; }
.score-high { color: var(--success); }
.score-mid { color: var(--warning); }
.score-low { color: var(--danger); }
.result-date { font-size: 12px; color: var(--text-light); white-space: nowrap; }

.category-bars { display: flex; flex-direction: column; gap: 12px; }
.category-item { display: flex; align-items: center; gap: 10px; }
.cat-label { font-size: 13px; width: 70px; flex-shrink: 0; }
.cat-bar-wrap {
  flex: 1;
  height: 8px;
  background: var(--bg);
  border-radius: 4px;
  overflow: hidden;
}
.cat-bar { height: 100%; border-radius: 4px; transition: width 0.6s; }
.cat-rate { font-size: 12px; font-weight: 600; width: 36px; text-align: right; }

.category-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 0 12px;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text);
}
.check-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid, .bottom-grid { grid-template-columns: 1fr; }
}
</style>
