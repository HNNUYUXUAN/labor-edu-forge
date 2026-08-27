import { lessonTemplateSchema, type LessonTemplate } from '@labor-edu-forge/shared'

type TemplateSeed = {
  id: string
  title: string
  summary: string
  scenario: string
  gradeLevel: string
  durationMinutes: number
  subject: string
  knowledgePoints: string[]
  focuses: Array<'劳动技能' | '科学理解' | '安全意识' | '协作反思'>
  material: string
  principle: string
  safety: string
  sceneType: string
  objectLabel: string
}

function buildTemplate(seed: TemplateSeed): LessonTemplate {
  const practiceMinutes = seed.durationMinutes - 20
  return lessonTemplateSchema.parse({
    id: seed.id,
    title: seed.title,
    summary: seed.summary,
    input: {
      templateId: seed.id,
      topic: seed.title,
      scenario: seed.scenario,
      gradeLevel: seed.gradeLevel,
      durationMinutes: seed.durationMinutes,
      subject: seed.subject,
      knowledgePoints: seed.knowledgePoints,
      focuses: seed.focuses,
      requirements: '',
    },
    content: {
      lessonDesign: {
        title: `${seed.title}：${seed.subject}融合劳动实践课`,
        overview: `学生围绕“${seed.scenario}”完成真实劳动任务，在操作、测量和复盘中理解${seed.principle}。`,
        objectives: [
          `能规范完成${seed.scenario}中的核心操作。`,
          `能用观察或数据解释${seed.principle}。`,
          '能在分工协作中识别风险，并提出改进办法。',
        ],
        keyPoints: [`${seed.scenario}的规范操作`, seed.principle],
        difficultPoints: ['把劳动体验转化为有证据的学科解释'],
        materials: [seed.material, '测量记录单', '安全检查表'],
        safetyNotes: [seed.safety, '操作前明确分工，异常情况立即停止并报告教师'],
        teachingProcess: [
          {
            stage: '情境导入', minutes: 5,
            teacherActions: [`展示${seed.scenario}的真实任务`, '提出需要解决的劳动问题'],
            studentActions: ['观察任务条件', '交流已有经验并提出猜想'],
            intention: '激活经验，形成需要用实践回答的问题。',
          },
          {
            stage: '原理探究', minutes: 10,
            teacherActions: ['示范测量方法', `引导学生关注${seed.principle}`],
            studentActions: ['完成对照观察', '记录关键数据与现象'],
            intention: '建立劳动操作与学科知识之间的证据链。',
          },
          {
            stage: '劳动实践', minutes: practiceMinutes,
            teacherActions: ['巡视安全与分工', '用追问帮助小组修正方案'],
            studentActions: [`小组完成${seed.scenario}`, '记录问题并迭代操作方法'],
            intention: '在真实操作中形成技能、责任与合作意识。',
          },
          {
            stage: '评价反思', minutes: 5,
            teacherActions: ['组织成果展示', '引导依据量规开展自评互评'],
            studentActions: ['展示证据', '总结方法并提出一次改进'],
            intention: '让评价回到劳动过程与可观察证据。',
          },
        ],
        reflectionPrompt: '如果再完成一次任务，你会改变哪一步？请说明理由和证据。',
      },
      studentTaskSheet: {
        title: `${seed.title}学习任务单`,
        taskGoal: `安全、协作地完成${seed.scenario}，并用记录解释${seed.principle}。`,
        preparation: [seed.material, '完成小组角色分工', '检查操作区域与器材'],
        steps: ['明确任务与成功标准', '完成第一次操作并记录', '改变一个条件进行对照', '比较证据并改进方案', '提交成果与个人反思'],
        recordPrompts: [
          { label: '我们的变量', hint: '写出本组主动改变和保持不变的条件。' },
          { label: '观察与数据', hint: '记录能够支持结论的现象、测量值或照片编号。' },
          { label: '改进证据', hint: '说明第二次操作改变了什么，效果如何。' },
        ],
        reflectionQuestions: ['哪项分工最影响任务效率？', `哪些证据能够说明${seed.principle}？`, '本组还需要改进哪一项安全行为？'],
      },
      rubric: {
        title: `${seed.title}过程性评价量表`,
        dimensions: [
          { dimension: '劳动技能', excellent: '操作规范熟练，能主动优化步骤。', competent: '能够按要求完成操作，偶有提醒。', developing: '需要持续指导才能完成关键操作。' },
          { dimension: '科学理解', excellent: '能用两项以上证据准确解释原理。', competent: '能结合现象作出基本解释。', developing: '结论与证据之间尚未建立联系。' },
          { dimension: '安全意识', excellent: '主动检查风险并提醒同伴。', competent: '能遵守安全规范。', developing: '在提醒后才能执行安全要求。' },
          { dimension: '协作反思', excellent: '分工清晰，反思具体且提出可行改进。', competent: '能参与合作并完成反思。', developing: '分工或反思缺少具体证据。' },
        ],
      },
      animation: {
        title: `${seed.title}原理演示`,
        sceneType: seed.sceneType,
        duration: 40,
        canvas: { width: 960, height: 540, background: '#FFFFFF' },
        objects: [
          { id: 'work-surface', type: 'line', label: '操作路径', style: { stroke: '#222222', strokeWidth: 8, length: 620, rotate: -20 }, position: { x: 160, y: 410 } },
          { id: 'load', type: 'rect', label: seed.objectLabel, style: { fill: '#B7793C', width: 150, height: 110 }, position: { x: 280, y: 260 } },
          { id: 'force', type: 'line', label: '施力方向', style: { stroke: '#165DCC', strokeWidth: 6, length: 175, rotate: -20 }, position: { x: 440, y: 245 } },
        ],
        timeline: [
          { at: 2, targetId: 'load', action: 'move', params: { x: 120, y: -44 } },
          { at: 14, targetId: 'force', action: 'highlight', params: { color: '#E00000' } },
          { at: 24, targetId: 'work-surface', action: 'highlight', params: { color: '#165DCC' } },
        ],
        captions: [{ at: 2, text: `探究：改变条件，观察${seed.principle}` }, { at: 24, text: '对比证据，而不是只凭感觉下结论' }],
        principle: seed.principle,
        teacherTip: `先让学生预测，再播放演示；暂停后请学生用自己的记录解释${seed.principle}。`,
        safetyNotes: [seed.safety],
      },
    },
  })
}

export const lessonTemplates: LessonTemplate[] = [
  buildTemplate({
    id: 'inclined-plane', title: '斜面搬运', summary: '利用斜面减少搬运重物所需的力，探究斜面倾角与拉力的关系。',
    scenario: '在校园器材室使用斜面和测力计，把一箱器材安全搬运到高台。', gradeLevel: '初中八年级', durationMinutes: 40,
    subject: '物理', knowledgePoints: ['功', '力的分解', '机械效率'], focuses: ['劳动技能', '科学理解', '安全意识'],
    material: '斜面板、测力计与重物箱', principle: '斜面倾角、移动距离与所需拉力之间的关系', safety: '检查斜面与支架固定是否牢靠，搬运时保持通道畅通',
    sceneType: 'inclined-plane', objectLabel: '器材箱',
  }),
  buildTemplate({
    id: 'lever-weighing', title: '杠杆称量', summary: '在手工称量任务中理解杠杆平衡，体会精确劳动与传统工具智慧。',
    scenario: '用简易杆秤完成食材称量，并通过移动秤砣使杠杆达到平衡。', gradeLevel: '初中八年级', durationMinutes: 40,
    subject: '物理', knowledgePoints: ['杠杆平衡', '力矩'], focuses: ['劳动技能', '科学理解', '协作反思'],
    material: '简易杆秤、砝码与食材模型', principle: '动力与动力臂、阻力与阻力臂的平衡关系', safety: '检查支点与挂钩是否牢固，避免重物突然滑落',
    sceneType: 'lever', objectLabel: '待称物',
  }),
  buildTemplate({
    id: 'pulley-watering', title: '滑轮提水', summary: '完成校园浇灌任务，比较定滑轮与动滑轮的劳动效率和用力特点。',
    scenario: '使用滑轮装置从低处提水，为校园种植区完成定量浇灌。', gradeLevel: '小学高年级', durationMinutes: 35,
    subject: '科学', knowledgePoints: ['定滑轮', '动滑轮', '省力关系'], focuses: ['劳动技能', '科学理解', '安全意识'],
    material: '滑轮组、水桶、绳索与量杯', principle: '不同滑轮结构对用力方向和大小的影响', safety: '检查绳索磨损与绳结，任何人不得站在水桶正下方',
    sceneType: 'pulley', objectLabel: '水桶',
  }),
]

export function getTemplate(id: string) {
  return lessonTemplates.find((template) => template.id === id)
}
