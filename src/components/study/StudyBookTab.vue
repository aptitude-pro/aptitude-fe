<template>
  <div class="book-tab">
    <div class="card">
      <div class="card-header-row">
        <h3>책 목록 ({{ books.length }})</h3>
        <button class="btn-primary sm" @click="showForm = !showForm">
          {{ showForm ? '취소' : '+ 책 등록' }}
        </button>
      </div>

      <!-- 등록 폼 -->
      <div v-if="showForm" class="book-form">
        <div class="form-row">
          <div class="form-group">
            <label>제목 *</label>
            <input v-model="form.title" placeholder="책 제목" />
          </div>
          <div class="form-group">
            <label>저자</label>
            <input v-model="form.author" placeholder="저자명" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>출판사</label>
            <input v-model="form.publisher" placeholder="출판사" />
          </div>
          <div class="form-group">
            <label>ISBN</label>
            <input v-model="form.isbn" placeholder="ISBN (선택)" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" @click="submitBook" :disabled="!form.title.trim() || loading">
            {{ loading ? '등록 중...' : '등록' }}
          </button>
        </div>
      </div>

      <!-- 목록 -->
      <div v-if="books.length === 0 && !showForm" class="empty">등록된 책이 없습니다</div>
      <div v-else class="book-list">
        <div v-for="book in books" :key="book.id" class="book-item">
          <div class="book-icon">📖</div>
          <div class="book-info">
            <span class="book-title">{{ book.title }}</span>
            <span class="book-meta">
              <template v-if="book.author">{{ book.author }}</template>
              <template v-if="book.author && book.publisher"> · </template>
              <template v-if="book.publisher">{{ book.publisher }}</template>
            </span>
          </div>
          <button
            v-if="canDelete(book)"
            class="btn-icon-danger"
            @click="removeBook(book.id)"
            title="삭제"
          >✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStudyStore } from '@/stores/study'

const props = defineProps({
  studyId: { type: [String, Number], required: true },
  myRole: { type: String, default: null },
  myUserId: { type: Number, default: null }
})

const studyStore = useStudyStore()
const books = computed(() => studyStore.books)
const showForm = ref(false)
const loading = ref(false)
const form = ref({ title: '', author: '', publisher: '', isbn: '' })

import { computed } from 'vue'

function canDelete(book) {
  return props.myRole === 'LEADER' || book.registeredBy === props.myUserId
}

async function submitBook() {
  if (!form.value.title.trim()) return
  loading.value = true
  const result = await studyStore.addBook(props.studyId, form.value)
  loading.value = false
  if (result.success) {
    form.value = { title: '', author: '', publisher: '', isbn: '' }
    showForm.value = false
  } else {
    alert(result.message || '등록에 실패했습니다.')
  }
}

async function removeBook(bookId) {
  if (!confirm('책을 삭제하시겠습니까?')) return
  await studyStore.deleteBook(props.studyId, bookId)
}
</script>

<style scoped>
.book-tab { display: flex; flex-direction: column; gap: 16px; }

.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.card h3 { font-size: 15px; font-weight: 600; }
.card-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-header-row h3 { margin-bottom: 0; }

.book-form {
  background: var(--bg);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
.form-row { display: flex; gap: 12px; margin-bottom: 10px; }
.form-group { flex: 1; }
.form-group label { display: block; font-size: 12px; font-weight: 500; margin-bottom: 4px; color: var(--text-muted); }
.form-group input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.form-group input:focus { border-color: var(--primary); }
.form-actions { display: flex; justify-content: flex-end; }

.book-list { display: flex; flex-direction: column; gap: 8px; }
.book-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg);
  border-radius: 8px;
}
.book-icon { font-size: 20px; flex-shrink: 0; }
.book-info { flex: 1; min-width: 0; }
.book-title { display: block; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.book-meta { font-size: 12px; color: var(--text-muted); }

.empty { padding: 30px; text-align: center; color: var(--text-light); font-size: 14px; }

.btn-primary { background: var(--primary); color: #fff; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.btn-primary.sm { padding: 6px 12px; font-size: 12px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon-danger {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.btn-icon-danger:hover { background: #fee2e2; }
</style>
