import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import JSZip from 'jszip'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../server/src/app.js'
import { lessonTemplates } from '../server/src/data/templates.js'
import { resetRepositoryForTests } from '../server/src/services/projectRepository.js'

let dataDir = ''
let projectId = ''
let updatedAt = ''

beforeAll(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'labor-edu-forge-test-'))
  process.env.LABOR_EDU_DATA_DIR = dataDir
  delete process.env.DASHSCOPE_API_KEY
  resetRepositoryForTests()
})

afterAll(async () => {
  resetRepositoryForTests()
  await rm(dataDir, { recursive: true, force: true })
})

describe('portfolio API', () => {
  it('reports provider state without leaking credentials', async () => {
    const response = await request(createApp()).get('/api/health').expect(200)
    expect(response.body).toEqual({ status: 'ok', providerReady: false, model: 'qwen-plus' })
    expect(JSON.stringify(response.body)).not.toContain('apiKey')
  })

  it('keeps templates available without a key and rejects real generation', async () => {
    await request(createApp()).get('/api/templates').expect(200).expect((response) => expect(response.body).toHaveLength(3))
    await request(createApp()).post('/api/projects').send(lessonTemplates[0].input).expect(503)
  })

  it('creates a complete project atomically through an injected test provider', async () => {
    const app = createApp({ generateContent: async () => structuredClone(lessonTemplates[0].content) })
    const response = await request(app).post('/api/projects').send(lessonTemplates[0].input).expect(201)
    projectId = response.body.id
    updatedAt = response.body.updatedAt
    expect(response.body.lessonDesign.teachingProcess).toHaveLength(4)
    expect(response.body.studentTaskSheet.steps.length).toBeGreaterThan(3)
    expect(response.body.rubric.dimensions).toHaveLength(4)
  })

  it('turns provider authentication errors into actionable Chinese copy', async () => {
    const providerError = Object.assign(new Error('raw provider detail'), { status: 401 })
    const app = createApp({ generateContent: async () => { throw providerError } })
    const response = await request(app).post('/api/projects').send(lessonTemplates[0].input).expect(502)
    expect(response.body.message).toContain('百炼密钥无效')
    expect(response.body.message).not.toContain('raw provider detail')
  })

  it('keeps both projects when first writes arrive concurrently', async () => {
    const app = createApp({ generateContent: async () => structuredClone(lessonTemplates[0].content) })
    const [first, second] = await Promise.all([
      request(app).post('/api/projects').send({ ...lessonTemplates[0].input, topic: '并发备课甲' }).expect(201),
      request(app).post('/api/projects').send({ ...lessonTemplates[0].input, topic: '并发备课乙' }).expect(201),
    ])
    const list = await request(app).get('/api/projects').expect(200)
    expect(list.body.map((item: { id: string }) => item.id)).toEqual(expect.arrayContaining([first.body.id, second.body.id]))
  })

  it('autosaves one section and rejects stale writes', async () => {
    const app = createApp()
    const project = (await request(app).get(`/api/projects/${projectId}`).expect(200)).body
    project.lessonDesign.objectives[0] = '更新后的教学目标'
    const saved = await request(app).patch(`/api/projects/${projectId}`).send({ section: 'lessonDesign', value: project.lessonDesign, expectedUpdatedAt: updatedAt }).expect(200)
    expect(saved.body.lessonDesign.objectives[0]).toBe('更新后的教学目标')
    await request(app).patch(`/api/projects/${projectId}`).send({ section: 'lessonDesign', value: project.lessonDesign, expectedUpdatedAt: updatedAt }).expect(409)
    updatedAt = saved.body.updatedAt
  })

  it('validates and persists refined animation output', async () => {
    const app = createApp({ refineSpec: async (animation) => ({ ...animation, teacherTip: '优化后的教师提示' }) })
    const response = await request(app).post(`/api/projects/${projectId}/animation/refine`).send({ instruction: '放慢箱子移动速度', expectedUpdatedAt: updatedAt }).expect(200)
    expect(response.body.animation.teacherTip).toBe('优化后的教师提示')
    updatedAt = response.body.updatedAt
  })

  it('exports four editable DOCX documents in a ZIP', async () => {
    const response = await request(createApp()).get(`/api/projects/${projectId}/export`).buffer(true).parse((res, callback) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => callback(null, Buffer.concat(chunks)))
    }).expect(200)
    const zip = await JSZip.loadAsync(response.body as Buffer)
    expect(Object.keys(zip.files).sort()).toEqual(['01_教学设计.docx', '02_学习任务单.docx', '03_评价量表.docx', '04_动画演示说明.docx'])
    for (const file of Object.values(zip.files)) {
      const documentZip = await JSZip.loadAsync(await file.async('nodebuffer'))
      expect(documentZip.file('word/document.xml')).not.toBeNull()
    }
  })
})
