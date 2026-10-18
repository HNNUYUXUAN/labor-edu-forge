import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { JSONFilePreset } from 'lowdb/node'
import type { LessonProject, ProjectListItem, UpdateProjectInput } from '@labor-edu-forge/shared'
import { serverDataDir } from '../lib/paths.js'

type Database = { projects: LessonProject[] }
let databasePromise: ReturnType<typeof JSONFilePreset<Database>> | undefined
let writeQueue: Promise<void> = Promise.resolve()

function database() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const dataDir = process.env.LABOR_EDU_DATA_DIR || serverDataDir
      await mkdir(dataDir, { recursive: true })
      return JSONFilePreset<Database>(path.join(dataDir, 'projects.json'), { projects: [] })
    })()
  }
  return databasePromise
}

async function withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation)
  writeQueue = result.then(() => undefined, () => undefined)
  return result
}

export class ProjectConflictError extends Error {}

export async function listProjects(): Promise<ProjectListItem[]> {
  const db = await database()
  return db.data.projects
    .map((project) => ({
      id: project.id,
      title: project.lessonDesign.title,
      gradeLevel: project.input.gradeLevel,
      durationMinutes: project.input.durationMinutes,
      subject: project.input.subject,
      updatedAt: project.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getProject(id: string) {
  const db = await database()
  return db.data.projects.find((project) => project.id === id)
}

export async function createProject(project: LessonProject) {
  return withWriteLock(async () => {
    const db = await database()
    db.data.projects.unshift(project)
    await db.write()
    return project
  })
}

export async function updateProject(id: string, update: UpdateProjectInput) {
  return withWriteLock(async () => {
    const db = await database()
    const project = db.data.projects.find((item) => item.id === id)
    if (!project) return undefined
    if (project.updatedAt !== update.expectedUpdatedAt) {
      throw new ProjectConflictError('备课内容已在其他页面更新，请刷新后继续编辑。')
    }
    if (update.section === 'lessonDesign') project.lessonDesign = update.value
    if (update.section === 'studentTaskSheet') project.studentTaskSheet = update.value
    if (update.section === 'rubric') project.rubric = update.value
    if (update.section === 'animation') project.animation = update.value
    // A revision must change even for two writes in the same millisecond or a clock adjustment.
    project.updatedAt = new Date(Math.max(Date.now(), Date.parse(project.updatedAt) + 1)).toISOString()
    await db.write()
    return project
  })
}

export async function replaceAnimation(id: string, animation: LessonProject['animation'], expectedUpdatedAt: string) {
  return updateProject(id, { section: 'animation', value: animation, expectedUpdatedAt })
}

export function resetRepositoryForTests() {
  databasePromise = undefined
  writeQueue = Promise.resolve()
}
