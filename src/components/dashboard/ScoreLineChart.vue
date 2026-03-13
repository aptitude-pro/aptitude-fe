<template>
  <div class="chart-container" style="width:100%;height:200px;">
    <Line :data="props.data" :options="options" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps({
  data: Object,
  max: { type: Number, default: 100 }
})

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111827',
      padding: 10,
      cornerRadius: 8,
      callbacks: { label: ctx => `  ${ctx.raw}점` }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#9ca3af' }
    },
    y: {
      min: 0,
      max: props.max,
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 11 }, color: '#9ca3af', stepSize: props.max / 5 }
    }
  }
}))
</script>
