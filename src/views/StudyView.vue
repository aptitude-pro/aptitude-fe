<template>
  <div class="study-view">
    <div class="page-header">
      <div>
        <h2>스터디</h2>
        <p>함께 공부하고 성장하세요</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="showJoinModal = true">코드로 참가</button>
        <button class="btn-primary" @click="showCreateModal = true">+ 스터디 만들기</button>
      </div>
    </div>

    <!-- 내 스터디 -->
    <section>
      <h3 class="section-title">참여 중인 스터디</h3>
      <div v-if="studyStore.myStudies.length === 0" class="empty-card">
        <p>아직 참여 중인 스터디가 없습니다</p>
        <button class="btn-primary" @click="showCreateModal = true">스터디 만들기</button>
      </div>
      <div v-else class="study-grid">
        <router-link
          v-for="s in studyStore.myStudies"
          :key="s.id"
          :to="`/studies/${s.id}`"
          class="study-card"
        >
          <div class="study-card-top">
            <span class="study-type-badge">{{ s.examType }}</span>
            <span :class="['pub-badge', s.isPublic ? 'public' : 'private']">
              {{ s.isPublic ? '공개' : '비공개' }}
            </span>
          </div>
          <h4 class="study-name">{{ s.name }}</h4>
          <div class="study-meta">
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {{ s.memberCount || '?' }} / {{ s.maxMembers }}명
            </span>
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
              평균 {{ s.avgScore || '-' }}점
            </span>
          </div>
          <div class="study-role" :class="s.myRole === 'LEADER' ? 'leader' : 'member'">
            {{ s.myRole === 'LEADER' ? '👑 리더' : '멤버' }}
          </div>
        </router-link>
      </div>
    </section>

    <!-- 공개 스터디 -->
    <section>
      <div class="section-header-row">
        <h3 class="section-title">공개 스터디 탐색</h3>
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="스터디 이름 검색..."
          @input="debouncedSearch"
        />
      </div>
      <div class="study-grid">
        <div
          v-for="s in studyStore.publicStudies"
          :key="s.id"
          class="study-card explore"
        >
          <div class="study-card-top">
            <span class="study-type-badge">{{ s.examType }}</span>
          </div>
          <h4 class="study-name">{{ s.name }}</h4>
          <div class="study-meta">
            <span>{{ s.memberCount }} / {{ s.maxMembers }}명</span>
          </div>
          <button v-if="!s.myRole" class="btn-join" @click="joinPublicStudy(s.id)">참가 신청</button>
          <span v-else class="badge-joined">참여중</span>
        </div>
      </div>
    </section>

    <!-- 스터디 만들기 모달 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>스터디 만들기</h3>
          <button @click="showCreateModal = false" class="modal-close">✕</button>
        </div>
        <form @submit.prevent="handleCreate" class="modal-form">
          <div class="form-group">
            <label>스터디 이름</label>
            <input v-model="createForm.name" placeholder="스터디 이름 입력" required />
          </div>
          <div class="form-group">
            <label>목표 시험</label>
            <select v-model="createForm.examType">
              <option value="SKCT">SKCT</option>
              <option value="GSAT">GSAT</option>
              <option value="NCS">NCS</option>
            </select>
          </div>
          <div class="form-group">
            <label>최대 인원</label>
            <input v-model.number="createForm.maxMembers" type="number" min="2" max="50" />
          </div>
          <div class="form-group">
            <label>공개 설정</label>
            <div class="visibility-toggle">
              <button type="button"
                :class="['vis-btn', { active: createForm.isPublic }]"
                @click="createForm.isPublic = true">
                공개
              </button>
              <button type="button"
                :class="['vis-btn', { active: !createForm.isPublic }]"
                @click="createForm.isPublic = false">
                비공개
              </button>
            </div>
            <p class="vis-desc">
              {{ createForm.isPublic ? '누구나 탐색하고 참가 신청할 수 있습니다' : '초대 코드를 가진 사람만 참가할 수 있습니다' }}
            </p>
          </div>
          <p v-if="createError" class="error-msg">{{ createError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showCreateModal = false">취소</button>
            <button type="submit" class="btn-primary" :disabled="createLoading">
              {{ createLoading ? '생성 중...' : '만들기' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 코드로 참가 모달 -->
    <div v-if="showJoinModal" class="modal-overlay" @click.self="showJoinModal = false">
      <div class="modal small">
        <div class="modal-header">
          <h3>초대 코드로 참가</h3>
          <button @click="showJoinModal = false" class="modal-close">✕</button>
        </div>
        <form @submit.prevent="handleJoin" class="modal-form">
          <div class="form-group">
            <label>초대 코드 (6자리)</label>
            <input v-model="joinCode" placeholder="ABC123" maxlength="6" required style="text-transform:uppercase;letter-spacing:4px;font-size:18px;text-align:center;" />
          </div>
          <p v-if="joinError" class="error-msg">{{ joinError }}</p>
          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="joinLoading">
              {{ joinLoading ? '참가 중...' : '참가하기' }}
            </button>
            <button type="button" class="btn-secondary" @click="showJoinModal = false">취소</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStudyStore } from '@/stores/study'
import { useRouter } from 'vue-router'

const studyStore = useStudyStore()
const router = useRouter()
const searchKeyword = ref('')
const showCreateModal = ref(false)
const showJoinModal = ref(false)
const createLoading = ref(false)
const joinLoading = ref(false)
const createError = ref('')
const joinError = ref('')
const joinCode = ref('')

const createForm = ref({
  name: '', examType: 'SKCT', maxMembers: 10, isPublic: true
})

let searchTimer = null

onMounted(async () => {
  await Promise.all([
    studyStore.fetchMyStudies(),
    studyStore.fetchPublicStudies()
  ])
})

function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    studyStore.fetchPublicStudies(searchKeyword.value)
  }, 300)
}

async function handleCreate() {
  createError.value = ''
  createLoading.value = true
  const result = await studyStore.createStudy(createForm.value)
  createLoading.value = false
  if (result.success) {
    showCreateModal.value = false
    router.push(`/studies/${result.data.id}`)
  } else {
    createError.value = result.message
  }
}

async function handleJoin() {
  joinError.value = ''
  joinLoading.value = true
  const result = await studyStore.joinStudy(joinCode.value.toUpperCase())
  joinLoading.value = false
  if (result.success) {
    showJoinModal.value = false
    router.push(`/studies/${result.data.id}`)
  } else {
    joinError.value = result.message
  }
}

async function joinPublicStudy(id) {
  const result = await studyStore.joinPublicStudyById(id)
  if (result.success) {
    router.push(`/studies/${result.data.id}`)
  } else {
    alert(result.message)
  }
}
</script>

<style scoped>
.study-view { max-width: 1000px; display: flex; flex-direction: column; gap: 28px; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.page-header h2 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.page-header p { font-size: 14px; color: var(--text-muted); }

.header-actions { display: flex; gap: 10px; }
.btn-primary { background: var(--primary); color: #fff; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-secondary { background: #fff; color: var(--text); border: 1px solid var(--border); padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; }

.section-title { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
.section-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.search-input {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 13px;
  outline: none;
  width: 200px;
}

.empty-card {
  background: #fff;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
}

.study-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.study-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
  cursor: pointer;
}
.study-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.study-card.explore { text-decoration: none; color: inherit; }

.study-card-top { display: flex; gap: 6px; }
.study-type-badge { font-size: 11px; background: #1f2937; color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 500; }
.pub-badge { font-size: 11px; padding: 2px 7px; border-radius: 4px; }
.pub-badge.public { background: #d1fae5; color: #065f46; }
.pub-badge.private { background: #fee2e2; color: #991b1b; }

.study-name { font-size: 15px; font-weight: 600; }
.study-meta { display: flex; flex-direction: column; gap: 4px; }
.study-meta span { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.study-role { font-size: 12px; font-weight: 500; }
.study-role.leader { color: #d97706; }
.study-role.member { color: var(--text-muted); }

.btn-join {
  background: var(--primary);
  color: #fff;
  padding: 7px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}
.badge-joined { font-size: 12px; color: #10b981; font-weight: 600; margin-top: 4px; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 440px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal.small { width: 320px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding-bottom: 16px;
  margin-bottom: 20px;
}
.modal-header h3 { font-size: 17px; font-weight: 700; }
.modal-close { font-size: 16px; color: var(--text-muted); background: none; }
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 5px; }
.form-group input, .form-group select {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-group input:focus, .form-group select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.visibility-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.vis-btn {
  flex: 1;
  padding: 9px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  background: #fff;
  transition: all 0.15s;
  border-right: 1px solid var(--border);
}
.vis-btn:last-child { border-right: none; }
.vis-btn.active { background: #1f2937; color: #fff; font-weight: 600; }
.vis-desc { font-size: 12px; color: var(--text-muted); margin-top: 6px; min-height: 16px; }
.error-msg { color: var(--danger); font-size: 13px; }
.modal-actions { display: flex; gap: 10px; margin-top: 8px; }
.modal-actions button { flex: 1; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 600; }
</style>
