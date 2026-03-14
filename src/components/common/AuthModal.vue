<template>
  <div class="modal-overlay" @click.self="auth.closeModal()">
    <div class="modal">
      <button class="modal-close" @click="auth.closeModal()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div class="modal-tabs">
        <button :class="['tab-btn', { active: auth.modalTab === 'login' }]" @click="auth.modalTab = 'login'">로그인</button>
        <button :class="['tab-btn', { active: auth.modalTab === 'register' }]" @click="auth.modalTab = 'register'">회원가입</button>
      </div>

      <!-- 로그인 -->
      <form v-if="auth.modalTab === 'login'" @submit.prevent="handleLogin" class="modal-form">
        <div class="form-group">
          <label>이메일</label>
          <input v-model="loginForm.email" type="email" placeholder="email@example.com" required />
        </div>
        <div class="form-group">
          <label>비밀번호</label>
          <input v-model="loginForm.password" type="password" placeholder="••••••••" required />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
        <p class="modal-hint">
          계정이 없으신가요?
          <button type="button" class="link-btn" @click="auth.modalTab = 'register'">회원가입</button>
        </p>
      </form>

      <!-- 회원가입 -->
      <form v-else @submit.prevent="handleRegister" class="modal-form">
        <div class="form-group">
          <label>닉네임</label>
          <input v-model="registerForm.nickname" type="text" placeholder="닉네임 입력" required />
        </div>
        <div class="form-group">
          <label>이메일</label>
          <div class="email-row">
            <input v-model="registerForm.email" type="email" placeholder="email@example.com" required :disabled="emailVerified" />
            <button type="button" class="btn-send-code" :disabled="sendingCode || emailVerified" @click="handleSendCode">
              {{ emailVerified ? '인증완료' : sendingCode ? '발송 중...' : emailSent ? '재발송' : '인증코드 발송' }}
            </button>
          </div>
        </div>
        <div v-if="emailSent && !emailVerified" class="form-group">
          <label>인증코드</label>
          <div class="email-row">
            <input v-model="verifyCode" type="text" placeholder="6자리 코드 입력" maxlength="6" />
            <button type="button" class="btn-send-code" :disabled="verifyingCode" @click="handleVerifyCode">
              {{ verifyingCode ? '확인 중...' : '인증 확인' }}
            </button>
          </div>
        </div>
        <p v-if="emailVerified" class="verify-success">이메일 인증이 완료되었습니다.</p>
        <div class="form-group">
          <label>비밀번호</label>
          <input v-model="registerForm.password" type="password" placeholder="8자 이상" required minlength="8" />
          <div class="password-strength">
            <div class="strength-bar" :style="{ width: pwStrength + '%', background: pwColor }"></div>
            <div class="strength-bg"></div>
          </div>
        </div>
        <div class="form-group">
          <label>비밀번호 확인</label>
          <input v-model="registerForm.passwordConfirm" type="password" placeholder="••••••••" required />
        </div>
        <div class="form-group">
          <label>목표 시험</label>
          <select v-model="registerForm.targetExam">
            <option value="SKCT">SKCT</option>
            <option value="GSAT">GSAT</option>
            <option value="NCS">NCS</option>
            <option value="CJ">CJ</option>
          </select>
        </div>
        <label class="checkbox-label">
          <input type="checkbox" v-model="registerForm.agree" required />
          이용약관 및 개인정보처리방침에 동의합니다
        </label>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn-submit" :disabled="loading || !emailVerified">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const error = ref('')

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({
  nickname: '', email: '', password: '', passwordConfirm: '',
  targetExam: 'SKCT', agree: false
})

const emailSent = ref(false)
const emailVerified = ref(false)
const verifyCode = ref('')
const sendingCode = ref(false)
const verifyingCode = ref(false)

const pwStrength = computed(() => {
  const pw = registerForm.value.password
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score += 25
  if (pw.length >= 12) score += 15
  if (/[A-Z]/.test(pw)) score += 20
  if (/[0-9]/.test(pw)) score += 20
  if (/[^A-Za-z0-9]/.test(pw)) score += 20
  return Math.min(score, 100)
})

const pwColor = computed(() => {
  if (pwStrength.value < 40) return '#ef4444'
  if (pwStrength.value < 70) return '#f59e0b'
  return '#10b981'
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  const result = await auth.login(loginForm.value.email, loginForm.value.password)
  loading.value = false
  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.message
  }
}

watch(() => registerForm.value.email, () => {
  emailSent.value = false
  emailVerified.value = false
  verifyCode.value = ''
})

async function handleSendCode() {
  error.value = ''
  sendingCode.value = true
  const result = await auth.sendEmailCode(registerForm.value.email)
  sendingCode.value = false
  if (result.success) {
    emailSent.value = true
    emailVerified.value = false
    verifyCode.value = ''
  } else {
    error.value = result.message
  }
}

async function handleVerifyCode() {
  error.value = ''
  verifyingCode.value = true
  const result = await auth.verifyEmailCode(registerForm.value.email, verifyCode.value)
  verifyingCode.value = false
  if (result.success) {
    emailVerified.value = true
  } else {
    error.value = result.message
  }
}

async function handleRegister() {
  error.value = ''
  if (registerForm.value.password !== registerForm.value.passwordConfirm) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  loading.value = true
  const result = await auth.register({
    nickname: registerForm.value.nickname,
    email: registerForm.value.email,
    password: registerForm.value.password,
    targetExam: registerForm.value.targetExam
  })
  loading.value = false
  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.message
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  width: 400px;
  max-width: calc(100vw - 32px);
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: background 0.15s;
}
.modal-close:hover { background: var(--border); }

.modal-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg);
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  padding: 8px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  transition: all 0.15s;
}
.tab-btn.active {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.password-strength {
  position: relative;
  height: 4px;
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}
.strength-bg {
  position: absolute;
  inset: 0;
  background: var(--border);
}
.strength-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s, background 0.3s;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  margin: 4px 0;
}
.checkbox-label input { width: 16px; height: 16px; cursor: pointer; }

.btn-submit {
  background: var(--primary);
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
  transition: background 0.15s;
  width: 100%;
}
.btn-submit:hover:not(:disabled) { background: var(--primary-hover); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.error-msg {
  color: var(--danger);
  font-size: 13px;
  padding: 2px 0;
}

.modal-hint {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.link-btn {
  background: none;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
  padding: 0;
}

.email-row {
  display: flex;
  gap: 8px;
}
.email-row input {
  flex: 1;
  min-width: 0;
}

.btn-send-code {
  flex-shrink: 0;
  padding: 8px 12px;
  background: var(--primary);
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-send-code:hover:not(:disabled) { background: var(--primary-hover); }
.btn-send-code:disabled { opacity: 0.6; cursor: not-allowed; }

.verify-success {
  color: #10b981;
  font-size: 13px;
  font-weight: 600;
}
</style>
