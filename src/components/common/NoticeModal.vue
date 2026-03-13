<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-icon">👋</span>
        <h2>AptitudePro 사용 안내</h2>
      </div>

      <div class="notice-content">
        <div class="notice-item">
          <span class="notice-num">01</span>
          <div>
            <strong>시험 유형 선택</strong>
            <p>SKCT, GSAT, NCS, CJ 등 목표 기업의 시험 유형을 선택하고 모의고사를 시작할 수 있습니다.</p>
          </div>
        </div>
        <div class="notice-item">
          <span class="notice-num">02</span>
          <div>
            <strong>대시보드에서 실력 확인</strong>
            <p>응시 기록, 영역별 정확도, 성장 추이를 그래프로 한눈에 확인할 수 있습니다.</p>
          </div>
        </div>
        <div class="notice-item">
          <span class="notice-num">03</span>
          <div>
            <strong>학습 기록 관리</strong>
            <p>오답 노트와 학습 히스토리를 통해 부족한 부분을 집중적으로 복습하세요.</p>
          </div>
        </div>
        <div class="notice-item">
          <span class="notice-num">04</span>
          <div>
            <strong>타이머 & 집중 모드</strong>
            <p>실전처럼 시간 제한을 두고 풀거나, 학습 타이머로 집중력을 관리할 수 있습니다.</p>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-hide-today" @click="$emit('close', true)">오늘 하루 안보기</button>
        <button class="btn-confirm" @click="$emit('close', false)">확인</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(2px);
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  width: 480px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.modal-icon {
  font-size: 24px;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.notice-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 28px;
}

.notice-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.notice-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: var(--accent);
  color: #fff;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notice-item strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 3px;
}

.notice-item p {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-hide-today {
  flex: 1;
  padding: 11px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  transition: background 0.15s;
}
.btn-hide-today:hover { background: var(--border); }

.btn-confirm {
  flex: 1;
  padding: 11px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--primary);
  transition: background 0.15s;
}
.btn-confirm:hover { background: var(--primary-hover); }
</style>
