import { createRouter, createWebHistory } from 'vue-router'
import NewProjectPage from '../pages/NewProjectPage.vue'
import ProjectsPage from '../pages/ProjectsPage.vue'
import ProjectPage from '../pages/ProjectPage.vue'
import TemplatesPage from '../pages/TemplatesPage.vue'
import TemplatePage from '../pages/TemplatePage.vue'
import GuidePage from '../pages/GuidePage.vue'

export default createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: '/new' },
    { path: '/new', name: 'new', component: NewProjectPage },
    { path: '/projects', name: 'projects', component: ProjectsPage },
    { path: '/projects/:id', name: 'project', component: ProjectPage },
    { path: '/templates', name: 'templates', component: TemplatesPage },
    { path: '/templates/:id', name: 'template', component: TemplatePage },
    { path: '/guide', name: 'guide', component: GuidePage },
  ],
})
