import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import JSZip from 'jszip'

test('selecting a case copies all classroom settings without reactive clone errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/new')
  const templates = await (await page.request.get('/api/templates')).json()
  for (const template of templates) {
    await page.getByRole('button', { name: new RegExp(`^${template.title}`) }).click()
    await expect(page.getByLabel('劳动场景', { exact: true })).toHaveValue(template.input.scenario)
    await page.getByRole('button', { name: /下一步：设置课堂/ }).click()
    for (const point of template.input.knowledgePoints) {
      await expect(page.getByRole('button', { name: `删除${point}`, exact: true })).toBeVisible()
    }
    await expect(page.locator('.tag-input .tag')).toHaveCount(template.input.knowledgePoints.length)
    const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem('labor-edu-forge:new-project')!))
    expect(draft).toEqual(template.input)
    await page.getByRole('button', { name: /01 选择主题/ }).click()
  }
  expect(errors).toEqual([])
})

test('three-step flow creates, edits and exports a project', async ({ page }, testInfo) => {
  await page.goto('/new')
  await expect(page.getByRole('heading', { name: '从一个真实劳动场景开始' })).toBeVisible()
  const scenario = page.getByLabel('劳动场景')
  await scenario.fill('在校园工具间合作清点并安全搬运劳动器材。')
  await page.reload()
  await expect(page.getByLabel('劳动场景')).toHaveValue('在校园工具间合作清点并安全搬运劳动器材。')
  await page.getByRole('button', { name: /斜面搬运/ }).press('Enter')
  await page.getByRole('button', { name: /下一步：设置课堂/ }).click()
  await expect(page.getByRole('heading', { name: '设置这节课的课堂条件' })).toBeVisible()
  await page.getByRole('button', { name: /下一步：教学重点/ }).click()
  await expect(page.getByRole('heading', { name: '明确这节课最重要的学习收获' })).toBeVisible()
  await page.getByRole('button', { name: /生成备课包/ }).click()
  await expect(page).toHaveURL(/\/projects\//)
  await expect(page.getByRole('heading', { name: /斜面搬运/ }).first()).toBeVisible()
  await page.getByRole('button', { name: '编辑内容' }).first().click()
  const objectives = page.locator('.editor-textarea').first()
  await objectives.fill('理解斜面省力原理\n能够安全完成合作搬运')
  await expect(page.getByText('已保存')).toBeVisible({ timeout: 5_000 })
  await objectives.fill(String.raw`理解斜面拉力 \(F=mg\sin\theta\)`)
  await expect(page.getByText('已保存')).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: '完成编辑' }).click()
  await expect(page.locator('.number-list .katex')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.number-list .katex')).toHaveCount(1)
  await page.getByRole('button', { name: '编辑内容' }).first().click()
  await page.locator('.editor-textarea').first().fill(String.raw`公式 \(F=ma\) 与原文 <img src=x onerror=alert(1)>`)
  await expect(page.getByText('已保存')).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: '完成编辑' }).click()
  await expect(page.locator('.number-list img')).toHaveCount(0)
  await expect(page.locator('.number-list')).toContainText('<img src=x onerror=alert(1)>')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /导出备课包/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('备课包')
  const archive = await JSZip.loadAsync(await readFile((await download.path())!))
  expect(Object.keys(archive.files)).toHaveLength(4)
  const lesson = await JSZip.loadAsync(await archive.file('01_教学设计.docx')!.async('nodebuffer'))
  const document = await lesson.file('word/document.xml')!.async('string')
  expect(document).toContain('<m:oMath')
  expect(document).not.toContain('\\(F=ma\\)')
  expect(document).toContain('&lt;img src=x onerror=alert(1)&gt;')
  expect(document).toContain('w:eastAsia="宋体"')
  expect(document).toContain('w:ascii="Times New Roman"')
  await page.screenshot({ path: testInfo.outputPath('project-workbench.png'), fullPage: true })
})

test('all built-in diagrams render math and retain playback controls', async ({ page }) => {
  for (const id of ['inclined-plane', 'lever-weighing', 'pulley-watering']) {
    await page.goto(`/templates/${id}`)
    await page.getByRole('tab', { name: '动画演示', exact: true }).click()
    await expect(page.locator('.animation-stage .katex').first()).toBeVisible()
    await expect(page.locator('.katex-error')).toHaveCount(0)
    await page.getByRole('button', { name: '播放', exact: true }).click()
    await expect.poll(async () => Number(await page.getByLabel('动画进度').inputValue())).toBeGreaterThan(0)
    await page.getByRole('button', { name: '暂停', exact: true }).click()
    await expect(page.getByRole('button', { name: '播放', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('templates remain browsable and mobile navigation works', async ({ page }, testInfo) => {
  await page.goto('/templates')
  await expect(page.getByRole('heading', { name: '案例模板' })).toBeVisible()
  await page.locator('.editorial-list .editorial-item').first().click()
  await expect(page.getByRole('link', { name: /基于案例备课/ })).toBeVisible()
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: '打开导航' }).click()
    await expect(page.getByRole('navigation').last()).toBeVisible()
  }
})
