<template>
  <div class="drawing-board">
    <div class="draw-toolbar">
      <div class="color-group">
        <button
          v-for="c in colors"
          :key="c"
          :class="['color-btn', { active: currentColor === c }]"
          :style="{ background: c }"
          @click="currentColor = c"
        ></button>
      </div>
      <div class="size-group">
        <button
          v-for="s in sizes"
          :key="s"
          :class="['size-btn', { active: currentSize === s }]"
          @click="currentSize = s"
        >
          <div :style="{ width: s + 'px', height: s + 'px', background: 'currentColor', borderRadius: '50%' }"></div>
        </button>
      </div>
      <button class="tool-btn-sm" @click="setEraser" :class="{ active: isEraser }">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16 14 5l7 7-4 8z"/></svg>
      </button>
      <button class="tool-btn-sm" @click="clearCanvas">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
      </button>
    </div>
    <canvas
      ref="canvasRef"
      class="draw-canvas"
      @mousedown="startDraw"
      @mousemove="draw"
      @mouseup="endDraw"
      @mouseleave="endDraw"
      @touchstart.prevent="startDrawTouch"
      @touchmove.prevent="drawTouch"
      @touchend="endDraw"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const colors = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b']
const sizes = [2, 4, 7]
const currentColor = ref('#000000')
const currentSize = ref(2)
const isEraser = ref(false)
let drawing = false
let ctx = null

onMounted(() => {
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
})

onUnmounted(() => window.removeEventListener('resize', resize))

function resize() {
  const canvas = canvasRef.value
  const parent = canvas.parentElement
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  canvas.width = parent.offsetWidth
  canvas.height = Math.max(200, parent.offsetHeight - 40)
  ctx.putImageData(data, 0, 0)
}

function getPos(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDraw(e) {
  drawing = true
  const pos = getPos(e)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

function draw(e) {
  if (!drawing) return
  const pos = getPos(e)
  ctx.lineWidth = isEraser.value ? 20 : currentSize.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = isEraser.value ? '#ffffff' : currentColor.value
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function endDraw() { drawing = false }

function startDrawTouch(e) {
  const t = e.touches[0]
  startDraw(t)
}
function drawTouch(e) {
  const t = e.touches[0]
  draw(t)
}

function setEraser() { isEraser.value = !isEraser.value }

function clearCanvas() {
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

function getImageData() {
  return canvasRef.value.toDataURL()
}

defineExpose({ getImageData, clearCanvas })
</script>

<style scoped>
.drawing-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.draw-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}

.color-group { display: flex; gap: 4px; }
.color-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: border-color 0.1s;
}
.color-btn.active { border-color: #374151; }

.size-group { display: flex; align-items: center; gap: 6px; }
.size-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
}
.size-btn.active { background: #e5e7eb; }

.tool-btn-sm {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
}
.tool-btn-sm.active { background: #1f2937; color: #fff; }
.tool-btn-sm:hover { background: #e5e7eb; }

.draw-canvas {
  flex: 1;
  cursor: crosshair;
  display: block;
}
</style>
