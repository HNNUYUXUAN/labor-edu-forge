<template>
  <section class="project-workbench">
    <header class="project-header">
      <div><h1>{{ draft.lessonDesign.title }}</h1><p>{{ draft.input.gradeLevel }} · {{ draft.input.durationMinutes }} 分钟 · {{ draft.input.subject }}融合</p></div>
      <div class="project-actions">
        <span v-if="!readonly" class="save-status" :class="saveState"><CircleCheck v-if="saveState === 'saved'" :size="17" />{{ saveLabel }}</span>
        <RouterLink class="button secondary" :to="readonly ? `/new?template=${templateId}` : '/new'"><RefreshCw :size="18" />{{ readonly ? '基于案例备课' : '重新备课' }}</RouterLink>
        <a v-if="!readonly" class="button primary" :href="exportUrl(draft.id)">导出备课包<ArrowRight :size="20" /></a>
      </div>
    </header>

    <TabsRoot v-model="activeTab" class="project-tabs">
      <TabsList class="tab-list" aria-label="备课包内容">
        <TabsTrigger value="lessonDesign">教学设计</TabsTrigger>
        <TabsTrigger value="studentTaskSheet">学习任务单</TabsTrigger>
        <TabsTrigger value="rubric">评价量表</TabsTrigger>
        <TabsTrigger value="animation">动画演示</TabsTrigger>
      </TabsList>

      <div class="workbench-body">
        <div class="document-pane">
          <TabsContent value="lessonDesign">
            <div class="section-heading"><h2>教学目标</h2><button v-if="!readonly" class="text-button" @click="editing.lessonDesign = !editing.lessonDesign"><SquarePen :size="18" />{{ editing.lessonDesign ? '完成编辑' : '编辑内容' }}</button></div>
            <textarea v-if="editing.lessonDesign" v-model="objectivesText" class="editor-textarea" rows="6" @input="applyObjectives" />
            <ol v-else class="number-list"><li v-for="item in draft.lessonDesign.objectives" :key="item">{{ item }}</li></ol>
            <div class="rule" />
            <div class="section-heading"><h2>教学流程</h2></div>
            <div class="process-table">
              <div class="process-row process-head"><span>教学环节</span><span>时间</span><span>教师活动</span><span>学生活动</span><span>设计意图</span></div>
              <div v-for="(item, index) in draft.lessonDesign.teachingProcess" :key="index" class="process-row">
                <strong><i />{{ item.stage }}</strong><span>{{ item.minutes }} 分钟</span>
                <textarea v-if="editing.lessonDesign" v-model="item.teacherActions[0]" @input="scheduleSave('lessonDesign')" /><span v-else>{{ item.teacherActions.join('；') }}</span>
                <textarea v-if="editing.lessonDesign" v-model="item.studentActions[0]" @input="scheduleSave('lessonDesign')" /><span v-else>{{ item.studentActions.join('；') }}</span>
                <textarea v-if="editing.lessonDesign" v-model="item.intention" @input="scheduleSave('lessonDesign')" /><span v-else>{{ item.intention }}</span>
              </div>
            </div>
            <div class="rule" /><h2>安全提示</h2><ul class="plain-list"><li v-for="item in draft.lessonDesign.safetyNotes" :key="item">{{ item }}</li></ul>
          </TabsContent>

          <TabsContent value="studentTaskSheet">
            <div class="section-heading"><h2>{{ draft.studentTaskSheet.title }}</h2><button v-if="!readonly" class="text-button" @click="editing.studentTaskSheet = !editing.studentTaskSheet"><SquarePen :size="18" />{{ editing.studentTaskSheet ? '完成编辑' : '编辑内容' }}</button></div>
            <label class="content-label">任务目标</label><textarea v-if="editing.studentTaskSheet" v-model="draft.studentTaskSheet.taskGoal" class="editor-textarea" rows="3" @input="scheduleSave('studentTaskSheet')" /><p v-else class="document-lead">{{ draft.studentTaskSheet.taskGoal }}</p>
            <h2>任务步骤</h2><textarea v-if="editing.studentTaskSheet" v-model="stepsText" class="editor-textarea" rows="8" @input="applySteps" /><ol v-else class="task-steps"><li v-for="item in draft.studentTaskSheet.steps" :key="item">{{ item }}</li></ol>
            <h2>观察与记录</h2><div class="record-grid"><article v-for="item in draft.studentTaskSheet.recordPrompts" :key="item.label"><strong>{{ item.label }}</strong><p>{{ item.hint }}</p><span /></article></div>
          </TabsContent>

          <TabsContent value="rubric">
            <div class="section-heading"><h2>{{ draft.rubric.title }}</h2><button v-if="!readonly" class="text-button" @click="editing.rubric = !editing.rubric"><SquarePen :size="18" />{{ editing.rubric ? '完成编辑' : '编辑内容' }}</button></div>
            <div class="rubric-table"><div class="rubric-row rubric-head"><span>评价维度</span><span>表现优秀</span><span>达到要求</span><span>继续发展</span></div><div v-for="item in draft.rubric.dimensions" :key="item.dimension" class="rubric-row"><strong>{{ item.dimension }}</strong><template v-if="editing.rubric"><textarea v-model="item.excellent" @input="scheduleSave('rubric')" /><textarea v-model="item.competent" @input="scheduleSave('rubric')" /><textarea v-model="item.developing" @input="scheduleSave('rubric')" /></template><template v-else><span>{{ item.excellent }}</span><span>{{ item.competent }}</span><span>{{ item.developing }}</span></template></div></div>
          </TabsContent>

          <TabsContent value="animation">
            <div class="section-heading"><h2>{{ draft.animation.title }}</h2><button v-if="!readonly" class="text-button" @click="editing.animation = !editing.animation"><SquarePen :size="18" />{{ editing.animation ? '完成编辑' : '编辑说明' }}</button></div>
            <label class="content-label">演示原理</label><textarea v-if="editing.animation" v-model="draft.animation.principle" class="editor-textarea" rows="4" @input="scheduleSave('animation')" /><p v-else class="document-lead">{{ draft.animation.principle }}</p>
            <label class="content-label">教师提示</label><textarea v-if="editing.animation" v-model="draft.animation.teacherTip" class="editor-textarea" rows="4" @input="scheduleSave('animation')" /><p v-else>{{ draft.animation.teacherTip }}</p>
            <div v-if="!readonly" class="refine-box"><h3>用自然语言优化动画</h3><p>例如：“让箱子移动得慢一些，并在斜面变陡时突出显示拉力方向。”</p><textarea v-model="refineInstruction" rows="3" maxlength="500" /><button class="button primary" :disabled="refining || refineInstruction.trim().length < 2" @click="runRefine">{{ refining ? '正在优化…' : '优化动画' }}</button><span v-if="refineError" class="error-text">{{ refineError }}</span></div>
          </TabsContent>
        </div>
        <aside class="animation-pane"><h2>动画演示</h2><AnimationPlayer :spec="draft.animation" /><h3>教师提示</h3><p>{{ draft.animation.teacherTip }}</p><p class="info-note"><Info :size="18" />动画由 AI 生成，仅做教学参考，请结合实际学情使用。</p></aside>
      </div>
    </TabsRoot>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { ArrowRight, CircleCheck, Info, RefreshCw, SquarePen } from '@lucide/vue'
import type { LessonProject } from '@labor-edu-forge/shared'
import { exportUrl, refineAnimation, updateProject, type EditableSection } from '../api/client'
import AnimationPlayer from './AnimationPlayer.vue'

const props = withDefaults(defineProps<{ project: LessonProject; readonly?: boolean; templateId?: string }>(), { readonly: false, templateId: '' })
const draft = reactive<LessonProject>(JSON.parse(JSON.stringify(props.project)) as LessonProject)
const activeTab = ref<EditableSection>('lessonDesign')
const editing = reactive<Record<EditableSection, boolean>>({ lessonDesign: false, studentTaskSheet: false, rubric: false, animation: false })
const saveState = ref<'saved' | 'saving' | 'error'>('saved')
const pendingSection = ref<EditableSection>('lessonDesign')
const refineInstruction = ref('')
const refining = ref(false)
const refineError = ref('')
const objectivesText = ref(draft.lessonDesign.objectives.join('\n'))
const stepsText = ref(draft.studentTaskSheet.steps.join('\n'))
const saveLabel = computed(() => saveState.value === 'saving' ? '保存中' : saveState.value === 'error' ? '保存失败' : '已保存')
const toPlainObject = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const persist = useDebounceFn(async () => {
  if (props.readonly) return
  const section = pendingSection.value
  try {
    let project: LessonProject
    if (section === 'lessonDesign') project = await updateProject(draft.id, { section, value: toPlainObject(draft.lessonDesign), expectedUpdatedAt: draft.updatedAt })
    else if (section === 'studentTaskSheet') project = await updateProject(draft.id, { section, value: toPlainObject(draft.studentTaskSheet), expectedUpdatedAt: draft.updatedAt })
    else if (section === 'rubric') project = await updateProject(draft.id, { section, value: toPlainObject(draft.rubric), expectedUpdatedAt: draft.updatedAt })
    else project = await updateProject(draft.id, { section, value: toPlainObject(draft.animation), expectedUpdatedAt: draft.updatedAt })
    draft.updatedAt = project.updatedAt
    saveState.value = 'saved'
  } catch { saveState.value = 'error' }
}, 800)

function scheduleSave(section: EditableSection) { pendingSection.value = section; saveState.value = 'saving'; persist() }
function applyObjectives() { draft.lessonDesign.objectives = objectivesText.value.split('\n').map((item) => item.trim()).filter(Boolean); scheduleSave('lessonDesign') }
function applySteps() { draft.studentTaskSheet.steps = stepsText.value.split('\n').map((item) => item.trim()).filter(Boolean); scheduleSave('studentTaskSheet') }
async function runRefine() {
  refineError.value = ''; refining.value = true
  try { const project = await refineAnimation(draft.id, refineInstruction.value, draft.updatedAt); draft.animation = project.animation; draft.updatedAt = project.updatedAt; refineInstruction.value = ''; saveState.value = 'saved' }
  catch (error) { refineError.value = error instanceof Error ? error.message : '动画优化失败。' }
  finally { refining.value = false }
}
</script>
