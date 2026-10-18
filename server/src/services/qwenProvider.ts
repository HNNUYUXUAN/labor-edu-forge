import OpenAI from 'openai'
import {
  animationSpecSchema,
  buildPhysicsAnimation,
  physicsKind,
  lessonProjectContentSchema,
  type AnimationSpec,
  type CreateProjectInput,
  type LessonProjectContent,
} from '@labor-edu-forge/shared'

export class ProviderNotConfiguredError extends Error {}
export class ProviderResponseError extends Error {}

const animationRules = `动画时间单位为秒，timeline.at 不得超过 duration，所有 targetId 必须引用已有对象 id。
rect 的 style 使用 width、height、fill；circle 使用 radius、fill；line 使用 length、rotate、stroke、strokeWidth。
move 的 params 使用 x、y（相对初始位置的累计目标偏移，不是本段增量）；rotate 使用 degree；fade 使用 opacity；highlight 使用 color。
每个动作可指定 duration（秒）和 easing（linear 或 easeInOut）；匀速运动使用 linear。
canvas.background 和颜色使用六位十六进制色值。captions 按 at 升序排列，字幕时间不得超过总时长。
斜面搬运必须使用 sceneType="inclined-plane" 并填写 inclinedPlane：angleDegrees（10—30度）、massKg（0.1—5千克）、frictionCoefficient（0—0.3）、moveStart、moveDuration（至少2秒）。moveStart+moveDuration 不得超过总时长。
斜面由程序根据这些参数计算箱底接触、坐标、轨迹和力箭头；不要通过修改 objects 或 timeline 来调整斜面几何。优化“变慢”必须增加 moveDuration，并保证总时长容纳该动作；改变倾角使用 angleDegrees。
默认固定斜面、拉力沿斜面、匀速上行，忽略起停瞬间。N=mg*cosθ，f=μN，F=mg*sinθ+f；g=9.8。质量与摩擦系数保持不变，除非用户要求改变。到顶端停稳后交接，不演示箱子悬空跳到平台。不把重力说成向上，不宣称有摩擦时省功。
字幕应围绕安全检查、匀速上行、观察拉力方向和顶端交接组织；上行字幕应覆盖 moveStart 至 moveStart+moveDuration，交接字幕不能早于动作完成。
杠杆称量必须使用 sceneType="lever"，只填写 lever 参数，不填写其他场景参数：loadMassKg（0.1—2）、counterweightMassKg（0.1—2）、loadArmM（0.1—0.25米）、startFraction（0.25—0.75）、moveStart、moveDuration（秒）。平衡秤砣力臂 loadMassKg*loadArmM/counterweightMassKg 必须≤0.55米。
杠杆已经调零，忽略杆重与吊盘重，演示扶平调砣：调砣阶段手向上托住载荷侧保持水平，扶平力补偿两侧力矩差。秤砣从平衡力臂的 startFraction 倍位置移向平衡位置；只有动作结束、两侧力矩相等后才可松手。字幕不得在动作完成前声称已经平衡，不演示杆的自由摆动。
滑轮提水必须使用 sceneType="pulley"，只填写 pulley 参数：mode（fixed 定滑轮 或 movable 一动一定滑轮组）、massKg（桶与水总质量0.5—5千克）、liftHeightM（0.2—1米）、moveStart、moveDuration（秒）。默认 fixed；若要求比较或使用动滑轮，则用 movable。动滑轮上方附定滑轮仅用于向下拉绳。
滑轮忽略绳重、轮重、摩擦与起停瞬间，绳不可伸长，同一根绳张力相等。fixed：F=mg、拉绳s=h；movable：2T=mg、F=mg/2、拉绳s=2h；都不省功，不宣称动滑轮效率更高或能更快提水。字幕按开始匀速提水、观察拉力和绳端位移、到位固定绳端组织，不得提前宣称到位或松手。
三个场景都由程序据物理参数绘制几何；请保留满足 Schema 的 objects/timeline 数据，但不要用这些数据代替物理参数。一次仅输出当前场景参数。放慢运动应增大 moveDuration；用户未要求更改的质量、力臂、结构模式等参数保持不变。
只生成声明式数据，禁止代码、HTML、脚本和事件处理器。`

function animationJsonSchema(kind: ReturnType<typeof physicsKind>) {
  const schema = animationSpecSchema.toJSONSchema()
  if (kind && schema.properties) {
    for (const key of ['inclinedPlane', 'lever', 'pulley']) {
      if (key !== kind) delete schema.properties[key]
    }
    schema.required = [...(schema.required || []), kind]
    schema.properties.sceneType = { type: 'string', const: kind === 'inclinedPlane' ? 'inclined-plane' : kind }
  }
  return schema
}

function projectOutputRules(input: CreateProjectInput) {
  const kind = physicsKind({ title: input.topic, sceneType: '' }, input.topic + input.scenario)
  const schema = lessonProjectContentSchema.toJSONSchema()
  schema.properties!.animation = animationJsonSchema(kind)
  return `输出严格、完整、可解析的 JSON。内容必须可实施，并把安全要求写进劳动过程。
严格遵守以下 JSON Schema 的字段名称、类型、必填项和数量限制；数组字段即使只有一项也必须返回数组。
${JSON.stringify(schema)}
${animationRules}`
}

const animationOutputRules = (current: AnimationSpec) => `你只修改声明式教学动画 JSON。返回完整对象，严格遵守以下 JSON Schema：
${JSON.stringify(animationJsonSchema(physicsKind(current)))}
${animationRules}`

function validationDetail(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const issue = error.issues[0]
  return issue ? `${issue.path.join('.') || '根对象'}：${issue.message}` : '校验失败'
}

export function providerStatus() {
  return {
    ready: Boolean(process.env.DASHSCOPE_API_KEY),
    model: process.env.QWEN_TEXT_MODEL || 'qwen3.7-plus',
  }
}

function client() {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) throw new ProviderNotConfiguredError('未配置 DASHSCOPE_API_KEY。')
  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    timeout: Number(process.env.BAILIAN_TIMEOUT_SECONDS || 300) * 1_000,
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
teachingProcess 中各环节 minutes 之和必须为 ${input.durationMinutes}。
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
      { role: 'system', content: projectOutputRules(input) },
      { role: 'user', content: generationPrompt(input) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  })
  const parsed = lessonProjectContentSchema.safeParse(parseJson(completion.choices[0]?.message.content ?? null))
  if (!parsed.success) throw new ProviderResponseError(`模型输出结构不完整：${validationDetail(parsed.error)}`)
  const content = parsed.data
  const kind = physicsKind(content.animation, input.topic + input.scenario)
  if (kind) {
    if (!content.animation[kind]) throw new ProviderResponseError(`动画缺少 ${kind} 物理参数。`)
    content.animation = buildPhysicsAnimation(content.animation, kind)
  }
  return content
}

export async function refineAnimation(current: AnimationSpec, instruction: string): Promise<AnimationSpec> {
  const completion = await client().chat.completions.create({
    model: providerStatus().model,
    messages: [
      { role: 'system', content: animationOutputRules(current) },
      { role: 'user', content: `修改要求：${instruction}\n\n当前 AnimationSpec：\n${JSON.stringify(current)}\n\n返回完整 AnimationSpec JSON。对象类型仅 rect、circle、line；动作仅 move、rotate、fade、highlight、showText；targetId 必须存在。` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.25,
  })
  const parsed = animationSpecSchema.safeParse(parseJson(completion.choices[0]?.message.content ?? null))
  if (!parsed.success) throw new ProviderResponseError(`动画输出未通过安全校验：${validationDetail(parsed.error)}`)
  const kind = physicsKind(current) || physicsKind(parsed.data)
  if (kind) {
    if (!parsed.data[kind]) throw new ProviderResponseError(`动画优化缺少 ${kind} 物理参数。`)
    return buildPhysicsAnimation(parsed.data, kind)
  }
  return parsed.data
}
