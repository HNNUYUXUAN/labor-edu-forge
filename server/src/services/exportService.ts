import JSZip from 'jszip'
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  TableLayoutType,
} from 'docx'
import type { LessonProject } from '@labor-edu-forge/shared'
import { documentFont, wordRuns } from './wordMath.js'

const title = (text: string) => new Paragraph({ children: wordRuns(text), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER })
const heading = (text: string) => new Paragraph({ children: wordRuns(text), heading: HeadingLevel.HEADING_1 })
const line = (text: string, legacy = true, keepNext = false) => new Paragraph({ children: wordRuns(text, legacy), keepNext, spacing: { after: 100, line: 280 } })
const bullets = (items: string[]) => items.map((text) => new Paragraph({ children: wordRuns(text), bullet: { level: 0 }, spacing: { after: 60, line: 280 } }))
const cell = (text: string) => new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [line(text)] })

function documentWith(children: Array<Paragraph | Table>) {
  return new Document({
    creator: '劳育备课工坊',
    styles: { default: {
      document: { run: { font: documentFont, size: 22, color: '000000', language: { value: 'en-US', eastAsia: 'zh-CN' } }, paragraph: { spacing: { line: 300, after: 120 } } },
      title: { run: { font: documentFont, size: 36, bold: true, color: '000000' }, paragraph: { spacing: { after: 240 }, keepNext: true } },
      heading1: { run: { font: documentFont, size: 26, bold: true, color: '000000' }, paragraph: { spacing: { before: 200, after: 100 }, keepNext: true } },
    } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children }],
  })
}

async function lessonDesignDoc(project: LessonProject) {
  const lesson = project.lessonDesign
  const processTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [1150, 750, 2600, 2600, 2538],
    rows: [
      new TableRow({ tableHeader: true, children: ['教学环节', '分钟', '教师活动', '学生活动', '设计意图'].map(cell) }),
      ...lesson.teachingProcess.map((step) => new TableRow({ cantSplit: true, children: [
        cell(step.stage), cell(`${step.minutes}`), cell(step.teacherActions.join('\n')),
        cell(step.studentActions.join('\n')), cell(step.intention),
      ] })),
    ],
  })
  return Packer.toBuffer(documentWith([
    title(lesson.title),
    line(`${project.input.gradeLevel} · ${project.input.durationMinutes} 分钟 · ${project.input.subject}融合`),
    heading('课程概述'), line(lesson.overview),
    heading('教学目标'), ...bullets(lesson.objectives),
    heading('教学重点'), ...bullets(lesson.keyPoints),
    heading('教学难点'), ...bullets(lesson.difficultPoints),
    heading('材料准备'), ...bullets(lesson.materials),
    heading('安全提示'), ...bullets(lesson.safetyNotes),
    heading('教学流程'), processTable,
    heading('课后反思'), line(lesson.reflectionPrompt),
  ]))
}

async function taskSheetDoc(project: LessonProject) {
  const task = project.studentTaskSheet
  return Packer.toBuffer(documentWith([
    title(task.title), heading('任务目标'), line(task.taskGoal),
    heading('课前准备'), ...bullets(task.preparation),
    heading('任务步骤'), ...task.steps.map((text, index) => line(`${index + 1}. ${text}`)),
    heading('观察与记录'), ...task.recordPrompts.flatMap((item) => [line(item.label, true, true), line(`记录提示：${item.hint}`, true, true), line('________________________________________________________________')]),
    heading('反思问题'), ...bullets(task.reflectionQuestions),
  ]))
}

async function rubricDoc(project: LessonProject) {
  const rubric = project.rubric
  return Packer.toBuffer(documentWith([
    title(rubric.title),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [1500, 2712, 2713, 2713],
      rows: [
        new TableRow({ tableHeader: true, children: ['评价维度', '表现优秀', '达到要求', '继续发展'].map(cell) }),
        ...rubric.dimensions.map((item) => new TableRow({ cantSplit: true, children: [cell(item.dimension), cell(item.excellent), cell(item.competent), cell(item.developing)] })),
      ],
    }),
    heading('使用建议'), line('建议在活动前公开量规，活动中用于观察记录，活动后由学生自评、同伴互评与教师评价共同完成。'),
  ]))
}

async function animationDoc(project: LessonProject) {
  const animation = project.animation
  return Packer.toBuffer(documentWith([
    title(animation.title),
    heading('演示原理'), line(animation.principle, true),
    heading('课堂使用提示'), line(animation.teacherTip, true),
    heading('演示步骤'), ...animation.timeline.map((item) => {
      const label = animation.objects.find(object => object.id === item.targetId)?.label ?? item.targetId
      const action = { move: '移动', rotate: '转动', highlight: '突出显示', appear: '出现', disappear: '隐藏', showText: '更新说明', fade: '调整显隐' }[item.action] ?? '演示'
      return line(`${item.at} 秒：${label}开始${action}${item.duration ? `，持续 ${item.duration} 秒` : ''}。`, true)
    }),
    heading('字幕'), ...animation.captions.map((item) => line(`${item.at} 秒：${item.text}`, true)),
    heading('安全提示'), ...bullets(animation.safetyNotes),
  ]))
}

export async function buildProjectArchive(project: LessonProject) {
  const zip = new JSZip()
  const documents = await Promise.all([
    lessonDesignDoc(project), taskSheetDoc(project), rubricDoc(project), animationDoc(project),
  ])
  const names = ['01_教学设计.docx', '02_学习任务单.docx', '03_评价量表.docx', '04_动画演示说明.docx']
  documents.forEach((buffer, index) => zip.file(names[index], buffer))
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}
