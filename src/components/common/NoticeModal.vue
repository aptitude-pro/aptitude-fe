<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>AptitudePro 사용 가이드</h2>
      </div>

      <div class="guide-image-wrap">
        <img src="/가이드북.png" alt="사용 가이드" class="guide-image" />
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
  padding: 28px;
  width: 560px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  margin-bottom: 16px;
}

.modal-header h2 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
}

.guide-image-wrap {
  margin-bottom: 24px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.guide-image {
  width: 100%;
  display: block;
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
