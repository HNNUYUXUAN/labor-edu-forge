import type {
  AnimationSpec,
  CreateProjectInput,
  LessonProject,
  LessonTemplate,
  ProjectListItem,
  UpdateProjectInput,
} from '@labor-edu-forge/shared'

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  }).catch(() => { throw new ApiError(0, 'NETWORK_UNAVAILABLE', '无法连接本机服务，请确认服务已启动后重试。') })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string; message?: string; details?: string[] }
    throw new ApiError(response.status, payload.error || 'REQUEST_FAILED', payload.message || payload.details?.[0] || '请求失败，请稍后重试。')
  }
  return response.json().catch(() => { throw new ApiError(response.status, 'INVALID_RESPONSE', '服务返回的内容暂时无法读取，请重试。') }) as Promise<T>
}

export type HealthStatus = { status: 'ok'; providerReady: boolean; model: string }
export const getHealth = () => request<HealthStatus>('/api/health')
export const listTemplates = () => request<Array<Omit<LessonTemplate, 'content'>>>('/api/templates')
export const getTemplate = (id: string) => request<LessonTemplate>(`/api/templates/${id}`)
export const createProject = (input: CreateProjectInput) => request<LessonProject>('/api/projects', { method: 'POST', body: JSON.stringify(input) })
export const listProjects = () => request<ProjectListItem[]>('/api/projects')
export const getProject = (id: string) => request<LessonProject>(`/api/projects/${id}`)
export const updateProject = (id: string, update: UpdateProjectInput) => request<LessonProject>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(update) })
export const refineAnimation = (id: string, instruction: string, expectedUpdatedAt: string) => request<LessonProject>(`/api/projects/${id}/animation/refine`, { method: 'POST', body: JSON.stringify({ instruction, expectedUpdatedAt }) })
export const exportUrl = (id: string) => `/api/projects/${id}/export`

export type EditableSection = 'lessonDesign' | 'studentTaskSheet' | 'rubric' | 'animation'
export type SectionValue = LessonProject[EditableSection]
export type { AnimationSpec, CreateProjectInput, LessonProject, LessonTemplate, ProjectListItem }
