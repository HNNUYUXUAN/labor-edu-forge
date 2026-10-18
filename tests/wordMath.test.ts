import { describe, expect, it } from 'vitest'
import { Document, Packer, Paragraph } from 'docx'
import JSZip from 'jszip'
import { DOMParser } from '@xmldom/xmldom'
import { nativeEquation, wordRuns } from '../server/src/services/wordMath'
import { buildProjectArchive } from '../server/src/services/exportService'
import { lessonTemplates } from '../server/src/data/templates'
import type { LessonProject } from '@labor-edu-forge/shared'

const mathNS = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
async function xmlOf(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file('word/document.xml')!.async('string')
  return { xml, dom: new DOMParser().parseFromString(xml, 'application/xml'), zip }
}

describe('editable Word equations', () => {
  it('writes structural fractions, roots, scripts, matrices and mathematical limits', async () => {
    const tex = String.raw`\frac{F_1 l_1}{F_2 l_2}=\sqrt{x^2+y^2}+\sum_{i=1}^{n}i+\begin{pmatrix}1&2\\3&4\end{pmatrix}`
    const { xml, dom } = await xmlOf(await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph({ children: [nativeEquation(tex)] })] }] })))
    for (const name of ['oMath', 'f', 'rad', 'sSub', 'sSup', 'm', 'd']) expect(dom.getElementsByTagNameNS(mathNS, name).length, name).toBeGreaterThan(0)
    expect(xml).not.toContain('\\frac')
    expect(xml).toContain('w:ascii="Times New Roman"')
    expect(xml).toContain('w:eastAsia="宋体"')
  })

  it('preserves mixed text and malformed formulas, bounds macro expansion and escapes XML', async () => {
    expect(() => nativeEquation(String.raw`\def\a{\a}\a`)).toThrow()
    const { xml, dom } = await xmlOf(await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph({ children: wordRuns(String.raw`中文 A12 \(F=ma\) <script> \(\unknown{x}\)`) })] }] })))
    expect(dom.getElementsByTagNameNS(mathNS, 'oMath')).toHaveLength(1)
    expect(xml).toContain('&lt;script&gt;')
    expect(xml).toContain('\\unknown{x}')
    expect(dom.documentElement.tagName).toBe('w:document')
  })

  it('exports all four documents with native equations in body, table, task and animation', async () => {
    for (const template of lessonTemplates) {
      const project = structuredClone({ ...template.content, input: template.input, id: 'export-test', createdAt: '', updatedAt: '' }) as LessonProject
      project.lessonDesign.objectives = [String.raw`观察 \(F=ma\)`]
      project.lessonDesign.teachingProcess[0].teacherActions = [String.raw`比较 \(\frac{F}{m}=a\)`]
      project.studentTaskSheet.taskGoal = String.raw`记录 \(h=\sqrt{x^2}\)`
      project.rubric.dimensions[0].excellent = String.raw`解释 \(F_1l_1=F_2l_2\)`
      const archive = await JSZip.loadAsync(await buildProjectArchive(project))
      expect(Object.keys(archive.files)).toHaveLength(4)
      for (const entry of Object.values(archive.files)) {
        const { xml, dom, zip } = await xmlOf(await entry.async('nodebuffer'))
        expect(dom.getElementsByTagNameNS(mathNS, 'oMath').length, entry.name).toBeGreaterThan(0)
        expect(xml).not.toContain('word/media')
        const styles = await zip.file('word/styles.xml')!.async('string')
        expect(styles).toContain('w:eastAsia="宋体"')
        expect(styles).toContain('w:ascii="Times New Roman"')
      }
    }
  })
})
