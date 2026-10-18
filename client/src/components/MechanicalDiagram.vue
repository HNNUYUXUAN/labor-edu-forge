<template>
  <svg viewBox="0 0 960 540" role="img" :aria-label="spec.title" :data-mechanism="spec.lever ? 'lever' : 'pulley'">
    <defs><marker :id="arrowId" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 Z" fill="context-stroke" /></marker></defs>
    <g v-if="lever && spec.lever">
      <SvgLabel x="38" y="40" :text="`${lever.balanced ? '力矩相等 · 松手平衡' : '扶平调砣 · 尚未达到平衡'}`" />
      <SvgLabel x="38" y="76" :text="`左侧 ${lever.loadTorque.toFixed(2)} N·m / 右侧 ${lever.counterTorque.toFixed(2)} N·m`" />
      <path d="M 370 250 L 342 302 L 398 302 Z" fill="#68788A" />
      <line x1="370" y1="302" x2="370" y2="410" stroke="#68788A" stroke-width="10" />
      <line x1="310" y1="415" x2="430" y2="415" stroke="#68788A" stroke-width="8" />
      <line data-object-id="beam" x1="160" y1="250" x2="830" y2="250" stroke="#A96D35" stroke-width="8" />
      <circle data-object-id="pivot" cx="370" cy="250" r="7" fill="#243248" />
      <line data-object-id="load-link" :x1="lever.loadX" y1="250" :x2="lever.loadX" y2="330" stroke="#707A87" stroke-width="3" />
      <rect data-object-id="load" :x="lever.loadX - 40" y="330" width="80" height="52" rx="4" fill="#E4B77E" />
      <SvgLabel :x="lever.loadX" y="362" text-anchor="middle" :text="`${spec.lever.loadMassKg} kg`" />
      <line data-object-id="counter-link" :x1="lever.counterX" y1="250" :x2="lever.counterX" y2="330" stroke="#707A87" stroke-width="3" />
      <rect data-object-id="counterweight" :x="lever.counterX - 40" y="330" width="80" height="52" rx="4" fill="#AFC4DF" />
      <SvgLabel :x="lever.counterX" y="362" text-anchor="middle" :text="`${spec.lever.counterweightMassKg} kg`" />
      <line data-object-id="load-force" :x1="lever.loadX" y1="250" :x2="lever.loadX" :y2="250 + lever.loadForce * forceScale" stroke="#C23B32" stroke-width="3" :marker-end="arrow" />
      <line data-object-id="counter-force" :x1="lever.counterX" y1="250" :x2="lever.counterX" :y2="250 + lever.counterForce * forceScale" stroke="#165DCC" stroke-width="3" :marker-end="arrow" />
      <line v-if="lever.handForce > 0.000001" data-object-id="hand-force" :x1="lever.loadX" y1="250" :x2="lever.loadX" :y2="250 - lever.handForce * forceScale" stroke="#27835D" stroke-width="4" :marker-end="arrow" />
      <SvgLabel :x="lever.loadX - 14" y="168" text-anchor="middle" fill="#27835D" :text="`扶平力 ${lever.handForce.toFixed(2)} N`" />
      <line data-object-id="reaction" x1="370" y1="250" x2="370" :y2="250 - lever.reaction * forceScale" stroke="#8655A2" stroke-width="3" :marker-end="arrow" />
      <SvgLabel x="390" y="145" :text="`R=${lever.reaction.toFixed(2)} N`" />
      <line :x1="lever.loadX" y1="438" x2="370" y2="438" stroke="#969EAA" stroke-width="2" />
      <line x1="370" y1="438" :x2="lever.counterX" y2="438" stroke="#165DCC" stroke-width="2" />
      <SvgLabel :x="(lever.loadX + 370) / 2" y="466" text-anchor="middle" :text="`${spec.lever.loadArmM.toFixed(2)} m`" />
      <SvgLabel :x="(lever.counterX + 370) / 2" y="466" text-anchor="middle" :text="`${lever.counterArmM.toFixed(3)} m`" />
      <SvgLabel x="38" y="512" :text="`水平杆秤已调零 · 扶平调砣 → 力矩相等 → 松手`" />
    </g>
    <g v-else-if="pulley && spec.pulley">
      <SvgLabel x="38" y="40" :text="`${spec.pulley.mode === 'fixed' ? '定滑轮：改变方向，不省力' : '动滑轮 + 定导向轮：两段绳承担载荷'}`" />
      <SvgLabel x="38" y="76" :text="`m=${spec.pulley.massKg} kg · F=T=${pulley.tension.toFixed(2)} N`" />
      <line x1="320" y1="90" x2="580" y2="90" stroke="#68788A" stroke-width="8" />
      <line :x1="pulley.wheel.x" y1="90" :x2="pulley.wheel.x" :y2="pulley.wheel.y" stroke="#68788A" stroke-width="5" />
      <g data-object-id="fixed-wheel" :transform="`translate(${pulley.wheel.x} ${pulley.wheel.y}) rotate(${pulley.wheelAngle})`">
        <circle :r="pulley.wheel.r" fill="#E0E7EF" stroke="#68788A" stroke-width="2" />
        <line :x1="-pulley.wheel.r" y1="0" :x2="pulley.wheel.r" y2="0" stroke="#68788A" stroke-width="2" />
        <line x1="0" :y1="-pulley.wheel.r" x2="0" :y2="pulley.wheel.r" stroke="#68788A" stroke-width="2" />
      </g>
      <g v-if="pulley.movingWheel" data-object-id="moving-wheel" :transform="`translate(${pulley.movingWheel.x} ${pulley.movingWheel.y}) rotate(${pulley.movingAngle})`">
        <circle :r="pulley.movingWheel.r" fill="#BCD1E5" stroke="#68788A" stroke-width="2" />
        <line x1="-30" y1="0" x2="30" y2="0" stroke="#68788A" stroke-width="2" />
        <line x1="0" y1="-30" x2="0" y2="30" stroke="#68788A" stroke-width="2" />
      </g>
      <path data-object-id="rope" :d="pulley.ropePath" fill="none" stroke="#A96D35" stroke-width="4" />
      <circle v-if="pulley.movingWheel" data-object-id="rope-anchor" cx="370" cy="90" r="6" fill="#A96D35" />
      <circle :cx="pulley.wheel.x" :cy="pulley.wheel.y" r="4" fill="#243248" />
      <g v-if="pulley.movingWheel">
        <line data-object-id="axle-link" :x1="pulley.movingWheel.x" :y1="pulley.movingWheel.y" :x2="pulley.hook.x" :y2="pulley.hook.y" stroke="#68788A" stroke-width="3" />
        <circle :cx="pulley.movingWheel.x" :cy="pulley.movingWheel.y" r="4" fill="#243248" />
      </g>
      <line data-object-id="bucket-link" :x1="pulley.hook.x" :y1="pulley.hook.y" :x2="pulley.hook.x" :y2="pulley.hook.y+16" stroke="#68788A" stroke-width="3" />
      <rect data-object-id="bucket" :x="pulley.hook.x-40" :y="pulley.hook.y+16" width="80" height="52" rx="6" fill="#9FC6E0" />
      <SvgLabel :x="pulley.hook.x" :y="pulley.hook.y+48" text-anchor="middle" :text="`水桶`" />
      <line data-object-id="weight" :x1="pulley.hook.x" :y1="pulley.hook.y+52" :x2="pulley.hook.x" :y2="pulley.hook.y+100" stroke="#C23B32" stroke-width="3" :marker-end="arrow" />
      <SvgLabel :x="pulley.hook.x-42" :y="pulley.hook.y+95" fill="#C23B32" :text="`mg`" />
      <line data-object-id="pull" :x1="pulley.freeEnd.x" :y1="pulley.freeEnd.y" :x2="pulley.freeEnd.x" :y2="pulley.freeEnd.y+48/pulley.strands" stroke="#165DCC" stroke-width="4" :marker-end="arrow" />
      <circle data-object-id="free-end" :cx="pulley.freeEnd.x" :cy="pulley.freeEnd.y" r="5" fill="#165DCC" />
      <SvgLabel :x="pulley.freeEnd.x+16" :y="pulley.freeEnd.y+35" fill="#165DCC" :text="`F 向下拉`" />
      <template v-if="pulley.movingWheel">
        <line v-for="(x,index) in [370,430]" :key="x" :data-object-id="`support-${index}`" :x1="x" :y1="pulley.movingWheel.y" :x2="x" :y2="pulley.movingWheel.y-48/pulley.strands" stroke="#27835D" stroke-width="3" :marker-end="arrow" />
        <SvgLabel x="348" :y="pulley.movingWheel.y-45" fill="#27835D" :text="`T`" /><SvgLabel x="438" :y="pulley.movingWheel.y-45" fill="#27835D" :text="`T`" />
      </template>
      <template v-else>
        <line data-object-id="support-0" :x1="pulley.hook.x" :y1="pulley.hook.y" :x2="pulley.hook.x" :y2="pulley.hook.y-48" stroke="#27835D" stroke-width="3" :marker-end="arrow" />
        <SvgLabel :x="pulley.hook.x-22" :y="pulley.hook.y-35" fill="#27835D" :text="`T`" />
      </template>
      <SvgLabel x="70" y="212" :text="`上升 h=${pulley.liftedM.toFixed(2)} m`" />
      <SvgLabel x="650" y="212" :text="`拉绳 s=${pulley.pulledM.toFixed(2)} m`" />
      <SvgLabel x="70" y="250" :text="`${pulley.strands}T=mg`" /><SvgLabel x="650" y="250" :text="`s=${pulley.strands}h`" />
      <SvgLabel x="38" y="518" :text="`理想模型 · 绳长不变 · Fs=mgh · 到位后固定绳端`" />
    </g>
  </svg>
</template>
<script setup lang="ts">
import SvgLabel from './SvgLabel.vue'
import { computed, useId } from 'vue'
import { sampleLever, samplePulley, type AnimationSpec } from '@labor-edu-forge/shared'
const props = defineProps<{ spec: AnimationSpec; time: number }>()
const arrowId = `mechanical-arrow-${useId()}`
const arrow = `url(#${arrowId})`
const lever = computed(() => props.spec.lever ? sampleLever(props.spec.lever, props.time) : undefined)
const forceScale = computed(() => lever.value ? 100 / (lever.value.loadForce + lever.value.counterForce) : 1)
const pulley = computed(() => props.spec.pulley ? samplePulley(props.spec.pulley, props.time) : undefined)
</script>

