import { describe, expect, it } from 'vitest'
import { splitMathText, legacyPhysicsTex } from '../client/src/lib/mathText'

describe('mathematical text presentation', () => {
  it('renders inline and display LaTeX while keeping surrounding prose', () => {
    const parts = splitMathText(String.raw`支持力 \(N=mg\cos\theta\)，$F=ma$。\[s=2h\] $$E=mc^2$$`)
    expect(parts.filter(part => part.html)).toHaveLength(4)
    expect(parts.filter(part => part.display)).toHaveLength(2)
    expect(parts[0].text).toBe('支持力 ')
    expect(parts.filter(part => part.html).every(part => part.html?.includes('<math'))).toBe(true)
  })

  it('renders existing physical notation without changing persisted content', () => {
    const source = '支持力 N=mg cosθ=9.21 N，扶平力 2.35 N，力矩 2.35 N·m，平衡 m物 g l物=m砣 g l砣。'
    expect(splitMathText(source, true).filter(part => part.html)).toHaveLength(4)
    expect(legacyPhysicsTex('g=9.8 m/s²')).toContain(String.raw`\mathrm{m/s^{2}}`)
    expect(legacyPhysicsTex('F=mg/2')).toContain(String.raw`\frac{mg}{2}`)
    expect(splitMathText('备课 API 版本 1.0.0')).toEqual([{ text: '备课 API 版本 1.0.0' }])
  })

  it('keeps HTML and invalid math as escaped text candidates, never raw HTML', () => {
    const input = '<img src=x onerror=alert(1)> ' + String.raw`\(\unknown{<script>}\)`
    const parts = splitMathText(input)
    expect(parts.every(part => part.html === undefined)).toBe(true)
    expect(parts[0].text).toContain('<img')
    const html = splitMathText(String.raw`\(\href{javascript:alert(1)}{x}\)`)[1]?.html ?? ''
    expect(html).not.toContain('href=')
    expect(splitMathText(String.raw`\(\includegraphics{https://example.com/image}\)`)[1]?.html ?? '').not.toContain('<img')
  })

  it('bounds macro expansion and falls back without throwing or contaminating later formulas', () => {
    expect(() => splitMathText(String.raw`\(\def\a{\a}\a\)`)).not.toThrow()
    expect(splitMathText(String.raw`\(\def\a{\a}\a\)`)[1]?.html).toBeUndefined()
    expect(splitMathText(String.raw`\(x^2\)`)[1]?.html).toContain('katex')
  })
})
