<template>
  <foreignObject :x="left" :y="Number(y) - 24" :width="width" height="44" class="svg-label" :style="{ color: fill }">
    <div xmlns="http://www.w3.org/1999/xhtml" :style="{ textAlign: align }"><MathText :text="text" legacy /></div>
  </foreignObject>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MathText from './MathText.vue'
const props = withDefaults(defineProps<{ x: number | string; y: number | string; text: string; textAnchor?: string; width?: number; fill?: string }>(), { width: 850, fill: 'currentColor' })
const align = computed(() => props.textAnchor === 'middle' ? 'center' : props.textAnchor === 'end' ? 'right' : 'left')
const left = computed(() => Number(props.x) - (props.textAnchor === 'middle' ? props.width / 2 : props.textAnchor === 'end' ? props.width : 0))
</script>
