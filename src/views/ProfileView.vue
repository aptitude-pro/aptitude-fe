<template>
  <div class="profile-view">
    <h2>마이페이지</h2>

    <div class="profile-grid">
      <!-- 프로필 카드 -->
      <div class="card profile-card">
        <div class="avatar-wrap">
          <div class="avatar-big">{{ auth.user?.nickname?.charAt(0) || 'U' }}</div>
          <button class="avatar-edit-btn">사진 변경</button>
        </div>
        <div class="profile-info">
          <div class="profile-name">{{ auth.user?.nickname }}</div>
          <div class="profile-email">{{ auth.user?.email }}</div>
          <div class="profile-since">가입일: {{ formatDate(auth.user?.createdAt) }}</div>
        </div>
      </div>

      <!-- 프로필 편집 -->
      <div class="card">
        <h3>프로필 수정</h3>
        <form @submit.prevent="handleUpdateProfile" class="edit-form">
          <div class="form-group">
            <label>닉네임</label>
            <input v-model="profileForm.nickname" />
          </div>
          <div class="form-group">
            <label>이메일</label>
            <input v-model="profileForm.email" type="email" />
          </div>
          <div class="form-group">
            <label>목표 시험</label>
            <select v-model="profileForm.targetExam">
              <option value="SKCT">SKCT</option>
              <option value="GSAT">GSAT</option>
              <option value="NCS">NCS</option>
            </select>
          </div>
          <p v-if="updateMsg" :class="['update-msg', updateSuccess ? 'success' : 'error']">{{ updateMsg }}</p>
          <button type="submit" class="btn-primary" :disabled="updateLoading">
            {{ updateLoading ? '저장 중...' : '저장하기' }}
          </button>
        </form>
      </div>

      <!-- 비밀번호 변경 -->
      <div class="card">
        <h3>비밀번호 변경</h3>
        <form @submit.prevent="handleChangePassword" class="edit-form">
          <div class="form-group">
            <label>현재 비밀번호</label>
            <input v-model="pwForm.current" type="password" placeholder="현재 비밀번호" />
          </div>
          <div class="form-group">
            <label>새 비밀번호</label>
            <input v-model="pwForm.newPw" type="password" placeholder="새 비밀번호 (8자 이상)" minlength="8" />
          </div>
          <div class="form-group">
            <label>새 비밀번호 확인</label>
            <input v-model="pwForm.confirm" type="password" placeholder="새 비밀번호 재입력" />
          </div>
          <p v-if="pwMsg" :class="['update-msg', pwSuccess ? 'success' : 'error']">{{ pwMsg }}</p>
          <button type="submit" class="btn-primary" :disabled="pwLoading">
            {{ pwLoading ? '변경 중...' : '비밀번호 변경' }}
          </button>
        </form>
      </div>

      <!-- 알림 설정 -->
      <div class="card">
        <h3>알림 설정</h3>
        <div class="setting-list">
          <div class="setting-item">
            <div class="setting-info">
              <span>시험 종료 5분 전 알림</span>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="settings.timer5min" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span>시험 종료 1분 전 알림</span>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="settings.timer1min" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span>다크 모드</span>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="settings.darkMode" @change="toggleDark" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 계정 탈퇴 -->
    <div class="danger-zone card">
      <h3>계정 관리</h3>
      <p>계정을 탈퇴하면 모든 데이터가 영구적으로 삭제됩니다.</p>
      <button class="btn-delete" @click="confirmDelete">계정 탈퇴</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import apiClient from '@/api'

const auth = useAuthStore()
const router = useRouter()

const updateLoading = ref(false)
const updateMsg = ref('')
const updateSuccess = ref(false)
const pwLoading = ref(false)
const pwMsg = ref('')
const pwSuccess = ref(false)

const profileForm = ref({
  nickname: auth.user?.nickname || '',
  email: auth.user?.email || '',
  targetExam: auth.user?.targetExam || 'SKCT'
})

const pwForm = ref({ current: '', newPw: '', confirm: '' })

const settings = ref({
  timer5min: true,
  timer1min: true,
  darkMode: false
})

async function handleUpdateProfile() {
  updateMsg.value = ''
  updateLoading.value = true
  try {
    const res = await apiClient.put('/users/me', profileForm.value)
    auth.setAuth(res.data.data, auth.accessToken)
    updateMsg.value = '프로필이 업데이트되었습니다.'
    updateSuccess.value = true
  } catch (err) {
    updateMsg.value = err.response?.data?.message || '업데이트에 실패했습니다.'
    updateSuccess.value = false
  } finally {
    updateLoading.value = false
  }
}

async function handleChangePassword() {
  pwMsg.value = ''
  if (pwForm.value.newPw !== pwForm.value.confirm) {
    pwMsg.value = '새 비밀번호가 일치하지 않습니다.'
    pwSuccess.value = false
    return
  }
  pwLoading.value = true
  try {
    await apiClient.put('/users/me/password', {
      currentPassword: pwForm.value.current,
      newPassword: pwForm.value.newPw
    })
    pwMsg.value = '비밀번호가 변경되었습니다.'
    pwSuccess.value = true
    pwForm.value = { current: '', newPw: '', confirm: '' }
  } catch (err) {
    pwMsg.value = err.response?.data?.message || '비밀번호 변경에 실패했습니다.'
    pwSuccess.value = false
  } finally {
    pwLoading.value = false
  }
}

function toggleDark() {
  document.documentElement.setAttribute('data-theme', settings.value.darkMode ? 'dark' : '')
}

async function confirmDelete() {
  if (!confirm('정말로 계정을 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) return
  try {
    await apiClient.delete('/users/me')
    await auth.logout()
    router.push('/exam')
  } catch (_) {}
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR')
}
</script>

<style scoped>
.profile-view { max-width: 900px; }
.profile-view h2 { font-size: 22px; font-weight: 700; margin-bottom: 24px; }

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
}
.card h3 { font-size: 15px; font-weight: 600; margin-bottom: 18px; }

.profile-card { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.avatar-big {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700;
}
.avatar-edit-btn { font-size: 12px; color: var(--text-muted); background: var(--bg); padding: 4px 10px; border-radius: 6px; }
.profile-info { text-align: center; }
.profile-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.profile-email { font-size: 14px; color: var(--text-muted); margin-bottom: 4px; }
.profile-since { font-size: 12px; color: var(--text-light); }

.edit-form { display: flex; flex-direction: column; gap: 14px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 5px; }
.form-group input, .form-group select {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.form-group input:focus, .form-group select:focus { border-color: var(--primary); }

.btn-primary {
  background: var(--primary);
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s;
  width: 100%;
}
.btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.update-msg { font-size: 13px; }
.update-msg.success { color: var(--success); }
.update-msg.error { color: var(--danger); }

.setting-list { display: flex; flex-direction: column; gap: 16px; }
.setting-item { display: flex; align-items: center; justify-content: space-between; }
.setting-info span { font-size: 14px; }

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 24px;
  transition: background 0.2s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle input:checked + .toggle-slider { background: var(--primary); }
.toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

.danger-zone { border-color: #fecaca; }
.danger-zone h3 { color: var(--danger); }
.danger-zone p { font-size: 13px; color: var(--text-muted); margin-bottom: 14px; }
.btn-delete {
  background: #fff;
  color: var(--danger);
  border: 1px solid #fecaca;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
}
.btn-delete:hover { background: #fee2e2; }
</style>
