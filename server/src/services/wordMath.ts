import katex from 'katex'
import { DOMParser, type Element } from '@xmldom/xmldom'
import { ImportedXmlComponent, Math as WordMath, TextRun, type ParagraphChild, type XmlComponent } from 'docx'
import { tokenizeMathText } from '@labor-edu-forge/shared'

export const documentFont = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '宋体', cs: 'Times New Roman' }
const escapeXml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const children = (node: Element) => Array.from(node.childNodes).filter(n => n.nodeType === 1) as Element[]
const element = (name: string, body: string) => `<m:${name}>${body}</m:${name}>`

function run(text: string, italic = false, bold = false) {
  return `<m:r><m:rPr><m:nor/></m:rPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体" w:cs="Times New Roman"/>${italic ? '<w:i/>' : ''}${bold ? '<w:b/>' : ''}<w:sz w:val="22"/></w:rPr><m:t xml:space="preserve">${escapeXml(text)}</m:t></m:r>`
}

/** Convert KaTeX's presentation MathML to Word's editable equation tree. */
function convert(node: Element, variant = ''): string {
  const tag = node.localName, nodes = children(node)
  const style = node.getAttribute('mathvariant') || variant
  const at = (index: number) => nodes[index] ? convert(nodes[index], style) : ''
  const all = () => nodes.map(n => convert(n, style)).join('')
  switch (tag) {
    case 'math': case 'mstyle': case 'mpadded': return all()
    case 'mrow': {
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (nodes.length > 2 && first.getAttribute('fence') === 'true' && last?.getAttribute('fence') === 'true') {
        return element('d', `<m:dPr><m:begChr m:val="${escapeXml(first.textContent ?? '')}"/><m:endChr m:val="${escapeXml(last.textContent ?? '')}"/></m:dPr>` + element('e', nodes.slice(1, -1).map(n => convert(n, style)).join('')))
      }
      return all()
    }
    case 'semantics': return at(0)
    case 'annotation': return ''
    case 'mi': case 'mn': case 'mo': case 'mtext': {
      const text = node.textContent ?? ''
      if (/^[\u2061-\u2064]+$/.test(text)) return ''
      return run(text, style.includes('italic') || (tag === 'mi' && !style && [...text].length === 1), style.includes('bold'))
    }
    case 'mspace': return run(' ')
    case 'mfrac': return element('f', (node.getAttribute('linethickness') === '0px' ? '<m:fPr><m:type m:val="noBar"/></m:fPr>' : '') + element('num', at(0)) + element('den', at(1)))
    case 'msup': return element('sSup', element('e', at(0)) + element('sup', at(1)))
    case 'msub': return element('sSub', element('e', at(0)) + element('sub', at(1)))
    case 'msubsup': return element('sSubSup', element('e', at(0)) + element('sub', at(1)) + element('sup', at(2)))
    case 'msqrt': return element('rad', '<m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/>' + element('e', all()))
    case 'mroot': return element('rad', element('deg', at(1)) + element('e', at(0)))
    case 'mover': {
      const accent = nodes[1]?.textContent ?? ''
      if (node.getAttribute('accent') === 'true') return element('acc', `<m:accPr><m:chr m:val="${escapeXml(accent)}"/></m:accPr>` + element('e', at(0)))
      return element('limUpp', element('e', at(0)) + element('lim', at(1)))
    }
    case 'munder': return element('limLow', element('e', at(0)) + element('lim', at(1)))
    case 'munderover': return element('limUpp', element('e', element('limLow', element('e', at(0)) + element('lim', at(1)))) + element('lim', at(2)))
    case 'mtable': return element('m', nodes.map(row => element('mr', children(row).map(cell => element('e', convert(cell, style))).join(''))).join(''))
    case 'mtd': return all()
    case 'menclose': if (node.getAttribute('notation') === 'box') return element('borderBox', element('e', all())); break
    case 'mphantom': return element('phant', '<m:phantPr><m:show m:val="0"/></m:phantPr>' + element('e', all()))
  }
  throw new Error(`Unsupported mathematical structure: ${tag}`)
}

class EquationXml extends ImportedXmlComponent {
  static equation(xml: string): WordMath {
    const document = ImportedXmlComponent.fromXmlString(xml) as EquationXml
    return document.root[0] as XmlComponent as WordMath
  }
}

export function nativeEquation(tex: string, display = false): WordMath {
  if (tex.length > 4000) throw new Error('Formula exceeds supported length')
  const mathml = katex.renderToString(tex, { output: 'mathml', displayMode: display, throwOnError: true, trust: false, strict: 'ignore', maxExpand: 200, maxSize: 10 })
  const parsed = new DOMParser().parseFromString(mathml, 'application/xml')
  const root = parsed.getElementsByTagName('math')[0]
  if (!root || root.getElementsByTagName('merror').length) throw new Error('Invalid formula')
  return EquationXml.equation(`<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${convert(root)}</m:oMath>`)
}

export function wordRuns(text: string, legacy = true): ParagraphChild[] {
  return tokenizeMathText(text, legacy).flatMap(part => {
    if (part.math) {
      try {
        const math = nativeEquation(part.text, part.display)
        return part.display ? [new TextRun({ break: 1 }), math, new TextRun({ break: 1 })] : [math]
      } catch {
        // Preserve author content verbatim when a structure cannot be represented.
        return [new TextRun({ text: part.text, font: documentFont })]
      }
    }
    return part.text.split('\n').map((line, index) => new TextRun({ text: line, font: documentFont, ...(index ? { break: 1 } : {}) }))
  })
}
