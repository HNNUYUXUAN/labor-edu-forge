<template>
  <div class="animation-player">
    <div class="animation-stage" :style="{ background: scene.canvas.background }">
      <MechanicalDiagram v-if="scene.lever || scene.pulley" :spec="scene" :time="currentTime" />
      <svg v-else :viewBox="`0 0 ${scene.canvas.width} ${scene.canvas.height}`" role="img" :aria-label="scene.title">
        <g v-for="item in frames" :key="item.object.id" :data-object-id="item.object.id"
          :transform="`translate(${item.object.position.x + item.x} ${item.object.position.y + item.y})`" :opacity="item.opacity">
          <title>{{ item.object.label }}</title>
          <g :transform="`rotate(${Number(item.object.style.rotate || 0) + item.rotation})`">
            <rect v-if="item.object.type === 'rect'" :width="Number(item.object.style.width || 100)" :height="Number(item.object.style.height || 72)" :fill="String(item.color || item.object.style.fill || '#B7793C')" rx="2" />
            <circle v-else-if="item.object.type === 'circle'" :r="Number(item.object.style.radius || 42)" :fill="String(item.color || item.object.style.fill || '#B7793C')" />
            <template v-else>
              <line x1="0" y1="0" :x2="Number(item.object.style.length || 360)" y2="0" :stroke="String(item.color || item.object.style.stroke || '#222222')" :stroke-width="Number(item.object.style.strokeWidth || 6)" />
              <path v-if="item.object.style.arrow" :d="arrowHead(Number(item.object.style.length))" :fill="String(item.color || item.object.style.stroke)" />
            </template>
            <text v-if="item.object.type !== 'line' && !(scene.inclinedPlane && item.object.id === 'load')" :x="item.object.type === 'circle' ? 0 : Number(item.object.style.width || 100) / 2" :y="item.object.type === 'circle' ? 5 : Number(item.object.style.height || 72) / 2 + 7" text-anchor="middle">{{ item.text || item.object.label }}</text>
          </g>
          <text v-if="item.object.type === 'line' && item.object.style.showLabel"
            :x="lineEnd(item).x - (item.object.id === 'friction' ? 28 : 0)" :y="lineEnd(item).y + (['weight', 'friction'].includes(item.object.id) ? 18 : -10)" text-anchor="middle" :style="{ fill: String(item.object.style.stroke) }">{{ item.object.label }}</text>
        </g>
        <g v-if="scene.inclinedPlane" class="physics-legend">
          <text x="38" y="42">θ = {{ scene.inclinedPlane.angleDegrees }}° · m = {{ scene.inclinedPlane.massKg }} kg · μ = {{ scene.inclinedPlane.frictionCoefficient }}</text>
          <text x="38" y="78">F 沿斜面向上 · mg 竖直向下 · N 垂直斜面</text>
          <text x="38" y="505">固定斜面匀速搬运 · 到顶端停稳后交接</text>
        </g>
      </svg>
    </div>
    <div class="player-controls">
      <button type="button" :aria-label="playing ? '暂停' : '播放'" @click="togglePlay"><Pause v-if="playing" :size="20" /><Play v-else :size="20" /></button>
      <span>{{ formatTime(currentTime) }} / {{ formatTime(scene.duration) }}</span>
      <input aria-label="动画进度" type="range" min="0" :max="scene.duration" step="0.1" :value="currentTime" @input="seek" />
      <button type="button" aria-label="重新播放" @click="restart"><RotateCcw :size="19" /></button>
    </div>
    <p class="player-prompt" aria-live="off">{{ currentCaption || '播放或拖动进度，观察动作与受力的变化。' }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Pause, Play, RotateCcw } from '@lucide/vue'
import { buildPhysicsAnimation, type AnimationSpec } from '@labor-edu-forge/shared'
import { compileAnimationFrames } from '../lib/animationFrame'
import MechanicalDiagram from './MechanicalDiagram.vue'

const props = defineProps<{ spec: AnimationSpec }>()
const scene = computed(() => buildPhysicsAnimation(props.spec))
const playing = ref(false)
const currentTime = ref(0)
const tracks = computed(() => compileAnimationFrames(scene.value))
const frames = computed(() => tracks.value.map((sample) => sample(currentTime.value)))
const currentCaption = computed(() => [...scene.value.captions].sort((a, b) => b.at - a.at).find((item) => item.at <= currentTime.value)?.text || '')
const formatTime = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`
const arrowHead = (length: number) => {
  const size = Math.min(12, length / 2)
  return `M ${length} 0 l ${-size} ${-size / 2} l 0 ${size} Z`
}
const lineEnd = (item: typeof frames.value[number]) => {
  const angle = (Number(item.object.style.rotate || 0) + item.rotation) * Math.PI / 180
  const length = Number(item.object.style.length || 360) + 14
  return { x: length * Math.cos(angle), y: length * Math.sin(angle) }
}
let frame = 0
let startedAt = 0
function stop() { cancelAnimationFrame(frame); playing.value = false }
function tick(now: number) {
  currentTime.value = Math.min((now - startedAt) / 1000, scene.value.duration)
  if (currentTime.value >= scene.value.duration) stop()
  else frame = requestAnimationFrame(tick)
}
function play() {
  cancelAnimationFrame(frame)
  if (currentTime.value >= scene.value.duration) currentTime.value = 0
  startedAt = performance.now() - currentTime.value * 1000
  playing.value = true
  frame = requestAnimationFrame(tick)
}
function togglePlay() { if (playing.value) stop(); else play() }
function restart() { currentTime.value = 0; play() }
function seek(event: Event) {
  currentTime.value = Number((event.target as HTMLInputElement).value)
  if (playing.value) startedAt = performance.now() - currentTime.value * 1000
}
watch(scene, () => { stop(); currentTime.value = 0 })
onBeforeUnmount(stop)
</script>
