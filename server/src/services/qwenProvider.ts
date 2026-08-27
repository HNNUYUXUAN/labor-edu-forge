import OpenAI from 'openai'
import {
  animationSpecSchema,
  lessonProjectContentSchema,
  type AnimationSpec,
  type CreateProjectInput,
  type LessonProjectContent,
} from '@labor-edu-forge/shared'

export class ProviderNotConfiguredError extends Error {}
export class ProviderResponseError extends Error {}

export function providerStatus() {
  return {
    ready: Boolean(process.env.DASHSCOPE_API_KEY),
    model: process.env.QWEN_TEXT_MODEL || 'qwen-plus',
  }
}

function client() {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) throw new ProviderNotConfiguredError('未配置 DASHSCOPE_API_KEY。')
  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    timeout: Number(process.env.BAILIAN_TIMEOUT_SECONDS || 120) * 1_000,
    maxRetries: Math.min(Number(process.env.BAILIAN_MAX_RETRIES || 2), 3),
  })
}

function parseJson(content: string | null) {
  if (!content) throw new ProviderResponseError('模型没有返回可用内容。')
  const clean = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(clean) as unknown
  } catch {
    throw new ProviderResponseError('模型返回内容不是有效 JSON。')
  }
}

function generationPrompt(input: CreateProjectInput) {
  return `你是一位熟悉中国中小学劳动教育与学科融合的新教师导师。请生成一套可直接二次编辑的备课包。

教学主题：${input.topic}
真实劳动情境：${input.scenario}
年级：${input.gradeLevel}
课时：${input.durationMinutes}分钟
融合学科：${input.subject}
知识点：${input.knowledgePoints.join('、')}
教学重点：${input.focuses.join('、')}
补充要求：${input.requirements || '无'}

只返回 JSON，不要 Markdown。根对象必须且只能包含 lessonDesign、studentTaskSheet、rubric、animation。
lessonDesign 包含 title、overview、objectives、keyPoints、difficultPoints、materials、safetyNotes、teachingProcess、reflectionPrompt；teachingProcess 每项包含 stage、minutes、teacherActions、studentActions、intention。
studentTaskSheet 包含 title、taskGoal、preparation、steps、recordPrompts、reflectionQuestions；recordPrompts 每项包含 label、hint。
rubric 包含 title、dimensions；每个维度包含 dimension、excellent、competent、developing。
animation 包含 title、sceneType、duration、canvas、objects、timeline、captions、principle、teacherTip、safetyNotes。对象类型只能是 rect、circle、line，动作只能是 move、rotate、fade、highlight、showText。所有 timeline.targetId 必须引用 objects 中存在的 id，禁止任何代码、HTML、脚本或事件处理器。`
}

export async function generateProjectContent(input: CreateProjectInput): Promise<LessonProjectContent> {
  const completion = await client().chat.completions.create({
    model: providerStatus().model,
    messages: [
      { role: 'system', content: '输出严格、完整、可解析的 JSON。内容必须可实施，并把安全要求写进劳动过程。' },
      { role: 'user', content: generationPrompt(input) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  })
  const parsed = lessonProjectContentSchema.safeParse(parseJson(completion.choices[0]?.message.content ?? null))
  if (!parsed.success) throw new ProviderResponseError(`模型输出结构不完整：${parsed.error.issues[0]?.message || '校验失败'}`)
  return parsed.data
}

export async function refineAnimation(current: AnimationSpec, instruction: string): Promise<AnimationSpec> {
  const completion = await client().chat.completions.create({
    model: providerStatus().model,
    messages: [
      { role: 'system', content: '你只修改声明式教学动画 JSON。不得输出代码、HTML、脚本或新的动作类型。' },
      { role: 'user', content: `修改要求：${instruction}\n\n当前 AnimationSpec：\n${JSON.stringify(current)}\n\n返回完整 AnimationSpec JSON。对象类型仅 rect、circle、line；动作仅 move、rotate、fade、highlight、showText；targetId 必须存在。` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.25,
  })
  const parsed = animationSpecSchema.safeParse(parseJson(completion.choices[0]?.message.content ?? null))
  if (!parsed.success) throw new ProviderResponseError(`动画输出未通过安全校验：${parsed.error.issues[0]?.message || '校验失败'}`)
  return parsed.data
}
