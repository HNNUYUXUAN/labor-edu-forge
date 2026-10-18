import katex from 'katex'
import { tokenizeMathText } from '@labor-edu-forge/shared'
export { legacyPhysicsTex } from '@labor-edu-forge/shared'

export type TextPart = { text: string; html?: string; display?: boolean }

function mathPart(text: string, display = false): TextPart {
  try {
    if (text.length > 4000) return { text }
    return { text, display, html: katex.renderToString(text, {
      displayMode: display, output: 'htmlAndMathml', throwOnError: true,
      trust: false, strict: 'ignore', maxExpand: 200, maxSize: 10,
    }) }
  } catch { return { text } }
}


export function splitMathText(text: string, legacy = false): TextPart[] {
  return tokenizeMathText(text, legacy).map(part => part.math ? mathPart(part.text, part.display) : { text: part.text })
}
