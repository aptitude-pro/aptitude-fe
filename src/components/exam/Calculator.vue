<template>
  <div class="calculator" ref="calcEl" tabindex="-1">
    <div class="calc-display">
      <div class="calc-expr">{{ expression || '&nbsp;' }}</div>
      <div class="calc-result" :style="{ fontSize: displayFontSize }">{{ display }}</div>
    </div>
    <div class="calc-buttons">
      <button v-for="btn in buttons" :key="btn.label"
        :class="['calc-btn', btn.type]"
        @mousedown.prevent
        @click="handleBtnClick(btn)"
        v-html="btn.label"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const calcEl = ref(null)
const display = ref('0')
const expression = ref('')

const buttons = [
  { label: '(', type: 'op', action: 'paren-open' },
  { label: ')', type: 'op', action: 'paren-close' },
  { label: '%', type: 'op', action: 'percent' },
  { label: 'C', type: 'clear', action: 'clear' },
  { label: 'AC', type: 'clear', action: 'allclear' },
  { label: '+/−', type: 'op', action: 'negate' },
  { label: '÷', type: 'op', action: 'op' },
  { label: '×', type: 'op-right', action: 'op' },
  { label: '7', type: 'num', action: 'num' },
  { label: '8', type: 'num', action: 'num' },
  { label: '9', type: 'num', action: 'num' },
  { label: '−', type: 'op-right', action: 'op' },
  { label: '4', type: 'num', action: 'num' },
  { label: '5', type: 'num', action: 'num' },
  { label: '6', type: 'num', action: 'num' },
  { label: '+', type: 'op-right', action: 'op' },
  { label: '1', type: 'num', action: 'num' },
  { label: '2', type: 'num', action: 'num' },
  { label: '3', type: 'num', action: 'num' },
  { label: '=', type: 'eq', action: 'equals' },
  { label: '0', type: 'num zero', action: 'num' },
  { label: '.', type: 'num', action: 'dot' },
]

// 표현식 문자열 기반 계산기
let expr = ''
let justCalc = false

const displayFontSize = computed(() => {
  const len = display.value.length
  if (len > 14) return '13px'
  if (len > 9) return '18px'
  return '24px'
})

function lastChar() { return expr.slice(-1) }
function openParenCount() {
  return ((expr.match(/\(/g) || []).length) - ((expr.match(/\)/g) || []).length)
}
function getLastNum() {
  const m = expr.match(/[\d\.]+$/)
  return m ? m[0] : ''
}
function updateDisplay() { display.value = expr || '0' }

function press(btn) {
  const { action, label } = btn

  if (action === 'num') {
    if (justCalc) { expr = label; justCalc = false }
    else if (lastChar() === ')') return
    else expr += label

  } else if (action === 'dot') {
    const lastNum = getLastNum()
    if (justCalc) { expr = '0.'; justCalc = false }
    else if (!lastNum.includes('.')) {
      if (!lastNum) expr += '0'
      expr += '.'
    }

  } else if (action === 'paren-open') {
    justCalc = false
    if (/[\d\)]/.test(lastChar())) expr += '×'
    expr += '('

  } else if (action === 'paren-close') {
    if (openParenCount() > 0 && /[\d\)]/.test(lastChar())) expr += ')'

  } else if (action === 'op') {
    justCalc = false
    if (!expr || lastChar() === '(') return
    if (/[+×÷−]/.test(lastChar())) expr = expr.slice(0, -1) + label
    else expr += label

  } else if (action === 'negate') {
    const lastNum = getLastNum()
    if (lastNum) expr = expr.slice(0, -lastNum.length) + String(-parseFloat(lastNum))

  } else if (action === 'percent') {
    const lastNum = getLastNum()
    if (lastNum) expr = expr.slice(0, -lastNum.length) + String(parseFloat(lastNum) / 100)

  } else if (action === 'clear' || action === 'allclear') {
    expr = ''
    expression.value = ''
    justCalc = false

  } else if (action === 'equals') {
    if (!expr) return
    const exprToEval = expr + ')'.repeat(openParenCount())
    const result = safeEval(exprToEval)
    expression.value = exprToEval + ' ='
    expr = String(result)
    justCalc = true
  }

  updateDisplay()
}

function handleBtnClick(btn) {
  press(btn)
  calcEl.value?.focus()
}

function safeEval(str) {
  if (!str) return 0
  const normalized = str
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
  if (!/^[\d\s+\-*/.()]+$/.test(normalized)) return 'Error'
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('return (' + normalized + ')')()
    if (typeof result !== 'number' || !isFinite(result)) return 'Error'
    return parseFloat(result.toPrecision(12))
  } catch {
    return 'Error'
  }
}

function handleKeydown(e) {
  const tag = e.target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea') return

  const key = e.key
  if (/^[0-9]$/.test(key)) press({ label: key, action: 'num' })
  else if (key === '.') press({ label: '.', action: 'dot' })
  else if (key === '+') press({ label: '+', action: 'op' })
  else if (key === '-') press({ label: '−', action: 'op' })
  else if (key === '*') press({ label: '×', action: 'op' })
  else if (key === '/') { e.preventDefault(); press({ label: '÷', action: 'op' }) }
  else if (key === '(') press({ label: '(', action: 'paren-open' })
  else if (key === ')') press({ label: ')', action: 'paren-close' })
  else if (key === 'Enter' || key === '=') press({ label: '=', action: 'equals' })
  else if (key === 'Backspace') {
    if (justCalc) { expr = ''; justCalc = false }
    else expr = expr.slice(0, -1)
    updateDisplay()
  }
  else if (key === 'Escape') press({ label: 'AC', action: 'allclear' })
  else if (key === '%') press({ label: '%', action: 'percent' })
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.calculator {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.calculator:focus { outline: none; }

.calc-display {
  background: #f8fafc;
  padding: 14px 16px;
  text-align: right;
  border-bottom: 1px solid #e5e7eb;
}

.calc-expr {
  font-size: 11px;
  color: #9ca3af;
  min-height: 14px;
  font-variant-numeric: tabular-nums;
}

.calc-result {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calc-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.calc-btn {
  padding: 13px 8px;
  font-size: 14px;
  font-weight: 500;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  text-align: center;
  transition: background 0.1s;
}

.calc-btn:nth-child(4n) { border-right: none; }
.calc-btn:hover { background: #f3f4f6; }

.calc-btn.num { background: #fff; color: #1f2937; }
.calc-btn.num:hover { background: #f3f4f6; }
.calc-btn.zero { grid-column: span 2; }

.calc-btn.op { background: #fff; color: #374151; }
.calc-btn.op:hover { background: #f3f4f6; }

.calc-btn.op-right { background: #f9fafb; color: #374151; }
.calc-btn.op-right:hover { background: #f3f4f6; }

.calc-btn.clear { background: #fff; color: #ef4444; font-weight: 600; }
.calc-btn.clear:hover { background: #fff0f0; }

.calc-btn.eq {
  background: #f9fafb;
  font-weight: 700;
  color: #1f2937;
  grid-row: span 2;
}
.calc-btn.eq:hover { background: #f3f4f6; }
</style>
