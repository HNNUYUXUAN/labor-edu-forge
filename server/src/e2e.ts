import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync } from 'node:fs'
import path from 'node:path'
import { createApp } from './app.js'
import { getTemplate, lessonTemplates } from './data/templates.js'

const dataDir = mkdtempSync(path.join(tmpdir(), 'labor-edu-forge-e2e-'))
process.env.LABOR_EDU_DATA_DIR = dataDir
delete process.env.DASHSCOPE_API_KEY
process.once('exit', () => rmSync(dataDir, { recursive: true, force: true }))
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => process.exit(0))

const port = Number(process.env.PORT || 37857)
createApp({
  status: () => ({ ready: true, model: 'e2e-fixture' }),
  generateContent: async (input) => structuredClone((getTemplate(input.templateId || '') || lessonTemplates[0]).content),
  refineSpec: async (animation, instruction) => ({ ...structuredClone(animation), teacherTip: `${animation.teacherTip} 优化要求：${instruction}` }),
}).listen(port, '127.0.0.1', () => console.log(`E2E API fixture：http://localhost:${port}`))
