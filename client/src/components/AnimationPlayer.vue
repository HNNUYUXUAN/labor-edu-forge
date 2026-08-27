<template>
  <div class="animation-player">
    <div ref="stage" class="animation-stage" :style="{ background: spec.canvas.background }">
      <svg :viewBox="`0 0 ${spec.canvas.width} ${spec.canvas.height}`" role="img" :aria-label="spec.title">
        <g v-if="spec.sceneType === 'inclined-plane'" class="diagram-annotations" aria-hidden="true">
          <line x1="160" y1="410" x2="785" y2="410" stroke="#9CA0A5" stroke-width="2" stroke-dasharray="10 9" />
          <line x1="160" y1="410" x2="160" y2="195" stroke="#9CA0A5" stroke-width="2" stroke-dasharray="10 9" />
          <path d="M 215 410 A 55 55 0 0 1 212 391" fill="none" stroke="#E00000" stroke-width="3" />
          <text x="174" y="292" fill="#E00000">h</text>
          <text x="219" y="398" fill="#E00000">θ</text>
          <text x="475" y="237" fill="#165DCC">F</text>
          <text x="482" y="355" fill="#555A60">L</text>
        </g>
        <g v-for="object in spec.objects" :key="object.id" :data-object-id="object.id" :transform="`translate(${object.position.x} ${object.position.y})`">
          <rect v-if="object.type === 'rect'" :width="Number(object.style.width || 100)" :height="Number(object.style.height || 72)" :fill="String(object.style.fill || '#B7793C')" rx="3" />
          <circle v-else-if="object.type === 'circle'" :r="Number(object.style.radius || 42)" :fill="String(object.style.fill || '#B7793C')" />
          <line v-else :x1="0" :y1="0" :x2="Number(object.style.length || 360)" :y2="0" :stroke="String(object.style.stroke || '#222222')" :stroke-width="Number(object.style.strokeWidth || 6)" stroke-linecap="round" :transform="`rotate(${Number(object.style.rotate || 0)})`" />
          <template v-if="object.type === 'rect'">
            <path v-for="offset in [22, 52, 82]" :key="offset" :d="`M 0 ${offset} L ${Number(object.style.width || 100)} ${offset - 15}`" stroke="rgba(75,44,19,.28)" stroke-width="3" />
          </template>
          <text v-if="object.type !== 'line'" :x="object.type === 'circle' ? 0 : Number(object.style.width || 100) / 2" :y="object.type === 'circle' ? 5 : Number(object.style.height || 72) / 2 + 5" text-anchor="middle">{{ object.label }}</text>
        </g>
      </svg>
      <span class="animation-caption">{{ currentCaption }}</span>
    </div>
    <div class="player-controls">
      <button type="button" :aria-label="playing ? '暂停' : '播放'" @click="togglePlay"><Pause v-if="playing" :size="20" /><Play v-else :size="20" /></button>
      <span>{{ formatTime(currentTime) }} / {{ formatTime(spec.duration) }}</span>
      <input aria-label="动画进度" type="range" min="0" :max="spec.duration" step="0.1" :value="currentTime" @input="seek" />
      <button type="button" aria-label="重新播放" @click="restart"><RotateCcw :size="19" /></button>
    </div>
    <p class="player-prompt">{{ currentCaption || spec.principle }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createTimeline } from 'animejs'
import { Pause, Play, RotateCcw } from '@lucide/vue'
import type { AnimationSpec } from '@labor-edu-forge/shared'

const props = defineProps<{ spec: AnimationSpec }>()
const stage = ref<HTMLElement>()
const playing = ref(false)
const currentTime = ref(0)
let timeline: ReturnType<typeof createTimeline> | undefined
let frame = 0

const currentCaption = computed(() => [...props.spec.captions].reverse().find((item) => item.at <= currentTime.value)?.text || '')
const formatTime = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`

async function buildTimeline() {
  timeline?.revert()
  await nextTick()
  if (!stage.value) return
  timeline = createTimeline({ autoplay: false, defaults: { duration: 1_200, ease: 'inOutQuad' } })
  for (const action of props.spec.timeline) {
    const target = stage.value.querySelector<SVGGElement>(`[data-object-id="${CSS.escape(action.targetId)}"]`)
    if (!target) continue
    const params: Record<string, string | number> = {}
    if (action.action === 'move') { params.x = Number(action.params.x || 0); params.y = Number(action.params.y || 0) }
    if (action.action === 'rotate') params.rotate = Number(action.params.degree || 0)
    if (action.action === 'fade') params.opacity = Number(action.params.opacity ?? 0.25)
    if (action.action === 'highlight') params.color = String(action.params.color || '#E00000')
    if (action.action === 'showText') params.opacity = 1
    timeline.add(target, params, action.at * 1_000)
  }
  timeline.pause()
  currentTime.value = 0
}

function tick() {
  if (!timeline || !playing.value) return
  currentTime.value = Math.min(timeline.currentTime / 1_000, props.spec.duration)
  if (currentTime.value >= props.spec.duration || timeline.completed) playing.value = false
  else frame = requestAnimationFrame(tick)
}
function togglePlay() {
  if (!timeline) return
  playing.value = !playing.value
  if (playing.value) { timeline.play(); frame = requestAnimationFrame(tick) } else timeline.pause()
}
function restart() { if (!timeline) return; timeline.restart(); playing.value = true; frame = requestAnimationFrame(tick) }
function seek(event: Event) { if (!timeline) return; const value = Number((event.target as HTMLInputElement).value); timeline.seek(value * 1_000); currentTime.value = value }

watch(() => props.spec, buildTimeline, { deep: true })
onMounted(buildTimeline)
onBeforeUnmount(() => { cancelAnimationFrame(frame); timeline?.revert() })
</script>
