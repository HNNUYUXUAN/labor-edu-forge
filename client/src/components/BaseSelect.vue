<template>
  <SelectRoot :model-value="modelValue" @update:model-value="$emit('update:modelValue', String($event))">
    <SelectTrigger class="select-trigger" :aria-label="label">
      <SelectValue :placeholder="placeholder" />
      <SelectIcon><ChevronDown :size="21" :stroke-width="1.8" /></SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="select-content" position="popper" :side-offset="6">
        <SelectViewport>
          <SelectItem v-for="option in options" :key="option.value" class="select-item" :value="option.value">
            <SelectItemText>{{ option.label }}</SelectItemText>
            <SelectItemIndicator><Check :size="17" /></SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup lang="ts">
import {
  SelectContent, SelectIcon, SelectItem, SelectItemIndicator, SelectItemText,
  SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport,
} from 'reka-ui'
import { Check, ChevronDown } from '@lucide/vue'

defineProps<{
  modelValue: string
  label: string
  placeholder?: string
  options: Array<{ label: string; value: string }>
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
