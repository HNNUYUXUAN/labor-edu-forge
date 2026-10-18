<template>
  <section class="project-workbench">
    <header class="project-header">
      <div><h1>{{ draft.lessonDesign.title }}</h1><p>{{ draft.input.gradeLevel }} · {{ draft.input.durationMinutes }} 分钟 · {{ draft.input.subject }}融合</p></div>
      <div class="project-actions">
        <span v-if="!readonly" class="save-status" :class="saveState" role="status" aria-live="polite"><CircleCheck v-if="saveState === 'saved'" :size="17" />{{ saveLabel }}</span>
        <RouterLink class="button secondary" :to="readonly ? `/new?template=${templateId}` : '/new'"><RefreshCw :size="18" />{{ readonly ? '基于案例备课' : '新建另一份' }}</RouterLink>
        <button v-if="!readonly" class="button primary" :disabled="exporting || refining" @click="downloadArchive">{{ exporting ? '正在准备导出…' : '导出备课包' }}<ArrowRight :size="20" /></button>
      </div>
    </header>

    <div v-if="saveError" class="feedback-banner error-text" role="alert"><p>{{ saveError }}</p><button class="text-button" @click="saves.flush()">重试保存</button><button class="text-button" @click="backupDraft">下载当前草稿</button></div>
    <p v-if="operationError" class="feedback-banner error-text" role="alert">{{ operationError }}</p>
    <p v-if="readonly" class="feedback-banner">这是只读案例，可直接播放动画。点击“基于案例备课”可生成适合自己课堂的备课包。</p>
    <TabsRoot v-model="activeTab" class="project-tabs">
      <TabsList class="tab-list" aria-label="备课包内容">
        <TabsTrigger value="lessonDesign">教学设计</TabsTrigger>
        <TabsTrigger value="studentTaskSheet">学习任务单</TabsTrigger>
        <TabsTrigger value="rubric">评价量表</TabsTrigger>
        <TabsTrigger value="animation">动画演示</TabsTrigger>
      </TabsList>

      <div class="workbench-body" :class="{ 'animation-focused': activeTab === 'animation' }">
        <fieldset class="document-pane workbench-fields" :disabled="refining || exporting">
          <TabsContent value="lessonDesign">
            <div class="section-heading"><h2>教学目标</h2><button v-if="!readonly" class="text-button" @click="editing.lessonDesign = !editing.lessonDesign"><SquarePen :size="18" />{{ editing.lessonDesign ? '完成编辑' : '编辑内容' }}</button></div>
            <textarea v-if="editing.lessonDesign" aria-label="教学目标（每行一项）" v-model="objectivesText" class="editor-textarea" rows="6" @input="applyObjectives" />
            <ol v-else class="number-list"><li v-for="item in draft.lessonDesign.objectives" :key="item"><MathText :text="item" /></li></ol>
            <div class="rule" />
            <div class="section-heading"><h2>教学流程</h2></div>
            <div class="process-table">
              <div class="process-row process-head"><span>教学环节</span><span>时间</span><span>教师活动</span><span>学生活动</span><span>设计意图</span></div>
              <div v-for="(item, index) in draft.lessonDesign.teachingProcess" :key="index" class="process-row">
                <strong><i />{{ item.stage }}</strong><span>{{ item.minutes }} 分钟</span>
                <textarea v-if="editing.lessonDesign" :aria-label="`${item.stage}教师活动（每行一项）`" v-model="teacherActivities[index]" @input="updateActions(index, 'teacherActions', $event)" /><span v-else><MathText :text="item.teacherActions.join('；')" /></span>
                <textarea v-if="editing.lessonDesign" :aria-label="`${item.stage}学生活动（每行一项）`" v-model="studentActivities[index]" @input="updateActions(index, 'studentActions', $event)" /><span v-else><MathText :text="item.studentActions.join('；')" /></span>
                <textarea v-if="editing.lessonDesign" :aria-label="`${item.stage}设计意图`" v-model="item.intention" @input="scheduleSave('lessonDesign')" /><span v-else><MathText :text="item.intention" /></span>
              </div>
            </div>
            <div class="rule" /><h2>安全提示</h2><ul class="plain-list"><li v-for="item in draft.lessonDesign.safetyNotes" :key="item"><MathText :text="item" /></li></ul>
          </TabsContent>

          <TabsContent value="studentTaskSheet">
            <div class="section-heading"><h2>{{ draft.studentTaskSheet.title }}</h2><button v-if="!readonly" class="text-button" @click="editing.studentTaskSheet = !editing.studentTaskSheet"><SquarePen :size="18" />{{ editing.studentTaskSheet ? '完成编辑' : '编辑内容' }}</button></div>
            <label class="content-label">任务目标</label><textarea v-if="editing.studentTaskSheet" aria-label="任务目标" v-model="draft.studentTaskSheet.taskGoal" class="editor-textarea" rows="3" @input="scheduleSave('studentTaskSheet')" /><p v-else class="document-lead"><MathText :text="draft.studentTaskSheet.taskGoal" /></p>
            <h2>任务步骤</h2><textarea v-if="editing.studentTaskSheet" aria-label="任务步骤（每行一项）" v-model="stepsText" class="editor-textarea" rows="8" @input="applySteps" /><ol v-else class="task-steps"><li v-for="item in draft.studentTaskSheet.steps" :key="item"><MathText :text="item" /></li></ol>
            <h2>观察与记录</h2><div class="record-grid"><article v-for="item in draft.studentTaskSheet.recordPrompts" :key="item.label"><strong><MathText :text="item.label" /></strong><p><MathText :text="item.hint" /></p><span /></article></div>
          </TabsContent>

          <TabsContent value="rubric">
            <div class="section-heading"><h2>{{ draft.rubric.title }}</h2><button v-if="!readonly" class="text-button" @click="editing.rubric = !editing.rubric"><SquarePen :size="18" />{{ editing.rubric ? '完成编辑' : '编辑内容' }}</button></div>
            <div class="rubric-table"><div class="rubric-row rubric-head"><span>评价维度</span><span>表现优秀</span><span>达到要求</span><span>继续发展</span></div><div v-for="item in draft.rubric.dimensions" :key="item.dimension" class="rubric-row"><strong>{{ item.dimension }}</strong><template v-if="editing.rubric"><textarea :aria-label="`${item.dimension}：表现优秀`" v-model="item.excellent" @input="scheduleSave('rubric')" /><textarea :aria-label="`${item.dimension}：达到要求`" v-model="item.competent" @input="scheduleSave('rubric')" /><textarea :aria-label="`${item.dimension}：继续发展`" v-model="item.developing" @input="scheduleSave('rubric')" /></template><template v-else><span><MathText :text="item.excellent" /></span><span><MathText :text="item.competent" /></span><span><MathText :text="item.developing" /></span></template></div></div>
          </TabsContent>

          <TabsContent value="animation">
            <div class="section-heading"><h2>{{ draft.animation.title }}</h2><button v-if="!readonly" class="text-button" @click="editing.animation = !editing.animation"><SquarePen :size="18" />{{ editing.animation ? '完成编辑' : '编辑说明' }}</button></div>
            <label class="content-label">演示原理</label><textarea v-if="editing.animation" aria-label="演示原理" v-model="draft.animation.principle" class="editor-textarea" rows="4" @input="scheduleSave('animation')" /><p v-else class="document-lead"><MathText :text="draft.animation.principle" legacy /></p>
            <label class="content-label">教师提示</label><textarea v-if="editing.animation" aria-label="教师提示" v-model="draft.animation.teacherTip" class="editor-textarea" rows="4" @input="scheduleSave('animation')" /><p v-else><MathText :text="draft.animation.teacherTip" legacy /></p>
            <div v-if="!readonly" class="refine-box"><h3>用自然语言优化动画</h3><p>{{ refineExample }}</p><textarea aria-label="动画修改要求" v-model="refineInstruction" rows="3" maxlength="500" /><button class="button primary" :disabled="refining || refineInstruction.trim().length < 2" @click="runRefine">{{ refining ? '正在优化…' : '优化动画' }}</button><p v-if="refining" role="status">正在按要求调整动画，可能需要数分钟。完成前请保持页面打开。</p><span v-if="refineError" class="error-text" role="alert">{{ refineError }}</span></div>
          </TabsContent>
        </fieldset>
        <aside class="animation-pane"><h2>动画演示</h2><AnimationPlayer :spec="draft.animation" /><h3>教师提示</h3><p><MathText :text="draft.animation.teacherTip" legacy /></p><p class="info-note"><Info :size="18" />动画由 AI 生成，仅做教学参考，请结合实际学情使用。</p></aside>
      </div>
    </TabsRoot>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { createSaveQueue, type SaveState } from '../lib/saveQueue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { ArrowRight, CircleCheck, Info, RefreshCw, SquarePen } from '@lucide/vue'
import type { LessonProject } from '@labor-edu-forge/shared'
import { ApiError, exportUrl, refineAnimation, updateProject, type EditableSection } from '../api/client'
import AnimationPlayer from './AnimationPlayer.vue'
import MathText from './MathText.vue'

const props = withDefaults(defineProps<{ project: LessonProject; readonly?: boolean; templateId?: string }>(), { readonly: false, templateId: '' })
const draft = reactive<LessonProject>(JSON.parse(JSON.stringify(props.project)) as LessonProject)
const activeTab = ref<EditableSection>('lessonDesign')
const editing = reactive<Record<EditableSection, boolean>>({ lessonDesign: false, studentTaskSheet: false, rubric: false, animation: false })
const saveState = ref<SaveState>('saved')
const saveError = ref('')
const operationError = ref('')
const exporting = ref(false)
const refineInstruction = ref('')
const refining = ref(false)
const refineError = ref('')
const objectivesText = ref(draft.lessonDesign.objectives.join('\n'))
const stepsText = ref(draft.studentTaskSheet.steps.join('\n'))
const teacherActivities = ref(draft.lessonDesign.teachingProcess.map(item=>item.teacherActions.join('\n')))
const studentActivities = ref(draft.lessonDesign.teachingProcess.map(item=>item.studentActions.join('\n')))
const saveLabel = computed(() => saveState.value === 'saving' ? '保存中' : saveState.value === 'error' ? '保存失败' : '已保存')
const toPlainObject = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const saves = createSaveQueue<EditableSection>(async section => {
  const project = await updateProject(draft.id, { section, value: toPlainObject(draft[section]), expectedUpdatedAt: draft.updatedAt } as Parameters<typeof updateProject>[1])
  draft.updatedAt = project.updatedAt
}, (state, error) => {
  saveState.value = state
  saveError.value = state !== 'error' ? '' : error instanceof ApiError && error.status === 409
    ? '另一个页面已修改这份备课。请先下载当前草稿，再刷新页面对照合并，避免覆盖已有内容。'
    : error instanceof ApiError && error.status === 422
    ? '部分内容不符合保存要求。目标、步骤和活动至少保留一项，每项不超过 200 字；其他说明请勿留空或超过 2000 字。修改后会重新保存，也可先下载当前草稿。'
    : '修改尚未保存，当前页面仍保留你的内容。请重试保存；如需关闭页面，请先下载当前草稿。'
})
function scheduleSave(section: EditableSection) { if (!props.readonly) saves.mark(section) }
function updateActions(index: number, field: 'teacherActions' | 'studentActions', event: Event) {
  draft.lessonDesign.teachingProcess[index][field] = (event.target as HTMLTextAreaElement).value.split('\n').map(item=>item.trim()).filter(Boolean)
  scheduleSave('lessonDesign')
}
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  setTimeout(()=>URL.revokeObjectURL(url), 1000)
}
function backupDraft() { download(new Blob([JSON.stringify(toPlainObject(draft), null, 2)], {type:'application/json'}), '备课草稿.json') }
async function downloadArchive() {
  if (exporting.value || refining.value) return
  exporting.value = true; operationError.value = ''
  try {
    if (!await saves.flush()) { operationError.value = '请先保存修改，再导出最新备课包。'; return }
    const response = await fetch(exportUrl(draft.id))
    if (!response.ok) throw new Error('导出失败，请检查服务连接后重试。已保存的内容不受影响。')
    download(await response.blob(), `${draft.input.topic.replace(/[\\/:*?"<>|]/g, '_')}_备课包.zip`)
  } catch (error) { operationError.value = error instanceof Error ? error.message : '导出失败，请重试。' }
  finally { exporting.value = false }
}
async function beforeLeave() {
  if (refining.value || exporting.value) { operationError.value = '当前操作尚未完成，请稍候再离开页面。'; return false }
  return props.readonly || await saves.flush()
}
onBeforeRouteLeave(beforeLeave)
onBeforeRouteUpdate(beforeLeave)
function beforeUnload(event: BeforeUnloadEvent) {
  if (saveState.value !== 'saved' || refining.value || exporting.value) { event.preventDefault(); event.returnValue = '' }
}
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(()=>{ saves.dispose(); window.removeEventListener('beforeunload', beforeUnload) })
const refineExample = computed(()=> draft.animation.lever ? '例如：让调砣过程慢一些，突出两侧力矩相等后再松手。' : draft.animation.pulley ? '例如：改为动滑轮，并说明拉力和拉绳距离如何变化。' : '例如：让箱子沿斜面移动得慢一些，保留拉力方向。')

function applyObjectives() { draft.lessonDesign.objectives = objectivesText.value.split('\n').map((item) => item.trim()).filter(Boolean); scheduleSave('lessonDesign') }
function applySteps() { draft.studentTaskSheet.steps = stepsText.value.split('\n').map((item) => item.trim()).filter(Boolean); scheduleSave('studentTaskSheet') }
async function runRefine() {
  if (refining.value || exporting.value) return
  refineError.value = ''; refining.value = true
  try {
    if (!await saves.flush()) { refineError.value = '请先保存当前修改，再优化动画。'; return }
    const project = await refineAnimation(draft.id, refineInstruction.value, draft.updatedAt)
    draft.animation = project.animation; draft.updatedAt = project.updatedAt; refineInstruction.value = ''
  } catch (error) { refineError.value = error instanceof Error ? error.message : '动画优化失败，请重试。' }
  finally { refining.value = false }
}
</script>
