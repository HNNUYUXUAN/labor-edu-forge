<template>
  <section class="wizard-page">
    <header class="stepper" aria-label="备课步骤">
      <button v-for="item in steps" :key="item.number" :class="{ active: step === item.number, done: step > item.number }" :disabled="submitting" :aria-current="step === item.number ? 'step' : undefined" @click="goToStep(item.number)">
        <span>{{ String(item.number).padStart(2, '0') }}</span>{{ item.label }}
      </button>
    </header>

    <div v-if="loadingSetup" class="feedback-banner" role="status">正在检查本机服务…</div>
    <div v-else-if="setupError" class="feedback-banner error-text" role="alert"><p>{{ setupError }}</p><button class="text-button" @click="loadSetup">重新连接</button></div>
    <div v-else-if="health && !health.providerReady" class="feedback-banner"><p>尚未配置生成服务。可以先浏览完整案例和动画，也可以继续填写备课信息。</p><RouterLink to="/templates">先看案例</RouterLink> · <RouterLink to="/guide">查看配置方法</RouterLink> · <button class="text-button" @click="loadSetup">重新检查</button></div>
    <div class="wizard-layout">
      <form class="wizard-form" @submit.prevent="submit">
        <fieldset class="wizard-fields" :disabled="submitting">
        <div v-if="step === 1" class="step-view">
          <h1>从一个真实劳动场景开始</h1>
          <p class="lead">选择一个案例作为起点，或描述你想带学生完成的劳动任务。</p>
          <h2>从案例开始</h2>
          <div class="template-options">
            <button v-for="template in templates" :key="template.id" type="button" class="template-option" :class="{ selected: templateId === template.id }" @click="selectTemplate(template)">
              <span><strong>{{ template.title }}</strong><small>{{ template.summary }}</small></span>
              <span class="radio-mark"><Check v-if="templateId === template.id" :size="18" /></span>
            </button>
          </div>
          <div class="or-divider"><span>或者，描述自己的场景</span></div>
          <label class="field-label" for="scenario">劳动场景</label>
          <textarea id="scenario" v-model="scenario" maxlength="200" rows="4" placeholder="例如：组织学生搭建校园小菜园，需要搬运土壤、规划工具并分工协作" @input="clearTemplateIfChanged" />
          <div class="field-meta"><span class="error-text">{{ errors.scenario }}</span><span>{{ scenario.length }}/200</span></div>
        </div>

        <div v-else-if="step === 2" class="step-view">
          <h1>设置这节课的课堂条件</h1>
          <p class="lead">告诉系统面对怎样的学生、使用多少时间，以及要连接哪一项学科知识。</p>
          <div class="settings-list">
            <div class="setting-row"><label>适用年级</label><div><BaseSelect v-model="gradeLevel" label="适用年级" :options="gradeOptions" /><small>用于调整活动难度、表达方式与评价标准</small></div></div>
            <div class="setting-row"><label>课时长度</label><div><BaseSelect v-model="durationValue" label="课时长度" :options="durationOptions" /><small>系统会按时长分配导入、探究、实践与反思时间</small></div></div>
            <div class="setting-row"><label>融合学科</label><div><BaseSelect v-model="subject" label="融合学科" :options="subjectOptions" /><small>选择一门与劳动任务联系最紧密的学科</small></div></div>
            <div class="setting-row"><label for="knowledge">知识点</label><div>
              <div class="tag-input" :class="{ focused: knowledgeFocused }">
                <span v-for="point in knowledgePoints" :key="point" class="tag">{{ point }}<button type="button" :aria-label="`删除${point}`" @click="removeKnowledge(point)"><X :size="15" /></button></span>
                <input id="knowledge" v-model="knowledgeDraft" :disabled="knowledgePoints.length >= 3" placeholder="输入后按回车" @focus="knowledgeFocused = true" @blur="knowledgeFocused = false" @keydown.enter.prevent="addKnowledge" />
              </div>
              <small>控制在 1—3 个核心知识点；点击下一步也会加入输入框中的内容</small><p v-if="errors.knowledge" class="error-text" role="alert">{{ errors.knowledge }}</p>
            </div></div>
          </div>
        </div>

        <div v-else class="step-view">
          <h1>明确这节课最重要的学习收获</h1>
          <p class="lead">选择 2—3 个重点，系统会据此组织教学流程、任务单与评价方式。</p>
          <h2>选择教学重点</h2>
          <div class="focus-list">
            <label v-for="focus in focusOptions" :key="focus.value">
              <CheckboxRoot class="checkbox" :model-value="focuses.includes(focus.value)" @update:model-value="toggleFocus(focus.value)"><CheckboxIndicator><Check :size="19" /></CheckboxIndicator></CheckboxRoot>
              <strong>{{ focus.value }}</strong><span>{{ focus.description }}</span>
            </label>
          </div>
          <label class="field-label" for="requirements">补充教学要求（可选）</label>
          <textarea id="requirements" v-model="requirements" maxlength="200" rows="4" placeholder="例如：希望学生完成一次小组测量，并用数据解释哪种搬运方式更省力" />
          <div class="field-meta"><span>已选 {{ focuses.length }} 项重点，至少选择 2 项</span><span>{{ requirements.length }}/200</span></div>
        </div>

        </fieldset>
        <p v-if="submitError" class="feedback-banner error-text" role="alert">{{ submitError }}</p>
        <p v-if="submitting" class="feedback-banner" role="status">正在生成四份课堂材料，可能需要数分钟。请保持页面打开，无需重复提交。<span aria-hidden="true"> 已等待 {{ elapsed }} 秒。</span></p>
        <footer class="wizard-footer">
          <span>第 {{ step }} 步，共 3 步</span>
          <div>
            <button type="button" class="button secondary" :disabled="step === 1 || submitting" @click="step--">上一步</button>
            <button v-if="step < 3" type="button" class="button primary" @click="nextStep">下一步：{{ step === 1 ? '设置课堂' : '教学重点' }}<ArrowRight :size="22" /></button>
            <button v-else class="button primary" :disabled="submitting || loadingSetup || !health?.providerReady || focuses.length < 2" type="submit">{{ submitting ? '正在生成…' : '生成备课包' }}<ArrowRight :size="22" /></button>
          </div>
        </footer>
      </form>

      <aside class="wizard-aside">
        <template v-if="step === 1"><h2>选题提示</h2><ol><li><b>01</b><span><strong>任务要真实可操作</strong>选择学生在校园或家庭中可能遇到的真实劳动任务。</span></li><li><b>02</b><span><strong>过程包含劳动技能</strong>任务中应包含搬运、测量、搭建、清洁或种植等技能。</span></li><li><b>03</b><span><strong>能够连接一项学科知识</strong>让知识自然地从劳动过程里生长出来。</span></li></ol></template>
        <template v-else-if="step === 2"><h2>已选主题</h2><h3>{{ topic }}</h3><p>{{ scenario }}</p><hr /><h2>设置建议</h2><ol><li><b>01</b><span><strong>按真实课表选择时长</strong>系统会根据时长分配各环节时间。</span></li><li><b>02</b><span><strong>只选择一门主要融合学科</strong>聚焦核心学科，避免活动失去劳动主线。</span></li><li><b>03</b><span><strong>知识点控制在 1—3 个</strong>确保课堂学习有的放矢。</span></li></ol></template>
        <template v-else><h2>本次备课</h2><dl><div><dt>劳动主题</dt><dd>{{ topic }}</dd></div><div><dt>适用年级</dt><dd>{{ gradeLevel }}</dd></div><div><dt>课时</dt><dd>{{ durationMinutes }} 分钟</dd></div><div><dt>学科融合</dt><dd>{{ subject }} · {{ knowledgePoints.join('与') }}</dd></div></dl><h2>将生成</h2><ul class="deliverables"><li>教学设计</li><li>学习任务单</li><li>评价量表</li><li>动画演示</li></ul><p class="info-note"><Info :size="18" />生成内容用于教学备课，请结合实际课堂调整。</p><p v-if="health && !health.providerReady" class="provider-note"><KeyRound :size="18" />未配置百炼密钥。示例仍可浏览，但新建与动画优化暂不可用；请在服务端 `.env.local` 配置 `DASHSCOPE_API_KEY`。</p></template>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { useSessionStorage } from '@vueuse/core'
import { ArrowRight, Check, Info, KeyRound, X } from '@lucide/vue'
import { createProjectInputSchema, type CreateProjectInput, type LessonTemplate, type TeachingFocus } from '@labor-edu-forge/shared'
import BaseSelect from '../components/BaseSelect.vue'
import { createProject, getHealth, listTemplates, type HealthStatus } from '../api/client'

const router = useRouter()
const route = useRoute()
const step = ref(1)
const templates = ref<Array<Omit<LessonTemplate, 'content'>>>([])
const health = ref<HealthStatus | null>(null)
const submitting = ref(false)
const completing = ref(false)
const elapsed = ref(0)
let elapsedTimer: ReturnType<typeof setInterval> | undefined
const loadingSetup = ref(true)
const setupError = ref('')
const submitError = ref('')
const errors = reactive({ scenario: '', knowledge: '' })
const knowledgeDraft = ref('')
const knowledgeFocused = ref(false)

const defaultInput: CreateProjectInput = {
  templateId: 'inclined-plane', topic: '斜面搬运', scenario: '在校园器材室使用斜面和测力计，把一箱器材安全搬运到高台。',
  gradeLevel: '初中八年级', durationMinutes: 40, subject: '物理', knowledgePoints: ['功', '力的分解', '机械效率'],
  focuses: ['劳动技能', '科学理解', '安全意识'], requirements: '',
}
const sessionDraft = useSessionStorage<CreateProjectInput>('labor-edu-forge:new-project', defaultInput)
const { values, defineField, setFieldValue, handleSubmit } = useForm<CreateProjectInput>({ initialValues: sessionDraft.value })
const [templateId] = defineField('templateId')
const [topic] = defineField('topic')
const [scenario] = defineField('scenario')
const [gradeLevel] = defineField('gradeLevel')
const [durationMinutes] = defineField('durationMinutes')
const [subject] = defineField('subject')
const [knowledgePoints] = defineField('knowledgePoints')
const [focuses] = defineField('focuses')
const [requirements] = defineField('requirements')

const durationValue = computed({ get: () => String(durationMinutes.value), set: (value: string) => { durationMinutes.value = Number(value) } })
const steps = [{ number: 1, label: '选择主题' }, { number: 2, label: '课堂设置' }, { number: 3, label: '教学重点' }]
const gradeOptions = ['小学中年级', '小学高年级', '初中七年级', '初中八年级', '初中九年级', '高中一年级'].map((value) => ({ label: value, value }))
const durationOptions = [35, 40, 45, 80, 90].map((value) => ({ label: `${value} 分钟`, value: String(value) }))
const subjectOptions = ['物理', '科学', '生物', '化学', '地理', '数学', '信息科技'].map((value) => ({ label: value, value }))
const focusOptions: Array<{ value: TeachingFocus; description: string }> = [
  { value: '劳动技能', description: '掌握搬运、测量与规范操作的方法' },
  { value: '科学理解', description: '理解劳动过程背后的学科原理' },
  { value: '安全意识', description: '识别器材、环境与协作中的风险' },
  { value: '协作反思', description: '通过分工、记录与复盘改进劳动过程' },
]

watch(values, (current) => {
  sessionDraft.value = JSON.parse(JSON.stringify(current)) as CreateProjectInput
}, { deep: true, flush: 'sync' })

function selectTemplate(template: Omit<LessonTemplate, 'content'>) {
  const input = JSON.parse(JSON.stringify(template.input)) as CreateProjectInput
  for (const [key, value] of Object.entries(input)) setFieldValue(key as keyof CreateProjectInput, value as never)
}
function clearTemplateIfChanged() {
  templateId.value = undefined
  topic.value = scenario.value.trim().slice(0, 16) || '自定义劳动课'
}
function removeKnowledge(point: string) { knowledgePoints.value = knowledgePoints.value.filter((item) => item !== point) }
function addKnowledge() {
  errors.knowledge = ''
  const value = knowledgeDraft.value.trim()
  if (value.length > 200) { errors.knowledge = '每个知识点请控制在 200 字以内。'; return }
  if (value && knowledgePoints.value.length < 3 && !knowledgePoints.value.includes(value)) knowledgePoints.value = [...knowledgePoints.value, value]
  knowledgeDraft.value = ''
}
function toggleFocus(focus: TeachingFocus) {
  if (focuses.value.includes(focus)) focuses.value = focuses.value.filter((item) => item !== focus)
  else if (focuses.value.length < 3) focuses.value = [...focuses.value, focus]
}
async function nextStep() {
  if (step.value === 1) {
    const result = createProjectInputSchema.shape.scenario.safeParse(scenario.value)
    errors.scenario = result.success ? '' : '请描述一个真实、可操作的劳动场景。'
    if (!result.success) return
    if (!topic.value) topic.value = scenario.value.slice(0, 16)
  }
  if (step.value === 2) {
    addKnowledge()
    if (errors.knowledge) return
    if (knowledgePoints.value.length === 0) { errors.knowledge = '请至少添加一个知识点，再继续下一步。'; return }
  }
  step.value++
}
function goToStep(target: number) { if (target <= step.value) step.value = target }

const submit = handleSubmit(async (payload) => {
  submitError.value = ''
  if (!health.value?.providerReady) return
  const validPayload = createProjectInputSchema.safeParse(payload)
  if (!validPayload.success) { submitError.value = validPayload.error.issues[0]?.message || '请检查备课信息。'; return }
  submitting.value = true; elapsed.value = 0
  const started = Date.now()
  elapsedTimer = setInterval(()=>{ elapsed.value = Math.floor((Date.now()-started)/1000) }, 1000)
  try {
    const project = await createProject(validPayload.data)
    sessionDraft.value = defaultInput
    completing.value = true
    await router.push(`/projects/${project.id}`)
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '生成失败，请稍后重试。'
  } finally { submitting.value = false; completing.value = false; clearInterval(elapsedTimer) }
})

let selectedQuery: string | undefined
function applySelectedTemplate() {
  const id = typeof route.query.template === 'string' ? route.query.template : undefined
  const selected = templates.value.find(item=>item.id===id)
  if (selected && id !== selectedQuery) { selectTemplate(selected); selectedQuery = id }
}
async function loadSetup() {
  loadingSetup.value = true; setupError.value = ''
  const [cases, status] = await Promise.allSettled([listTemplates(), getHealth()])
  if (cases.status === 'fulfilled') templates.value = cases.value
  if (status.status === 'fulfilled') health.value = status.value
  else health.value = null
  if (cases.status === 'rejected' || status.status === 'rejected') setupError.value = '本机服务暂时无法连接。填写内容会保留，请启动服务后重新连接。'
  loadingSetup.value = false
  applySelectedTemplate()
}
watch(()=>route.query.template, applySelectedTemplate)
onMounted(loadSetup)
function canLeave() {
  if (!submitting.value || completing.value) return true
  submitError.value = '备课仍在生成，请等待完成后再离开，以免错过结果。'
  return false
}
onBeforeRouteLeave(canLeave)
onBeforeRouteUpdate(canLeave)
function beforeUnload(event: BeforeUnloadEvent) {
  if (submitting.value) { event.preventDefault(); event.returnValue = '' }
}
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(()=>{ clearInterval(elapsedTimer); window.removeEventListener('beforeunload', beforeUnload) })
</script>
