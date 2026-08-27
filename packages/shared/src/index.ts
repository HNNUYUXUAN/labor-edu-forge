import { z } from 'zod'

const shortText = z.string().trim().min(1).max(200)
const contentText = z.string().trim().min(1).max(2_000)
const stringList = z.array(shortText).min(1).max(20)

export const teachingFocusSchema = z.enum(['劳动技能', '科学理解', '安全意识', '协作反思'])

export const createProjectInputSchema = z.object({
  templateId: z.string().trim().max(80).optional(),
  topic: shortText,
  scenario: contentText,
  gradeLevel: shortText,
  durationMinutes: z.number().int().min(20).max(120),
  subject: shortText,
  knowledgePoints: z.array(shortText).min(1).max(3),
  focuses: z.array(teachingFocusSchema).min(2).max(3),
  requirements: z.string().trim().max(200).default(''),
})

export const teachingProcessStepSchema = z.object({
  stage: shortText,
  minutes: z.number().int().min(1).max(120),
  teacherActions: stringList,
  studentActions: stringList,
  intention: contentText,
})

export const lessonDesignSchema = z.object({
  title: shortText,
  overview: contentText,
  objectives: stringList,
  keyPoints: stringList,
  difficultPoints: stringList,
  materials: stringList,
  safetyNotes: stringList,
  teachingProcess: z.array(teachingProcessStepSchema).min(3).max(8),
  reflectionPrompt: contentText,
})

export const studentTaskSheetSchema = z.object({
  title: shortText,
  taskGoal: contentText,
  preparation: stringList,
  steps: stringList,
  recordPrompts: z.array(z.object({ label: shortText, hint: contentText })).min(2).max(8),
  reflectionQuestions: stringList,
})

export const rubricSchema = z.object({
  title: shortText,
  dimensions: z.array(z.object({
    dimension: shortText,
    excellent: contentText,
    competent: contentText,
    developing: contentText,
  })).min(3).max(8),
})

export const animationActionSchema = z.enum(['move', 'rotate', 'fade', 'highlight', 'showText'])
export const animationObjectTypeSchema = z.enum(['rect', 'circle', 'line'])

export const animationSpecSchema = z.object({
  title: shortText,
  sceneType: z.string().trim().min(1).max(80),
  duration: z.number().min(5).max(180),
  canvas: z.object({
    width: z.number().int().min(320).max(1920),
    height: z.number().int().min(180).max(1080),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  objects: z.array(z.object({
    id: z.string().trim().min(1).max(80),
    type: animationObjectTypeSchema,
    label: shortText,
    style: z.record(z.string(), z.union([z.string(), z.number()])),
    position: z.object({ x: z.number(), y: z.number() }),
  })).min(1).max(20),
  timeline: z.array(z.object({
    at: z.number().min(0).max(180),
    targetId: z.string().trim().min(1).max(80),
    action: animationActionSchema,
    params: z.record(z.string(), z.union([z.string(), z.number()])),
  })).min(1).max(60),
  captions: z.array(z.object({ at: z.number().min(0).max(180), text: shortText })).max(30),
  principle: contentText,
  teacherTip: contentText,
  safetyNotes: stringList,
}).superRefine((spec, context) => {
  const ids = new Set(spec.objects.map((object) => object.id))
  for (const [index, action] of spec.timeline.entries()) {
    if (!ids.has(action.targetId)) {
      context.addIssue({ code: 'custom', path: ['timeline', index, 'targetId'], message: `动画动作引用了不存在的对象：${action.targetId}` })
    }
    if (action.at > spec.duration) {
      context.addIssue({ code: 'custom', path: ['timeline', index, 'at'], message: '动画动作时间不得超过总时长' })
    }
  }
})

export const lessonProjectContentSchema = z.object({
  lessonDesign: lessonDesignSchema,
  studentTaskSheet: studentTaskSheetSchema,
  rubric: rubricSchema,
  animation: animationSpecSchema,
})

export const lessonProjectSchema = lessonProjectContentSchema.extend({
  id: z.string().trim().min(1),
  input: createProjectInputSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const lessonTemplateSchema = z.object({
  id: z.string().trim().min(1),
  title: shortText,
  summary: contentText,
  input: createProjectInputSchema,
  content: lessonProjectContentSchema,
})

export const projectListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  gradeLevel: z.string(),
  durationMinutes: z.number(),
  subject: z.string(),
  updatedAt: z.string().datetime(),
})

export const updateProjectInputSchema = z.discriminatedUnion('section', [
  z.object({ section: z.literal('lessonDesign'), value: lessonDesignSchema, expectedUpdatedAt: z.string().datetime() }),
  z.object({ section: z.literal('studentTaskSheet'), value: studentTaskSheetSchema, expectedUpdatedAt: z.string().datetime() }),
  z.object({ section: z.literal('rubric'), value: rubricSchema, expectedUpdatedAt: z.string().datetime() }),
  z.object({ section: z.literal('animation'), value: animationSpecSchema, expectedUpdatedAt: z.string().datetime() }),
])

export const refineAnimationInputSchema = z.object({
  instruction: z.string().trim().min(2).max(500),
  expectedUpdatedAt: z.string().datetime(),
})

export type TeachingFocus = z.infer<typeof teachingFocusSchema>
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>
export type TeachingProcessStep = z.infer<typeof teachingProcessStepSchema>
export type LessonDesign = z.infer<typeof lessonDesignSchema>
export type StudentTaskSheet = z.infer<typeof studentTaskSheetSchema>
export type Rubric = z.infer<typeof rubricSchema>
export type AnimationSpec = z.infer<typeof animationSpecSchema>
export type LessonProjectContent = z.infer<typeof lessonProjectContentSchema>
export type LessonProject = z.infer<typeof lessonProjectSchema>
export type LessonTemplate = z.infer<typeof lessonTemplateSchema>
export type ProjectListItem = z.infer<typeof projectListItemSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>
export type RefineAnimationInput = z.infer<typeof refineAnimationInputSchema>
