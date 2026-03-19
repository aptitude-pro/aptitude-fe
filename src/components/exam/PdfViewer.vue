<template>
  <div class="pdf-viewer">
    <div class="pdf-toolbar">
      <div class="toolbar-left">
        <span class="panel-label">문제</span>
        <div class="mode-toggle">
          <button :class="['mode-btn', { active: viewMode === 'page' }]" @click="setMode('page')" title="페이지 넘기기">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
          </button>
          <button :class="['mode-btn', { active: viewMode === 'scroll' }]" @click="setMode('scroll')" title="무한 스크롤">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="toolbar-actions">
        <button class="tool-btn" @click="zoomOut" title="축소">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
        <button class="tool-btn" @click="zoomIn" title="확대">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <label class="upload-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          PDF 업로드
          <input type="file" accept=".pdf" @change="loadPdf" style="display:none" />
        </label>
      </div>
    </div>

    <div class="pdf-body" ref="containerRef">
      <div v-if="!pdfLoaded" class="no-pdf">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
        <p>PDF 파일을 업로드해주세요</p>
      </div>
      <div v-if="isRendering" class="loading-overlay">
        <div class="spinner" />
        <span>PDF 로딩 중...</span>
      </div>
      <div
        v-if="pdfLoaded"
        class="pages-container"
        ref="pagesContainerRef"
        :style="{ visibility: isRendering ? 'hidden' : 'visible' }"
      ></div>
    </div>

    <div v-if="pdfLoaded && viewMode === 'page'" class="page-nav">
      <button class="nav-btn" :disabled="currentPage <= 1" @click="prevPage">◀</button>
      <input class="page-input" type="number" v-model.number="pageInput"
             @keydown.enter.prevent="jumpToPage" @blur="syncPageInput"
             :min="1" :max="totalPages" />
      <span class="page-sep">/ {{ totalPages }}</span>
      <button class="nav-btn" :disabled="currentPage >= totalPages" @click="nextPage">▶</button>
    </div>

    <div v-if="pdfLoaded && viewMode === 'scroll'" class="page-info">
      <span>{{ currentVisiblePage }} / {{ totalPages }}페이지</span>
      <div class="page-jump">
        <input type="number" class="page-input" v-model.number="scrollPageInput"
               @keydown.enter="jumpToScrollPage" :min="1" :max="totalPages" placeholder="페이지" />
        <button class="jump-btn" @click="jumpToScrollPage">이동</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// public/pdf.worker.min.js 로 서빙 (.js 확장자 → nginx가 application/javascript로 처리)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

const RENDER_SCALE = 2.0  // 고정 렌더 해상도 — 줌 시 재렌더 없이 CSS scale만 사용

const containerRef = ref(null)
const pagesContainerRef = ref(null)
const pdfLoaded = ref(false)
const isRendering = ref(false)
const totalPages = ref(0)
const scale = ref(1.0)
const viewMode = ref('scroll')
const currentPage = ref(1)
const pageInput = ref(1)
const scrollPageInput = ref(1)
const currentVisiblePage = ref(1)
let pdfDoc = null
let renderGeneration = 0
let naturalPageWidth = 0

watch(currentPage, (v) => { pageInput.value = v })

function setupScrollListener() {
  if (!containerRef.value) return
  containerRef.value.addEventListener('scroll', () => {
    currentVisiblePage.value = getVisiblePage()
  }, { passive: true })
}

async function loadPdf(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const arrayBuffer = await file.arrayBuffer()
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    totalPages.value = pdfDoc.numPages
    pdfLoaded.value = true
    await nextTick()
    setupScrollListener()
    if (viewMode.value === 'scroll') {
      await renderAllPages()
    } else {
      currentPage.value = 1
      await renderSinglePage(1)
    }
  } catch (err) {
    console.error('PDF 로드 실패:', err)
    alert('PDF 파일을 불러오지 못했습니다. 파일이 올바른지 확인해주세요.')
  }
}

function getVisiblePage() {
  if (!containerRef.value || !pagesContainerRef.value) return 1
  const container = containerRef.value
  const centerY = container.scrollTop + container.clientHeight / 2
  const items = pagesContainerRef.value.querySelectorAll('.page-item')
  let best = null
  for (const item of items) {
    if (item.offsetTop <= centerY) {
      best = item
    } else {
      break
    }
  }
  return parseInt((best || items[0])?.dataset.page) || 1
}

function applyZoom() {
  if (!pagesContainerRef.value) return
  if (naturalPageWidth > 0) {
    const displayWidth = naturalPageWidth / RENDER_SCALE * scale.value * 2
    pagesContainerRef.value.style.width = displayWidth + 'px'
  }
  const canvases = pagesContainerRef.value.querySelectorAll('canvas')
  canvases.forEach(canvas => {
    const w = canvas.width
    const h = canvas.height
    canvas.style.width = (w / RENDER_SCALE * scale.value * 2) + 'px'
    canvas.style.height = (h / RENDER_SCALE * scale.value * 2) + 'px'
  })
}

function scrollToPage(pageNum) {
  const item = pagesContainerRef.value?.querySelector(`[data-page="${pageNum}"]`)
  if (item && containerRef.value && pagesContainerRef.value) {
    containerRef.value.scrollTop = pagesContainerRef.value.offsetTop + item.offsetTop
  }
}

function jumpToPage() {
  const p = Math.max(1, Math.min(totalPages.value, Math.round(pageInput.value) || 1))
  pageInput.value = p
  currentPage.value = p
  renderSinglePage(p)
}

function syncPageInput() {
  pageInput.value = Math.max(1, Math.min(totalPages.value, Math.round(pageInput.value) || 1))
}

function jumpToScrollPage() {
  const p = Math.max(1, Math.min(totalPages.value, Math.round(scrollPageInput.value) || 1))
  scrollToPage(p)
}

async function renderAllPages() {
  if (!pdfDoc) return
  if (!pagesContainerRef.value) await nextTick()
  if (!pagesContainerRef.value) return

  const myGen = ++renderGeneration
  const container = pagesContainerRef.value
  isRendering.value = true
  container.innerHTML = ''

  const firstThird = Math.ceil(totalPages.value / 3)
  const renderTasks = []

  for (let i = 1; i <= totalPages.value; i++) {
    if (renderGeneration !== myGen) { isRendering.value = false; return }
    const page = await pdfDoc.getPage(i)
    if (renderGeneration !== myGen) { isRendering.value = false; return }

    const viewport = page.getViewport({ scale: RENDER_SCALE })

    if (i === 1) {
      naturalPageWidth = viewport.width
      applyZoom()
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'page-item'
    wrapper.dataset.page = i

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = (viewport.width / RENDER_SCALE * scale.value * 2) + 'px'
    canvas.style.height = (viewport.height / RENDER_SCALE * scale.value * 2) + 'px'

    const label = document.createElement('div')
    label.className = 'page-label'
    label.textContent = `${i}`

    wrapper.appendChild(canvas)
    wrapper.appendChild(label)
    container.appendChild(wrapper)

    renderTasks.push(
      page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    )

    if (i === firstThird) {
      await Promise.all(renderTasks.slice())
      if (renderGeneration === myGen) isRendering.value = false
    }
  }

  if (renderGeneration === myGen) await Promise.all(renderTasks)
}

async function renderSinglePage(pageNum) {
  if (!pdfDoc) return
  if (!pagesContainerRef.value) await nextTick()
  if (!pagesContainerRef.value) return
  const myGen = ++renderGeneration
  const container = pagesContainerRef.value
  isRendering.value = true
  container.innerHTML = ''

  if (renderGeneration !== myGen) { isRendering.value = false; return }
  const page = await pdfDoc.getPage(pageNum)
  if (renderGeneration !== myGen) { isRendering.value = false; return }

  const viewport = page.getViewport({ scale: RENDER_SCALE })
  naturalPageWidth = viewport.width

  const wrapper = document.createElement('div')
  wrapper.className = 'page-item'
  wrapper.dataset.page = pageNum

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.width = (viewport.width / RENDER_SCALE * scale.value * 2) + 'px'
  canvas.style.height = (viewport.height / RENDER_SCALE * scale.value * 2) + 'px'

  wrapper.appendChild(canvas)
  container.appendChild(wrapper)
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

  if (renderGeneration !== myGen) { isRendering.value = false; return }
  isRendering.value = false
  applyZoom()
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    renderSinglePage(currentPage.value)
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    renderSinglePage(currentPage.value)
  }
}

async function setMode(mode) {
  viewMode.value = mode
  if (!pdfLoaded.value) return
  if (mode === 'scroll') {
    await renderAllPages()
  } else {
    await renderSinglePage(currentPage.value)
  }
}

function zoomWithScrollPreserve(newScale) {
  const container = containerRef.value
  if (!container) { scale.value = newScale; applyZoom(); return }

  const oldScrollHeight = container.scrollHeight
  const oldScrollTop = container.scrollTop

  scale.value = newScale
  applyZoom()

  // applyZoom이 DOM을 바꿨으므로 nextTick 후 비율 복원
  nextTick(() => {
    const newScrollHeight = container.scrollHeight
    if (oldScrollHeight > 0) {
      container.scrollTop = (oldScrollTop / oldScrollHeight) * newScrollHeight
    }
  })
}

function zoomIn() {
  zoomWithScrollPreserve(Math.min(scale.value + 0.15, 3.0))
}

function zoomOut() {
  zoomWithScrollPreserve(Math.max(scale.value - 0.15, 0.5))
}
</script>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-label {
  font-size: 14px;
  font-weight: 600;
}

.mode-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.mode-btn {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.15s;
}
.mode-btn.active { background: #fff; color: #1f2937; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.mode-btn:hover:not(.active) { color: #374151; }

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tool-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  transition: background 0.15s;
}
.tool-btn:hover { background: #e5e7eb; }

.zoom-label {
  font-size: 12px;
  color: #6b7280;
  min-width: 36px;
  text-align: center;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: #1f2937;
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.upload-btn:hover { background: #111827; }

.pdf-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #e5e7eb;
  position: relative;
}

.no-pdf {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #9ca3af;
  height: 100%;
  width: 100%;
}
.no-pdf p { font-size: 14px; }

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  z-index: 10;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.pages-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.page-item {
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.page-item canvas { display: block; }

.page-label {
  position: absolute;
  bottom: 6px;
  right: 8px;
  background: rgba(0,0,0,0.45);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.page-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 6px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  color: #374151;
  flex-shrink: 0;
}

.nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #374151;
  transition: background 0.15s;
}
.nav-btn:hover:not(:disabled) { background: #e5e7eb; }
.nav-btn:disabled { color: #d1d5db; cursor: not-allowed; }

.page-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 6px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  flex-shrink: 0;
}

.page-input {
  width: 44px;
  text-align: center;
  padding: 3px 4px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 12px;
  outline: none;
}
.page-input:focus { border-color: #4f46e5; }
.page-input::-webkit-outer-spin-button,
.page-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.page-input[type=number] { -moz-appearance: textfield; }

.page-sep { font-size: 12px; color: #374151; }

.page-jump { display: flex; align-items: center; gap: 5px; }
.jump-btn {
  padding: 3px 8px;
  background: #4f46e5;
  color: #fff;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
</style>
