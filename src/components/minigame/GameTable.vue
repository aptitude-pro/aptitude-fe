<template>
  <div class="table-wrap">
    <table class="game-table">
      <thead>
        <tr>
          <th class="corner"></th>
          <th v-for="col in table.cols" :key="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in table.rows" :key="row">
          <td class="row-label">{{ row }}</td>
          <td
            v-for="(col, ci) in table.cols"
            :key="ci"
            :class="['cell', { highlighted: isHighlighted(ri, ci) }]"
          >{{ fmt(table.data[ri][ci]) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt } from '@/utils/tableGenerator'

const props = defineProps({
  table: { type: Object, required: true },
  highlights: { type: Array, default: () => [] }
})

const highlightSet = computed(() => new Set(props.highlights.map(h => `${h.ri}-${h.ci}`)))
function isHighlighted(ri, ci) {
  return highlightSet.value.has(`${ri}-${ci}`)
}
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
}

.game-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.game-table th, .game-table td {
  padding: 7px 10px;
  border: 1px solid #e5e7eb;
  text-align: right;
  white-space: nowrap;
}

.game-table thead th {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.corner {
  background: #f3f4f6;
  text-align: center !important;
}

.row-label {
  font-weight: 600;
  color: #374151;
  text-align: left !important;
  background: #fafafa;
}

.cell {
  color: #1f2937;
  transition: background 0.15s;
}

.cell.highlighted {
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
}
</style>
