<template>
  <div style="width:100%;height:200px;display:flex;align-items:center;justify-content:center;">
    <Radar :data="props.data" :options="options" />
  </div>
</template>

<script setup>
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend
} from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps({ data: Object })

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    r: {
      min: 0,
      max: 20,
      ticks: { display: false, stepSize: 5 },
      grid: { color: '#e5e7eb' },
      pointLabels: { font: { size: 11 }, color: '#374151' }
    }
  }
}
</script>
