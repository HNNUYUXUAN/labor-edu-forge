<template><div v-if="loading" class="empty-state full">正在打开备课项目…</div><ProjectWorkbench v-else-if="project" :project="project" /><div v-else class="empty-state full"><h1>没有找到这份备课</h1><RouterLink to="/projects">返回我的备课</RouterLink></div></template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { LessonProject } from '@labor-edu-forge/shared'
import { getProject } from '../api/client'
import ProjectWorkbench from '../components/ProjectWorkbench.vue'
const route = useRoute(); const project = ref<LessonProject>(); const loading = ref(true)
onMounted(async () => { try { project.value = await getProject(String(route.params.id)) } finally { loading.value = false } })
</script>
