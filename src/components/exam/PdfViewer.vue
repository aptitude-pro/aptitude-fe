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
      <div v-if="pdfLoaded" class="pages-container" ref="pagesContainerRef"></div>
    </div>

    <div v-if="pdfLoaded && viewMode === 'page'" class="page-nav">
      <button class="nav-btn" :disabled="currentPage <= 1" @click="prevPage">◀</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button class="nav-btn" :disabled="currentPage >= totalPages" @click="nextPage">▶</button>
    </div>

    <div v-if="pdfLoaded && viewMode === 'scroll'" class="page-info">
      전체 {{ totalPages }}페이지
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

const containerRef = ref(null)
const pagesContainerRef = ref(null)
const pdfLoaded = ref(false)
const totalPages = ref(0)
const scale = ref(1.0)
const viewMode = ref('scroll')
const currentPage = ref(1)
let pdfDoc = null
let renderGeneration = 0

async function loadPdf(event) {
  const file = event.target.files[0]
  if (!file) return

  const arrayBuffer = await file.arrayBuffer()
  pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  totalPages.value = pdfDoc.numPages
  pdfLoaded.value = true
  await nextTick()
  if (viewMode.value === 'scroll') {
    renderAllPages()
  } else {
    currentPage.value = 1
    renderSinglePage(1)
  }
}

async function renderAllPages() {
  if (!pdfDoc || !pagesContainerRef.value) return
  const myGen = ++renderGeneration
  const container = pagesContainerRef.value
  container.innerHTML = ''

  for (let i = 1; i <= totalPages.value; i++) {
    if (renderGeneration !== myGen) return
    const page = await pdfDoc.getPage(i)
    if (renderGeneration !== myGen) return

    const viewport = page.getViewport({ scale: scale.value * 1.5 })

    const wrapper = document.createElement('div')
    wrapper.className = 'page-item'

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const label = document.createElement('div')
    label.className = 'page-label'
    label.textContent = `${i}`

    wrapper.appendChild(canvas)
    wrapper.appendChild(label)
    container.appendChild(wrapper)

    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    if (renderGeneration !== myGen) return
  }
}

async function renderSinglePage(pageNum) {
  if (!pdfDoc || !pagesContainerRef.value) return
  const myGen = ++renderGeneration
  const container = pagesContainerRef.value
  container.innerHTML = ''

  if (renderGeneration !== myGen) return
  const page = await pdfDoc.getPage(pageNum)
  if (renderGeneration !== myGen) return

  const viewport = page.getViewport({ scale: scale.value * 1.5 })

  const wrapper = document.createElement('div')
  wrapper.className = 'page-item'

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  wrapper.appendChild(canvas)
  container.appendChild(wrapper)
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
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

async function zoomIn() {
  scale.value = Math.min(scale.value + 0.15, 3.0)
  if (viewMode.value === 'scroll') {
    await renderAllPages()
  } else {
    await renderSinglePage(currentPage.value)
  }
}

async function zoomOut() {
  scale.value = Math.max(scale.value - 0.15, 0.5)
  if (viewMode.value === 'scroll') {
    await renderAllPages()
  } else {
    await renderSinglePage(currentPage.value)
  }
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

.pages-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: fit-content;
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
  padding: 6px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  flex-shrink: 0;
}
</style>
