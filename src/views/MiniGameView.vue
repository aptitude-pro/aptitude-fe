<template>
  <div class="minigame-page">

    <!-- 헤더 -->
    <div class="game-header">
      <div class="header-left">
        <h2 class="game-title">⚡ 자료해석 미니게임</h2>
        <span v-if="state === 'playing'" class="combo-badge" :class="{ active: combo >= 3 }">
          🔥 {{ combo }}콤보
        </span>
      </div>
      <div class="header-right" v-if="state === 'playing'">
        <div class="timer-display" :class="{ warn: timeLeft <= 15, danger: timeLeft <= 5 }">
          ⏱ {{ String(Math.floor(timeLeft / 60)).padStart(2, '0') }}:{{ String(timeLeft % 60).padStart(2, '0') }}
        </div>
        <div class="score-display">{{ score }}점</div>
        <div class="count-display">{{ correct }}/{{ total }} 정답</div>
      </div>
    </div>

    <!-- IDLE: 시작 화면 -->
    <div v-if="state === 'idle'" class="idle-screen">
      <div class="idle-card">
        <div class="idle-icon">📊</div>
        <h3>자료해석 미니게임</h3>
        <p>60초 안에 표를 보고 계산 문제를 최대한 많이 맞히세요!</p>
        <ul class="rule-list">
          <li>정답 1개당 <strong>10점</strong></li>
          <li>3연속 정답 시 콤보 보너스 <strong>+5점</strong></li>
          <li>오답 시 콤보 리셋</li>
          <li>숫자 범위: 2~8자리</li>
        </ul>
        <button class="btn-start" @click="startGame">게임 시작</button>
        <button class="btn-ranking" @click="openRanking">🏆 전국 랭킹 보기</button>
      </div>
    </div>

    <!-- PLAYING: 게임 화면 -->
    <div v-else-if="state === 'playing'" class="game-screen">
      <div class="game-left">
        <GameTable :table="table" :highlights="[]" />
        <div class="question-section">
          <GameQuestion
            v-if="question"
            :key="questionKey"
            :question="question"
            :question-no="total + 1"
            @answer="onAnswer"
          />
        </div>
      </div>
      <div class="game-right">
        <div class="memo-section">
          <div class="memo-header">
            <span class="panel-label">✏️ 메모</span>
            <button class="btn-clear-memo" @click="memoText = ''" title="지우기">✕</button>
          </div>
          <textarea
            v-model="memoText"
            class="memo-textarea"
            placeholder="여기에 메모를 입력하세요..."
            spellcheck="false"
          />
        </div>
        <div class="calc-section">
          <div class="panel-label">🔢 계산기</div>
          <Calculator />
        </div>
      </div>
    </div>

    <!-- RESULT: 결과 화면 -->
    <div v-else-if="state === 'result'" class="result-screen">
      <div class="result-card">
        <div class="result-score-area">
          <div class="result-label">최종 점수</div>
          <div class="result-score">{{ score }}점</div>
          <div class="result-sub">{{ correct }} / {{ total }} 정답</div>
          <div v-if="isNewLocalBest" class="new-best-badge">🎉 개인 최고 기록!</div>
        </div>

        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">정답률</span>
            <span class="stat-value">{{ total > 0 ? Math.round(correct / total * 100) : 0 }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">개인 최고</span>
            <span class="stat-value">{{ localBest }}점</span>
          </div>
          <div v-if="myRank" class="stat-item">
            <span class="stat-label">전국 순위</span>
            <span class="stat-value rank-val">{{ myRank }}위</span>
          </div>
        </div>

        <div v-if="!authStore.isLoggedIn" class="login-prompt">
          <p>로그인하면 점수를 저장하고 전국 랭킹에 등록할 수 있어요!</p>
          <button class="btn-login" @click="authStore.openModal('login')">로그인하여 저장</button>
        </div>

        <!-- 전국 랭킹 -->
        <div class="ranking-section">
          <div class="ranking-header">
            <span>🏆 전국 랭킹 TOP 50</span>
            <button class="btn-refresh" @click="loadRanking">↺ 새로고침</button>
          </div>
          <div v-if="rankingLoading" class="ranking-loading">불러오는 중...</div>
          <div v-else-if="ranking.length === 0" class="ranking-empty">아직 랭킹이 없어요. 첫 번째 도전자가 되세요!</div>
          <div v-else class="ranking-list">
            <div
              v-for="(entry, i) in ranking"
              :key="entry.userId"
              :class="['ranking-row', { 'my-row': entry.isMe }]"
            >
              <span class="rank-no" :class="rankClass(i + 1)">{{ i + 1 }}</span>
              <span class="rank-nick">{{ entry.nickname }}</span>
              <span class="rank-score">{{ entry.bestScore.toLocaleString('ko-KR') }}점</span>
              <span class="rank-date">{{ fmtDate(entry.achievedAt) }}</span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn-retry" @click="startGame">다시 하기</button>
          <button class="btn-home" @click="state = 'idle'">처음으로</button>
        </div>
      </div>
    </div>

    <!-- 전국 랭킹 모달 (idle 화면에서) -->
    <div v-if="showRankingModal" class="modal-overlay" @click.self="showRankingModal = false">
      <div class="rank-modal">
        <div class="rank-modal-header">
          <span>🏆 전국 랭킹 TOP 50</span>
          <button @click="showRankingModal = false">✕</button>
        </div>
        <div v-if="rankingLoading" class="ranking-loading">불러오는 중...</div>
        <div v-else-if="ranking.length === 0" class="ranking-empty">아직 랭킹이 없어요!</div>
        <div v-else class="ranking-list">
          <div v-for="(entry, i) in ranking" :key="entry.userId" :class="['ranking-row', { 'my-row': entry.isMe }]">
            <span class="rank-no" :class="rankClass(i + 1)">{{ i + 1 }}</span>
            <span class="rank-nick">{{ entry.nickname }}</span>
            <span class="rank-score">{{ entry.bestScore.toLocaleString('ko-KR') }}점</span>
            <span class="rank-date">{{ fmtDate(entry.achievedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { generateTable, generateQuestion } from '@/utils/tableGenerator'
import { useMiniGameStore } from '@/stores/miniGame'
import { useAuthStore } from '@/stores/auth'
import GameTable from '@/components/minigame/GameTable.vue'
import GameQuestion from '@/components/minigame/GameQuestion.vue'
import Calculator from '@/components/exam/Calculator.vue'

const GAME_SECONDS = 60
const BASE_SCORE = 10
const COMBO_THRESHOLD = 3
const COMBO_BONUS = 5

const memoText = ref('')
const isNewLocalBest = ref(false)
const state = ref('idle')  // 'idle' | 'playing' | 'result'
const table = ref(null)
const question = ref(null)
const questionKey = ref(0)

const score = ref(0)
const correct = ref(0)
const total = ref(0)
const combo = ref(0)
const timeLeft = ref(GAME_SECONDS)
const myRank = ref(null)

const ranking = ref([])
const rankingLoading = ref(false)
const showRankingModal = ref(false)

const miniGameStore = useMiniGameStore()
const authStore = useAuthStore()

// 개인 최고점 (localStorage)
const LOCAL_KEY = 'miniGameBest'
const localBest = ref(parseInt(localStorage.getItem(LOCAL_KEY) || '0', 10))

let timer = null

function startGame() {
  score.value = 0
  correct.value = 0
  total.value = 0
  combo.value = 0
  timeLeft.value = GAME_SECONDS
  myRank.value = null
  isNewLocalBest.value = false
  table.value = generateTable()
  nextQuestion()
  state.value = 'playing'
  timer = setInterval(tick, 1000)
}

function tick() {
  timeLeft.value--
  if (timeLeft.value <= 0) {
    clearInterval(timer)
    endGame()
  }
}

function nextQuestion() {
  question.value = generateQuestion(table.value)
  questionKey.value++
}

function onAnswer({ isCorrect }) {
  total.value++
  if (isCorrect) {
    combo.value++
    const bonus = combo.value >= COMBO_THRESHOLD ? COMBO_BONUS * (combo.value - COMBO_THRESHOLD + 1) : 0
    score.value += BASE_SCORE + bonus
    correct.value++
  } else {
    combo.value = 0
  }
  nextQuestion()
}

async function endGame() {
  state.value = 'result'

  // 개인 최고점 갱신
  if (score.value > localBest.value) {
    isNewLocalBest.value = true
    localBest.value = score.value
    localStorage.setItem(LOCAL_KEY, String(score.value))
  }

  // 랭킹 조회
  await loadRanking()

  // 점수 서버 제출 (로그인 시)
  if (authStore.isLoggedIn) {
    const res = await miniGameStore.submitScore(score.value, correct.value, total.value)
    if (res.success) {
      myRank.value = res.rank
      // 랭킹 재로드
      await loadRanking()
    }
  }
}

async function loadRanking() {
  rankingLoading.value = true
  const res = await miniGameStore.fetchRanking()
  rankingLoading.value = false
  if (res.success) {
    const myId = authStore.user?.id
    ranking.value = res.ranking.map(r => ({
      ...r,
      isMe: r.userId === myId
    }))
  }
}

async function openRanking() {
  showRankingModal.value = true
  await loadRanking()
}

function rankClass(rank) {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return ''
}

function fmtDate(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.minigame-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 헤더 */
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.header-left { display: flex; align-items: center; gap: 14px; }
.header-right { display: flex; align-items: center; gap: 20px; }

.game-title { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0; }

.combo-badge {
  font-size: 13px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  transition: all 0.2s;
}
.combo-badge.active { background: #fef3c7; color: #92400e; }

.timer-display {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
}
.timer-display.warn   { color: #f59e0b; }
.timer-display.danger { color: #ef4444; animation: pulse 0.5s infinite; }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }

.score-display  { font-size: 18px; font-weight: 700; color: #4f46e5; }
.count-display  { font-size: 13px; color: #6b7280; }

/* IDLE */
.idle-screen {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.idle-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 56px;
  text-align: center;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  max-width: 420px;
  width: 100%;
}
.idle-icon { font-size: 56px; margin-bottom: 16px; }
.idle-card h3 { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: #1f2937; }
.idle-card > p { font-size: 14px; color: #6b7280; margin-bottom: 20px; line-height: 1.6; }

.rule-list {
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.rule-list li {
  font-size: 13px;
  color: #374151;
  padding: 8px 14px;
  background: #f9fafb;
  border-radius: 8px;
}
.rule-list strong { color: #4f46e5; }

.btn-start {
  width: 100%;
  padding: 14px;
  background: #4f46e5;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  border-radius: 12px;
  margin-bottom: 10px;
  transition: background 0.15s;
}
.btn-start:hover { background: #4338ca; }

.btn-ranking {
  width: 100%;
  padding: 11px;
  background: #f3f4f6;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  transition: background 0.15s;
}
.btn-ranking:hover { background: #e5e7eb; }

/* PLAYING */
.game-screen {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  align-items: start;
}

.game-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.game-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memo-section, .calc-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 8px 12px 0;
}

.memo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 0;
}
.memo-header .panel-label { padding: 0; }
.btn-clear-memo {
  font-size: 11px;
  color: #9ca3af;
  padding: 2px 6px;
  border-radius: 4px;
}
.btn-clear-memo:hover { color: #ef4444; background: #fef2f2; }
.memo-textarea {
  flex: 1;
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  border: none;
  outline: none;
  background: #fff;
  color: #1f2937;
  font-family: inherit;
  min-height: 160px;
  box-sizing: border-box;
}

/* RESULT */
.result-screen {
  display: flex;
  justify-content: center;
}
.result-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-score-area { text-align: center; }
.result-label { font-size: 14px; color: #6b7280; margin-bottom: 4px; }
.result-score { font-size: 56px; font-weight: 800; color: #4f46e5; line-height: 1; }
.result-sub { font-size: 15px; color: #6b7280; margin-top: 6px; }
.new-best-badge {
  display: inline-block;
  margin-top: 10px;
  padding: 5px 14px;
  background: #fef3c7;
  color: #92400e;
  font-size: 13px;
  font-weight: 700;
  border-radius: 999px;
}

.result-stats {
  display: flex;
  gap: 12px;
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
}
.stat-label { font-size: 12px; color: #6b7280; }
.stat-value { font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 2px; }
.rank-val { color: #f59e0b; }

.login-prompt {
  padding: 14px;
  background: #eef2ff;
  border-radius: 10px;
  text-align: center;
}
.login-prompt p { font-size: 13px; color: #4338ca; margin-bottom: 10px; }
.btn-login {
  padding: 8px 20px;
  background: #4f46e5;
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

/* 랭킹 */
.ranking-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.ranking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f3f4f6;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}
.btn-refresh { font-size: 13px; color: #6b7280; }
.btn-refresh:hover { color: #4f46e5; }
.ranking-loading, .ranking-empty {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}
.ranking-list { max-height: 280px; overflow-y: auto; }
.ranking-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
}
.ranking-row:last-child { border-bottom: none; }
.ranking-row.my-row { background: #eef2ff; }
.rank-no {
  width: 28px;
  text-align: center;
  font-weight: 700;
  color: #6b7280;
  font-size: 13px;
}
.rank-no.gold   { color: #f59e0b; font-size: 16px; }
.rank-no.silver { color: #9ca3af; font-size: 15px; }
.rank-no.bronze { color: #cd7c4a; font-size: 14px; }
.rank-nick { flex: 1; color: #1f2937; font-weight: 500; }
.rank-score { font-weight: 700; color: #4f46e5; }
.rank-date { font-size: 11px; color: #9ca3af; margin-left: 8px; }

.result-actions { display: flex; gap: 10px; }
.btn-retry {
  flex: 1;
  padding: 12px;
  background: #4f46e5;
  color: #fff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.15s;
}
.btn-retry:hover { background: #4338ca; }
.btn-home {
  flex: 1;
  padding: 12px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}
.btn-home:hover { background: #e5e7eb; }

/* 랭킹 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}
.rank-modal {
  background: #fff;
  border-radius: 16px;
  width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.rank-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f3f4f6;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  flex-shrink: 0;
}
.rank-modal-header button { color: #6b7280; font-size: 16px; }
.rank-modal .ranking-list { overflow-y: auto; flex: 1; }
</style>
