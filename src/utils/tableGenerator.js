// 자료해석 미니게임 - 랜덤 표 + 문제 생성

const ROW_LABELS = ['A 항목', 'B 항목', 'C 항목', 'D 항목', 'E 항목']
const COL_LABELS = ['2020년', '2021년', '2022년', '2023년']
const ROWS = 5
const COLS = 4

/**
 * 2~8자리 숫자 범위에서 magnitude(단위 크기) 결정
 * 자릿수별 예시: 2→10, 3→100, ..., 8→10,000,000
 */
function pickMagnitude() {
  const digits = 2 + Math.floor(Math.random() * 7) // 2~8
  return Math.pow(10, digits - 1)
}

/**
 * magnitude × (1.0 ~ 2.9) 범위, 100의 배수로 반올림
 * magnitude가 10 이하면 1의 배수
 */
function randCell(magnitude) {
  const raw = magnitude * (1 + Math.random() * 1.9)
  if (magnitude >= 100) return Math.round(raw / 100) * 100
  if (magnitude >= 10)  return Math.round(raw / 10) * 10
  // magnitude = 1: 소수 1자리 허용
  return Math.round(raw * 10) / 10
}

/**
 * 랜덤 표 생성
 * @returns {{ rows: string[], cols: string[], data: number[][] }}
 */
export function generateTable() {
  const magnitude = pickMagnitude()
  const data = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => randCell(magnitude))
  )
  return { rows: [...ROW_LABELS], cols: [...COL_LABELS], data }
}

/**
 * 정답과 오답 3개 생성 (4지선다)
 * 오답은 정답과 ±15~45% 차이나는 값으로 생성
 * @param {number} answer - 정수 또는 소수
 * @param {boolean} isPercent - 퍼센트 형식 여부
 * @returns {Array<{value: number, label: string}>}
 */
function buildChoices(answer, isPercent) {
  const isDecimal = !isPercent && !Number.isInteger(answer)
  const useDecimalRound = isPercent || isDecimal
  const choices = [answer]
  const minGap = isPercent
    ? 1.5
    : isDecimal
      ? Math.max(0.2, Math.abs(answer) * 0.12)
      : Math.max(1, Math.abs(answer) * 0.15)
  let attempts = 0
  while (choices.length < 4 && attempts < 200) {
    attempts++
    const sign = Math.random() < 0.5 ? 1 : -1
    const gap = isPercent
      ? (1.5 + Math.random() * 8) * sign
      : answer * (0.15 + Math.random() * 0.30) * sign
    const candidate = useDecimalRound
      ? Math.round((answer + gap) * 10) / 10
      : Math.round(answer + gap)
    if (candidate <= 0 && !isPercent && !isDecimal) continue
    if (Math.abs(candidate - answer) < minGap) continue
    if (choices.some(c => Math.abs(c - candidate) < minGap)) continue
    choices.push(candidate)
  }
  // shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return choices.map(v => ({
    value: v,
    label: isPercent ? `${v.toFixed(1)}%` : fmt(v)
  }))
}

/** 천 단위 콤마 포맷 (소수 1자리 지원) */
export function fmt(n) {
  if (Number.isInteger(n)) return n.toLocaleString('ko-KR')
  return n.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/**
 * 4가지 문제 유형 중 랜덤 1개 생성
 * @param {{ rows, cols, data }} table
 * @returns {{ text, choices, answerIndex, highlights }}
 */
export function generateQuestion(table) {
  const { rows, cols, data } = table
  const type = Math.floor(Math.random() * 3)

  if (type === 0) return genPercent(rows, cols, data)
  if (type === 1) return genGrowthRate(rows, cols, data)
  return genSumOrAvg(rows, cols, data)
}

/** [유형 0] 비율/퍼센트: 특정 셀이 행 합계에서 차지하는 비율 */
function genPercent(rows, cols, data) {
  const ri = Math.floor(Math.random() * rows.length)
  const ci = Math.floor(Math.random() * cols.length)
  const rowSum = data[ri].reduce((a, b) => a + b, 0)
  const answer = Math.round((data[ri][ci] / rowSum) * 1000) / 10 // 소수 1자리

  const choices = buildChoices(answer, true)
  const answerIndex = choices.findIndex(c => c.value === answer)
  return {
    text: `${rows[ri]}의 ${cols[ci]} 값이 해당 행 합계에서 차지하는 비율은?`,
    choices,
    answerIndex,
    highlights: [{ ri, ci }]
  }
}

/** [유형 1] 증감률: 인접 연도 간 변화율 */
function genGrowthRate(rows, cols, data) {
  const ri = Math.floor(Math.random() * rows.length)
  const ci = Math.floor(Math.random() * (cols.length - 1)) // 0~2
  const before = data[ri][ci]
  const after = data[ri][ci + 1]
  const rate = Math.round(((after - before) / before) * 1000) / 10
  const isIncrease = after >= before
  const answer = isIncrease ? rate : Math.abs(rate)
  const dir = isIncrease ? '증가율' : '감소율'

  const choices = buildChoices(answer, true)
  const answerIndex = choices.findIndex(c => c.value === answer)
  return {
    text: `${rows[ri]}의 ${cols[ci]}→${cols[ci + 1]} ${dir}은?`,
    choices,
    answerIndex,
    highlights: [{ ri, ci }, { ri, ci: ci + 1 }]
  }
}

/** [유형 2] 합계 또는 평균: 특정 행 전체 또는 특정 열 전체 */
function genSumOrAvg(rows, cols, data) {
  const isRow = Math.random() < 0.5
  const isSum = Math.random() < 0.5
  const idx = Math.floor(Math.random() * (isRow ? rows.length : cols.length))

  const values = isRow
    ? data[idx]
    : data.map(row => row[idx])

  // 합계는 최대 5×99,999,999 ≈ 5억 → JS Number 안전 (< 2^53)
  const total = Math.round(values.reduce((a, b) => a + b, 0) * 10) / 10
  const answer = isSum ? total : Math.round((total / values.length) * 10) / 10

  const choices = buildChoices(answer, false)
  const answerIndex = choices.findIndex(c => c.value === answer)
  const label = isRow ? rows[idx] : cols[idx]
  return {
    text: `${label}의 ${isSum ? '합계' : '평균'}은?`,
    choices,
    answerIndex,
    highlights: isRow
      ? values.map((_, ci) => ({ ri: idx, ci }))
      : values.map((_, ri) => ({ ri, ci: idx }))
  }
}
