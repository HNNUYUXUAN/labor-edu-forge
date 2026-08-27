<template>
  <section class="collection-page">
    <header class="collection-header"><div><h1>我的备课</h1><p>本机保存的备课项目。所有修改会在编辑过程中自动保存。</p></div><RouterLink class="button primary" to="/new">新建备课<Plus :size="20" /></RouterLink></header>
    <div v-if="loading" class="empty-state">正在读取备课…</div>
    <div v-else-if="projects.length" class="editorial-list">
      <RouterLink v-for="(project, index) in projects" :key="project.id" :to="`/projects/${project.id}`" class="editorial-item">
        <span class="item-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="item-main"><strong>{{ project.title }}</strong><small>{{ formatDate(project.updatedAt) }} 更新</small></span>
        <span class="item-meta">{{ project.gradeLevel }}<br />{{ project.durationMinutes }} 分钟 · {{ project.subject }}</span>
        <ArrowUpRight :size="24" />
      </RouterLink>
    </div>
    <div v-else class="empty-state"><FileText :size="34" /><h2>还没有备课项目</h2><p>配置百炼密钥后，从一个真实劳动场景开始。</p><RouterLink class="button primary" to="/new">开始第一份备课</RouterLink></div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowUpRight, FileText, Plus } from '@lucide/vue'
import type { ProjectListItem } from '@labor-edu-forge/shared'
import { listProjects } from '../api/client'
const projects = ref<ProjectListItem[]>([])
const loading = ref(true)
const formatDate = (value: string) => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
onMounted(async () => { try { projects.value = await listProjects() } finally { loading.value = false } })
</script>
