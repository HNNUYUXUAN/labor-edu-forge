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
  TextRun,
  WidthType,
} from 'docx'
import type { LessonProject } from '@labor-edu-forge/shared'

const title = (text: string) => new Paragraph({ text, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER })
const heading = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_1 })
const line = (text: string) => new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: { after: 120 } })
const bullets = (items: string[]) => items.map((text) => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } }))
const cell = (text: string) => new TableCell({ children: [line(text)] })

function documentWith(children: Array<Paragraph | Table>) {
  return new Document({ sections: [{ properties: {}, children }] })
}

async function lessonDesignDoc(project: LessonProject) {
  const lesson = project.lessonDesign
  const processTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: ['教学环节', '时间', '教师活动', '学生活动', '设计意图'].map(cell) }),
      ...lesson.teachingProcess.map((step) => new TableRow({ children: [
        cell(step.stage), cell(`${step.minutes} 分钟`), cell(step.teacherActions.join('\n')),
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
    heading('观察与记录'), ...task.recordPrompts.flatMap((item) => [line(item.label), line(`记录提示：${item.hint}`), line('________________________________________________________________')]),
    heading('反思问题'), ...bullets(task.reflectionQuestions),
  ]))
}

async function rubricDoc(project: LessonProject) {
  const rubric = project.rubric
  return Packer.toBuffer(documentWith([
    title(rubric.title),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: ['评价维度', '表现优秀', '达到要求', '继续发展'].map(cell) }),
        ...rubric.dimensions.map((item) => new TableRow({ children: [cell(item.dimension), cell(item.excellent), cell(item.competent), cell(item.developing)] })),
      ],
    }),
    heading('使用建议'), line('建议在活动前公开量规，活动中用于观察记录，活动后由学生自评、同伴互评与教师评价共同完成。'),
  ]))
}

async function animationDoc(project: LessonProject) {
  const animation = project.animation
  return Packer.toBuffer(documentWith([
    title(animation.title),
    heading('演示原理'), line(animation.principle),
    heading('课堂使用提示'), line(animation.teacherTip),
    heading('时间轴'), ...animation.timeline.map((item) => line(`${item.at} 秒：${item.targetId} · ${item.action} · ${JSON.stringify(item.params)}`)),
    heading('字幕'), ...animation.captions.map((item) => line(`${item.at} 秒：${item.text}`)),
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
