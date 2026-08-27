import { expect, test } from '@playwright/test'

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
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: /导出备课包/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('备课包')
  await page.screenshot({ path: testInfo.outputPath('project-workbench.png'), fullPage: true })
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
