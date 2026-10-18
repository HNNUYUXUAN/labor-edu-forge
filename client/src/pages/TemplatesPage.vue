<template>
  <section class="collection-page">
    <header class="collection-header"><div><h1>案例模板</h1><p>从经过整理的真实劳动任务出发，先看完整结构，再决定是否用于自己的课堂。</p></div><RouterLink class="button primary" to="/new">新建备课<ArrowRight :size="20" /></RouterLink></header>
    <div v-if="loading" class="empty-state" role="status">正在读取案例…</div>
    <div v-else-if="error" class="empty-state" role="alert"><h2>暂时无法读取案例</h2><p>{{ error }}</p><button class="button primary" @click="reload">重新加载</button></div>
    <div v-else class="editorial-list">
      <RouterLink v-for="(template, index) in templates" :key="template.id" :to="`/templates/${template.id}`" class="editorial-item">
        <span class="item-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="item-main"><strong>{{ template.title }}</strong><small>{{ template.summary }}</small></span>
        <span class="item-meta">{{ template.input.gradeLevel }}<br />{{ template.input.durationMinutes }} 分钟 · {{ template.input.subject }}</span>
        <ArrowUpRight :size="24" />
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowRight, ArrowUpRight } from '@lucide/vue'
import { useLoadable } from '../lib/useLoadable'
import { listTemplates } from '../api/client'
const {data:templates, loading, error, reload} = useLoadable(listTemplates)
onMounted(reload)
</script>
