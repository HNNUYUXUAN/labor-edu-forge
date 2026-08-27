<template><div v-if="loading" class="empty-state full">正在打开案例…</div><ProjectWorkbench v-else-if="project" :project="project" readonly :template-id="String(route.params.id)" /></template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { LessonProject } from '@labor-edu-forge/shared'
import { getTemplate } from '../api/client'
import ProjectWorkbench from '../components/ProjectWorkbench.vue'
const route = useRoute(); const project = ref<LessonProject>(); const loading = ref(true)
onMounted(async () => { const template = await getTemplate(String(route.params.id)); const now = new Date().toISOString(); project.value = { id: `template:${template.id}`, input: template.input, ...template.content, createdAt: now, updatedAt: now }; loading.value = false })
</script>
