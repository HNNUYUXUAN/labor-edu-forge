<template>
  <section class="collection-page">
    <header class="collection-header"><div><h1>我的备课</h1><p>本机保存的备课项目。修改保存成功后，可在这里继续编辑和导出。</p></div><RouterLink class="button primary" to="/new">新建备课<Plus :size="20" /></RouterLink></header>
    <div v-if="loading" class="empty-state">正在读取备课…</div>
    <div v-else-if="error" class="empty-state" role="alert"><h2>暂时无法读取备课</h2><p>{{ error }}</p><button class="button primary" @click="reload">重新加载</button></div>
    <div v-else-if="projects?.length" class="editorial-list">
      <RouterLink v-for="(project, index) in projects" :key="project.id" :to="`/projects/${project.id}`" class="editorial-item">
        <span class="item-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="item-main"><strong>{{ project.title }}</strong><small>{{ formatDate(project.updatedAt) }} 更新</small></span>
        <span class="item-meta">{{ project.gradeLevel }}<br />{{ project.durationMinutes }} 分钟 · {{ project.subject }}</span>
        <ArrowUpRight :size="24" />
      </RouterLink>
    </div>
    <div v-else class="empty-state"><FileText :size="34" /><h2>还没有备课项目</h2><p>先浏览一个完整案例，或开始准备自己的课堂。</p><RouterLink class="button secondary" to="/templates">先看案例</RouterLink><RouterLink class="button primary" to="/new">开始第一份备课</RouterLink></div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowUpRight, FileText, Plus } from '@lucide/vue'
import { useLoadable } from '../lib/useLoadable'
import { listProjects } from '../api/client'
const {data:projects, loading, error, reload} = useLoadable(listProjects)
const formatDate = (value: string) => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
onMounted(reload)
</script>
