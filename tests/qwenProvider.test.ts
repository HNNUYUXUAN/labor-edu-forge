import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lessonTemplates } from '../server/src/data/templates.js'
import { generateProjectContent, refineAnimation } from '../server/src/services/qwenProvider.js'

const { complete } = vi.hoisted(() => ({ complete: vi.fn() }))
vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: complete } }
  },
}))

beforeEach(() => {
  complete.mockReset()
  vi.stubEnv('DASHSCOPE_API_KEY', 'local-test-key')
})
afterEach(() => vi.unstubAllEnvs())

function respond(content: unknown) {
  complete.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(content) } }] })
}

describe('model output contract', () => {
  it.each(lessonTemplates)('restricts $id generation and refinement to the requested physical scene', async template => {
    const kind = template.content.animation.inclinedPlane ? 'inclinedPlane' : template.content.animation.lever ? 'lever' : 'pulley'
    respond(template.content)
    await generateProjectContent(template.input)
    const generationSchema = JSON.parse(complete.mock.calls[0][0].messages[0].content.split('\n').find((line: string) => line.startsWith('{')))
    respond(template.content.animation)
    await refineAnimation(template.content.animation, '保持参数，优化说明')
    const refineSchema = JSON.parse(complete.mock.calls[1][0].messages[0].content.split('\n').find((line: string) => line.startsWith('{')))
    for (const schema of [generationSchema.properties.animation, refineSchema]) {
      expect(schema.required).toContain(kind)
      expect(schema.properties.sceneType.const).toBe(template.content.animation.sceneType)
      for (const other of ['inclinedPlane', 'lever', 'pulley'].filter(key => key !== kind)) expect(schema.properties).not.toHaveProperty(other)
      expect(schema.additionalProperties).toBe(false)
    }
  })

  it('still rejects mixed scene parameters instead of silently dropping model output', async () => {
    const template = lessonTemplates.find(template => template.content.animation.pulley)!
    const content = structuredClone(template.content)
    content.animation.lever = structuredClone(lessonTemplates.find(template => template.content.animation.lever)!.content.animation.lever)
    respond(content)
    await expect(generateProjectContent(template.input)).rejects.toThrow('一个动画只能包含一种物理场景参数')
  })

  it('supplies nested field types to the model and accepts a complete lesson', async () => {
    const template = lessonTemplates[0]
    respond(template.content)
    await expect(generateProjectContent(template.input)).resolves.toEqual(template.content)
    const system = complete.mock.calls[0][0].messages[0].content as string
    const schema = JSON.parse(system.split('\n').find((line) => line.startsWith('{'))!)
    const lesson = schema.properties.lessonDesign.properties
    expect(lesson.objectives.type).toBe('array')
    expect(lesson.teachingProcess.items.properties.teacherActions.type).toBe('array')
    expect(schema.properties.animation.properties.objects.items.required).toContain('position')
  })

  it('rejects a string in an array field and reports its location', async () => {
    const content = structuredClone(lessonTemplates[0].content)
    respond({ ...content, lessonDesign: { ...content.lessonDesign, objectives: '模型返回的字符串' } })
    await expect(generateProjectContent(lessonTemplates[0].input)).rejects.toThrow('lessonDesign.objectives')
  })

  it('keeps cross-field animation validation after receiving valid JSON', async () => {
    const animation = structuredClone(lessonTemplates[0].content.animation)
    animation.timeline[0].targetId = 'missing-object'
    respond(animation)
    await expect(refineAnimation(lessonTemplates[0].content.animation, '放慢移动速度'))
      .rejects.toThrow('timeline.0.targetId')
  })

  it('compiles model parameter changes into geometry instead of accepting arbitrary ramp positions', async () => {
    const current = structuredClone(lessonTemplates[0].content.animation)
    const proposed = structuredClone(current)
    proposed.inclinedPlane!.angleDegrees = 25
    proposed.inclinedPlane!.moveDuration = 35
    proposed.objects.find((object) => object.id === 'ramp')!.position = { x: -900, y: -900 }
    respond(proposed)
    const result = await refineAnimation(current, '增大倾角并放慢搬运')
    expect(result.inclinedPlane!.angleDegrees).toBe(25)
    expect(result.objects.find((object) => object.id === 'ramp')!.position).toEqual({ x: 150, y: 430 })
    expect(result.objects.find((object) => object.id === 'ramp')!.style.rotate).toBe(-25)
    expect(result.timeline.every((action) => action.duration === 35 && action.easing === 'linear')).toBe(true)
  })
})
