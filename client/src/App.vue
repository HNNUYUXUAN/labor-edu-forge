<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/new" aria-label="劳育备课工坊首页">
        <span class="brand-mark">劳</span>
        <span>劳育备课工坊</span>
      </RouterLink>
      <nav class="primary-nav" aria-label="主要导航">
        <RouterLink to="/new"><SquarePen :size="23" />新建备课</RouterLink>
        <RouterLink to="/projects"><Folder :size="23" />我的备课</RouterLink>
        <RouterLink to="/templates"><PanelsTopLeft :size="23" />案例模板</RouterLink>
      </nav>
      <section v-if="sidebarItems.length" class="sidebar-index">
        <header><span>{{ showingTemplates ? '精选案例' : '我的项目' }}</span><RouterLink to="/new" aria-label="新建备课"><Plus :size="20" /></RouterLink></header>
        <RouterLink v-for="item in sidebarItems" :key="item.id" :to="`${showingTemplates ? '/templates' : '/projects'}/${item.id}`" class="sidebar-index-item">
          <FileText :size="21" /><span><strong :title="item.title">{{ item.title }}</strong><small>{{ item.gradeLevel }} · {{ item.durationMinutes }} 分钟</small></span>
        </RouterLink>
      </section>
      <div class="sidebar-spacer" />
      <RouterLink class="guide-link" to="/guide"><BookOpen :size="22" />使用指南</RouterLink>
    </aside>
    <header class="mobile-header">
      <RouterLink class="brand" to="/new"><span class="brand-mark">劳</span><span>劳育备课工坊</span></RouterLink>
      <button :aria-label="mobileOpen ? '关闭导航' : '打开导航'" :aria-expanded="mobileOpen" @click="mobileOpen = !mobileOpen"><Menu :size="24" /></button>
    </header>
    <nav v-if="mobileOpen" class="mobile-nav">
      <RouterLink to="/new" @click="mobileOpen = false">新建备课</RouterLink>
      <RouterLink to="/projects" @click="mobileOpen = false">我的备课</RouterLink>
      <RouterLink to="/templates" @click="mobileOpen = false">案例模板</RouterLink>
      <RouterLink to="/guide" @click="mobileOpen = false">使用指南</RouterLink>
    </nav>
    <main class="app-main"><RouterView /></main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BookOpen, FileText, Folder, Menu, PanelsTopLeft, Plus, SquarePen } from '@lucide/vue'
import { listProjects, listTemplates } from './api/client'

const mobileOpen = ref(false)
const route = useRoute()
const showingTemplates = computed(() => route.path.startsWith('/templates'))
const sidebarItems = ref<Array<{ id: string; title: string; gradeLevel: string; durationMinutes: number }>>([])

watch(() => route.fullPath, async (_path, _old, onCleanup) => {
  let active = true
  onCleanup(()=>{ active=false })
  mobileOpen.value = false
  if (showingTemplates.value) {
    const templates = await listTemplates().catch(() => [])
    if (active) sidebarItems.value = templates.map((item) => ({ id: item.id, title: item.title, gradeLevel: item.input.gradeLevel, durationMinutes: item.input.durationMinutes }))
  } else if (route.path.startsWith('/projects')) {
    const items = await listProjects().catch(() => [])
    if (active) sidebarItems.value = items
  } else sidebarItems.value = []
}, { immediate: true })
</script>
