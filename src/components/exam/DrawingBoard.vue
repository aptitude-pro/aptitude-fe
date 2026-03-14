<template>
  <div class="drawing-board">
    <div class="draw-toolbar">
      <div class="size-group">
        <button
          v-for="s in sizes"
          :key="s"
          :class="['size-btn', { active: currentSize === s && !isEraser }]"
          @click="setDraw(s)"
        >
          <div :style="{ width: s + 'px', height: s + 'px', background: '#1f2937', borderRadius: '50%' }"></div>
        </button>
      </div>
      <div class="divider"></div>
      <div class="eraser-group">
        <span class="label">지우개</span>
        <button
          v-for="s in eraserSizes"
          :key="'e' + s"
          :class="['size-btn', { active: isEraser && currentEraserSize === s }]"
          @click="setEraser(s)"
        >
          <div :style="{ width: Math.min(s / 2, 16) + 'px', height: Math.min(s / 2, 16) + 'px', background: '#9ca3af', borderRadius: '50%', border: '1px solid #d1d5db' }"></div>
        </button>
      </div>
      <div class="divider"></div>
      <button class="tool-btn-sm" @click="clearCanvas" title="전체 지우기">
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const canvasRef = ref(null)
const sizes = [2, 4, 7]
const eraserSizes = [10, 20, 40]
const currentSize = ref(2)
const currentEraserSize = ref(20)
const isEraser = ref(false)
let drawing = false
let ctx = null
let lastX = 0
let lastY = 0

onMounted(async () => {
  await nextTick()
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
})

onUnmounted(() => window.removeEventListener('resize', resize))

function resize() {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const newW = Math.floor(rect.width)
  const newH = Math.floor(rect.height)
  if (newW === 0 || newH === 0) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  canvas.width = newW
  canvas.height = newH
  ctx.putImageData(imageData, 0, 0)
}

function getPos(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDraw(e) {
  drawing = true
  const pos = getPos(e)
  lastX = pos.x
  lastY = pos.y
}

function draw(e) {
  if (!drawing) return
  const pos = getPos(e)
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(pos.x, pos.y)
  ctx.lineWidth = isEraser.value ? currentEraserSize.value : currentSize.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = isEraser.value ? '#ffffff' : '#000000'
  ctx.stroke()
  lastX = pos.x
  lastY = pos.y
}

function endDraw() { drawing = false }

function startDrawTouch(e) { startDraw(e.touches[0]) }
function drawTouch(e) { draw(e.touches[0]) }

function setDraw(s) {
  isEraser.value = false
  currentSize.value = s
}

function setEraser(s) {
  isEraser.value = true
  currentEraserSize.value = s
}

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

.label {
  font-size: 11px;
  color: #6b7280;
}

.divider {
  width: 1px;
  height: 18px;
  background: #e5e7eb;
}

.size-group, .eraser-group { display: flex; align-items: center; gap: 6px; }

.size-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.size-btn.active { background: #e5e7eb; outline: 2px solid #374151; }
.size-btn:hover { background: #e5e7eb; }

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
.tool-btn-sm:hover { background: #fecaca; color: #dc2626; }

.draw-canvas {
  flex: 1;
  cursor: crosshair;
  display: block;
}
</style>
