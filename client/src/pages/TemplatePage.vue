<template>
  <div v-if="loading" class="empty-state full" role="status">正在打开案例…</div>
  <div v-else-if="error" class="empty-state full" role="alert"><h1>{{ missing ? '没有找到这个案例' : '暂时无法打开案例' }}</h1><p>{{ error }}</p><button v-if="!missing" class="button primary" @click="reload">重新加载</button><RouterLink to="/templates">返回案例模板</RouterLink></div>
  <ProjectWorkbench v-else-if="project" :key="project.id" :project="project" readonly :template-id="String(route.params.id)" />
</template>
<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { getTemplate } from '../api/client'
import { useLoadable } from '../lib/useLoadable'
import ProjectWorkbench from '../components/ProjectWorkbench.vue'
const route = useRoute()
const {data:project, loading, error, missing, reload} = useLoadable(async()=>{
  const template = await getTemplate(String(route.params.id)), now = new Date().toISOString()
  return {id:`template:${template.id}`,input:template.input,...template.content,createdAt:now,updatedAt:now}
})
watch(()=>route.params.id, reload, {immediate:true})
</script>
