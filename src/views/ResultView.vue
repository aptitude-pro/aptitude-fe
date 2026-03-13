<template>
  <div class="result-view">
    <div class="page-header">
      <router-link to="/my/results" class="back-btn">← 목록으로</router-link>
      <h2>결과 확인</h2>
    </div>

    <div v-if="loading" class="loading">결과를 불러오는 중...</div>

    <template v-else>
      <!-- 요약 카드 -->
      <div class="summary-grid">
        <div class="summary-card highlight">
          <div class="sum-label">최종 점수</div>
          <div class="sum-score" :class="scoreClass(result?.totalScore)">
            {{ result?.totalScore || 0 }}<span>점</span>
          </div>
          <div class="sum-sub">{{ result?.examTitle || result?.examType }}</div>
        </div>
        <div class="summary-card">
          <div class="sum-label">정답 수</div>
          <div class="sum-val">{{ result?.correctCount || 0 }}</div>
          <div class="sum-sub">/ {{ result?.totalCount || questionCount }}문항</div>
        </div>
        <div class="summary-card">
          <div class="sum-label">소요 시간</div>
          <div class="sum-val">{{ elapsedTime }}</div>
          <div class="sum-sub">분:초</div>
        </div>
      </div>

      <!-- 영역별 분석 -->
      <div class="section-grid">
        <div class="card">
          <h3>영역별 점수</h3>
          <div class="category-bars">
            <div v-for="cat in categoryBars" :key="cat.name" class="cat-row">
              <span class="cat-name">{{ cat.name }}</span>
              <div class="bar-wrap">
                <div class="bar-fill" :style="{ width: (cat.rate / 20 * 100).toFixed(1) + '%', background: cat.color }"></div>
              </div>
              <span class="cat-pct">{{ cat.rate }}점</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>레이더 분석</h3>
          <div style="height: 200px;">
            <CategoryRadarChart v-if="radarData" :data="radarData" />
          </div>
        </div>
      </div>

      <!-- 문항별 정오답 -->
      <div class="card">
        <h3>문항별 정오답</h3>
        <div class="answer-grid">
          <div
            v-for="item in answerItems"
            :key="item.questionNo"
            :class="['answer-item', item.isCorrect ? 'correct' : 'wrong']"
          >
            <span class="q-no">{{ item.questionNo }}</span>
            <span :class="['q-mark', item.isCorrect ? 'o' : 'x']">
              {{ item.isCorrect ? '○' : '✗' }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useResultStore } from '@/stores/result'
import CategoryRadarChart from '@/components/dashboard/CategoryRadarChart.vue'

const route = useRoute()
const resultStore = useResultStore()
const loading = ref(true)
const result = ref(null)

const questionCount = parseInt(route.query.questionCount) || 40

onMounted(async () => {
  const id = route.params.id
  if (id === 'local') {
    if (route.query.categoryScores) {
      const catScores = JSON.parse(route.query.categoryScores)
      const values = Object.values(catScores)
      const total = values.reduce((a, b) => a + b, 0)
      result.value = {
        totalScore: total,
        correctCount: 0,
        totalCount: 0,
        examTitle: route.query.examName || 'SKCT',
        categoryScores: catScores,
        answers: []
      }
    }
    loading.value = false
    return
  }
  await resultStore.fetchResult(id)
  result.value = resultStore.currentResult
  loading.value = false
})

const elapsedTime = computed(() => {
  if (!result.value?.elapsedSeconds) return '--:--'
  const m = Math.floor(result.value.elapsedSeconds / 60)
  const s = result.value.elapsedSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function scoreClass(score) {
  if (!score) return ''
  if (score >= 400) return 'high'
  if (score >= 300) return 'mid'
  return 'low'
}

const categoryBars = computed(() => {
  const data = result.value?.categoryScores || {}
  const colors = ['#111827', '#374151', '#6b7280', '#9ca3af']
  return Object.entries(data).map(([name, rate], i) => ({
    name, rate, color: colors[i % colors.length]
  }))
})

const radarData = computed(() => {
  const data = result.value?.categoryScores
  if (!data) return null
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

const answerItems = computed(() => {
  if (!result.value?.answers) return []
  return result.value.answers.map(a => ({
    questionNo: a.questionNo,
    isCorrect: a.selectedAnswer === a.correctAnswer,
    selected: a.selectedAnswer,
    correct: a.correctAnswer
  }))
})
</script>

<style scoped>
.result-view { max-width: 900px; display: flex; flex-direction: column; gap: 20px; }

.page-header { display: flex; align-items: center; gap: 12px; }
.back-btn { font-size: 13px; color: var(--text-muted); }
.back-btn:hover { color: var(--primary); }
.page-header h2 { font-size: 22px; font-weight: 700; }

.loading { padding: 40px; text-align: center; color: var(--text-muted); }

.summary-grid {
  display: grid;
  grid-template-columns: 1.5fr repeat(2, 1fr);
  gap: 16px;
}
.summary-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
}
.summary-card.highlight { border-color: var(--primary); }
.sum-label { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.sum-score { font-size: 40px; font-weight: 800; line-height: 1; }
.sum-score span { font-size: 18px; font-weight: 500; }
.sum-score.high { color: var(--success); }
.sum-score.mid { color: var(--warning); }
.sum-score.low { color: var(--danger); }
.sum-val { font-size: 28px; font-weight: 700; }
.sum-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.card h3 { font-size: 15px; font-weight: 600; margin-bottom: 16px; }

.category-bars { display: flex; flex-direction: column; gap: 12px; }
.cat-row { display: flex; align-items: center; gap: 10px; }
.cat-name { font-size: 13px; width: 60px; flex-shrink: 0; }
.bar-wrap { flex: 1; height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s; }
.cat-pct { font-size: 12px; font-weight: 600; width: 36px; text-align: right; }

.answer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
}
.answer-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1px solid;
  gap: 4px;
}
.answer-item.correct { background: #f0fdf4; border-color: #86efac; }
.answer-item.wrong { background: #fff1f2; border-color: #fca5a5; }
.q-no { font-size: 11px; color: var(--text-muted); }
.q-mark { font-size: 16px; font-weight: 700; }
.q-mark.o { color: var(--success); }
.q-mark.x { color: var(--danger); }

@media (max-width: 700px) {
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .section-grid { grid-template-columns: 1fr; }
}
</style>
