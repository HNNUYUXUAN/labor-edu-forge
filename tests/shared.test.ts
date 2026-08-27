import { describe, expect, it } from 'vitest'
import { animationSpecSchema, createProjectInputSchema } from '@labor-edu-forge/shared'
import { lessonTemplates } from '../server/src/data/templates.js'

describe('shared schemas', () => {
  it('accepts every curated template', () => {
    expect(lessonTemplates).toHaveLength(3)
    for (const template of lessonTemplates) {
      expect(createProjectInputSchema.safeParse(template.input).success).toBe(true)
      expect(animationSpecSchema.safeParse(template.content.animation).success).toBe(true)
    }
  })

  it('rejects unsafe animation actions and missing targets', () => {
    const animation = structuredClone(lessonTemplates[0].content.animation) as unknown as { timeline: Array<Record<string, unknown>> }
    animation.timeline[0].action = 'executeScript'
    animation.timeline[0].targetId = 'missing-object'
    expect(animationSpecSchema.safeParse(animation).success).toBe(false)
  })

  it('limits knowledge points and teaching focuses', () => {
    const input = { ...lessonTemplates[0].input, knowledgePoints: ['一', '二', '三', '四'], focuses: ['劳动技能'] }
    expect(createProjectInputSchema.safeParse(input).success).toBe(false)
  })
})
