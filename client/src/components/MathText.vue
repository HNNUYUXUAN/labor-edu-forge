<template>
  <span class="math-text"><template v-for="(part, index) in parts" :key="index"><span v-if="part.html" class="math-expression" :class="{ 'display-math': part.display }" v-html="part.html" /><template v-else>{{ part.text }}</template></template></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { splitMathText } from '../lib/mathText'
const props = defineProps<{ text: string; legacy?: boolean }>()
const parts = computed(() => splitMathText(props.text, props.legacy))
</script>
