import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import { localAccess } from './lib/localAccess.js'
import {
  createProjectInputSchema,
  refineAnimationInputSchema,
  updateProjectInputSchema,
  type LessonProject,
} from '@labor-edu-forge/shared'
import { getTemplate, lessonTemplates } from './data/templates.js'
import { buildProjectArchive } from './services/exportService.js'
import {
  createProject,
  getProject,
  listProjects,
  ProjectConflictError,
  replaceAnimation,
  updateProject,
} from './services/projectRepository.js'
import {
  generateProjectContent,
  ProviderNotConfiguredError,
  ProviderResponseError,
  providerStatus,
  refineAnimation,
} from './services/qwenProvider.js'

type AppServices = {
  generateContent: typeof generateProjectContent
  refineSpec: typeof refineAnimation
  status: typeof providerStatus
}

function validationMessage(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
}

function providerMessage(error: unknown) {
  if (error instanceof ProviderResponseError) return error.message
  const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 0
  if (status === 401 || status === 403) return '百炼密钥无效、已失效或无权调用当前模型，请检查本地配置。'
  if (status === 429) return '模型服务当前请求较多或额度不足，请稍后重试并检查账户额度。'
  if (status >= 500) return '百炼服务暂时不可用，请稍后重试。'
  if (error instanceof Error && /timeout|timed out/i.test(error.message)) return '模型生成超时，请检查网络后重试。'
  return '模型服务调用失败，请检查本地配置和网络。'
}

export function createApp(overrides: Partial<AppServices> = {}) {
  const services: AppServices = {
    generateContent: overrides.generateContent || generateProjectContent,
    refineSpec: overrides.refineSpec || refineAnimation,
    status: overrides.status || providerStatus,
  }
  const app = express()
  app.disable('x-powered-by')
  app.use(localAccess)
  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '256kb' }))

  app.get('/api/health', (_request, response) => {
    const provider = services.status()
    response.json({ status: 'ok', providerReady: provider.ready, model: provider.model })
  })

  app.get('/api/templates', (_request, response) => {
    response.json(lessonTemplates.map(({ content: _content, ...template }) => template))
  })

  app.get('/api/templates/:id', (request, response) => {
    const template = getTemplate(request.params.id)
    if (!template) return response.status(404).json({ error: 'TEMPLATE_NOT_FOUND', message: '没有找到这个案例模板。' })
    response.json(template)
  })

  app.post('/api/projects', async (request, response) => {
    const input = createProjectInputSchema.safeParse(request.body)
    if (!input.success) return response.status(422).json({ error: 'VALIDATION_FAILED', details: validationMessage(input.error) })
    try {
      const content = await services.generateContent(input.data)
      const now = new Date().toISOString()
      const project: LessonProject = { id: randomUUID(), input: input.data, ...content, createdAt: now, updatedAt: now }
      await createProject(project)
      response.status(201).json(project)
    } catch (error) {
      if (error instanceof ProviderNotConfiguredError) return response.status(503).json({ error: 'PROVIDER_NOT_CONFIGURED', message: '当前本地服务未配置百炼密钥，不能生成新备课包。' })
      response.status(502).json({ error: 'PROVIDER_FAILED', message: providerMessage(error) })
    }
  })

  app.get('/api/projects', async (_request, response) => response.json(await listProjects()))

  app.get('/api/projects/:id', async (request, response) => {
    const project = await getProject(request.params.id)
    if (!project) return response.status(404).json({ error: 'PROJECT_NOT_FOUND', message: '没有找到这份备课。' })
    response.json(project)
  })

  app.patch('/api/projects/:id', async (request, response) => {
    const update = updateProjectInputSchema.safeParse(request.body)
    if (!update.success) return response.status(422).json({ error: 'VALIDATION_FAILED', details: validationMessage(update.error) })
    try {
      const project = await updateProject(request.params.id, update.data)
      if (!project) return response.status(404).json({ error: 'PROJECT_NOT_FOUND', message: '没有找到这份备课。' })
      response.json(project)
    } catch (error) {
      if (error instanceof ProjectConflictError) return response.status(409).json({ error: 'PROJECT_CONFLICT', message: error.message })
      throw error
    }
  })

  app.post('/api/projects/:id/animation/refine', async (request, response) => {
    const input = refineAnimationInputSchema.safeParse(request.body)
    if (!input.success) return response.status(422).json({ error: 'VALIDATION_FAILED', details: validationMessage(input.error) })
    const project = await getProject(request.params.id)
    if (!project) return response.status(404).json({ error: 'PROJECT_NOT_FOUND', message: '没有找到这份备课。' })
    if (project.updatedAt !== input.data.expectedUpdatedAt) return response.status(409).json({ error: 'PROJECT_CONFLICT', message: '备课内容已更新，请刷新后再优化动画。' })
    try {
      const animation = await services.refineSpec(project.animation, input.data.instruction)
      const updated = await replaceAnimation(project.id, animation, input.data.expectedUpdatedAt)
      response.json(updated)
    } catch (error) {
      if (error instanceof ProjectConflictError) return response.status(409).json({ error: 'PROJECT_CONFLICT', message: '优化期间，另一页面已更新这份备课。请刷新核对后再试，已有内容未被覆盖。' })
      if (error instanceof ProviderNotConfiguredError) return response.status(503).json({ error: 'PROVIDER_NOT_CONFIGURED', message: '当前本地服务未配置百炼密钥，不能优化动画。' })
      response.status(502).json({ error: 'PROVIDER_FAILED', message: providerMessage(error) })
    }
  })

  app.get('/api/projects/:id/export', async (request, response) => {
    const project = await getProject(request.params.id)
    if (!project) return response.status(404).json({ error: 'PROJECT_NOT_FOUND', message: '没有找到这份备课。' })
    const archive = await buildProjectArchive(project)
    response.setHeader('Content-Type', 'application/zip')
    response.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${project.input.topic}_备课包.zip`)}`)
    response.send(archive)
  })

  app.use((_request, response) => response.status(404).json({ error: 'NOT_FOUND', message: '接口不存在。' }))
  const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
    // Never return Express development stacks, JSON bodies, local paths or upstream details.
    const status = error?.type === 'entity.too.large' ? 413 : error?.type === 'entity.parse.failed' ? 400 : 500
    response.status(status).json({ error: status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST', message: status === 500 ? '服务暂时无法处理请求。' : '请求格式不正确或内容过大。' })
  }
  app.use(handleError)
  return app
}
