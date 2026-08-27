import { tmpdir } from 'node:os'
import path from 'node:path'
import './lib/loadEnv.js'
import { createApp } from './app.js'
import { getTemplate, lessonTemplates } from './data/templates.js'

process.env.LABOR_EDU_DATA_DIR = path.join(tmpdir(), 'labor-edu-forge-e2e')

const port = Number(process.env.PORT || 37856)
createApp({
  status: () => ({ ready: true, model: 'e2e-fixture' }),
  generateContent: async (input) => structuredClone((getTemplate(input.templateId || '') || lessonTemplates[0]).content),
  refineSpec: async (animation, instruction) => ({ ...structuredClone(animation), teacherTip: `${animation.teacherTip} 优化要求：${instruction}` }),
}).listen(port, () => console.log(`E2E API fixture：http://localhost:${port}`))
