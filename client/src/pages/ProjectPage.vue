<template>
  <div v-if="loading" class="empty-state full" role="status">正在打开备课项目…</div>
  <div v-else-if="error" class="empty-state full" role="alert"><h1>{{ missing ? '没有找到这份备课' : '暂时无法打开备课' }}</h1><p>{{ error }}</p><button v-if="!missing" class="button primary" @click="reload">重新加载</button><RouterLink to="/projects">返回我的备课</RouterLink></div>
  <ProjectWorkbench v-else-if="project" :key="project.id" :project="project" />
</template>
<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProject } from '../api/client'
import { useLoadable } from '../lib/useLoadable'
import ProjectWorkbench from '../components/ProjectWorkbench.vue'
const route = useRoute()
const {data:project, loading, error, missing, reload} = useLoadable(()=>getProject(String(route.params.id)))
watch(()=>route.params.id, reload, {immediate:true})
</script>
