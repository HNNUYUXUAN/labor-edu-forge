import katex from 'katex'

export type TextPart = { text: string; html?: string; display?: boolean }

/** Convert only the legacy notation emitted by our three physics compilers. */
export function legacyPhysicsTex(value: string) {
  return value.trim()
    .replace(/m物 g l物=m砣 g l砣/g, 'm_{\\text{物}} g l_{\\text{物}}=m_{\\text{砣}} g l_{\\text{砣}}')
    .replace(/θ/g, '\\theta ').replace(/μ/g, '\\mu ')
    .replace(/\b(sin|cos)/g, '\\$1 ')
    .replace(/mg\/([12])/g, '\\frac{mg}{$1}')
    .replace(/°/g, '^{\\circ}').replace(/²/g, '^{2}')
    .replace(/\s+(N·m|m\/s\^\{2\}|kg|N|m)(?=$|\s)/g, (_, unit: string) => `\\,\\mathrm{${unit.replace('·', '\\cdot ')}}`)
    .replace(/·/g, '\\cdot ')
}

function mathPart(text: string, display = false): TextPart {
  try {
    if (text.length > 4000) return { text }
    return { text, display, html: katex.renderToString(text, {
      displayMode: display, output: 'htmlAndMathml', throwOnError: true,
      trust: false, strict: 'ignore', maxExpand: 200, maxSize: 10,
    }) }
  } catch { return { text } }
}

function plainParts(text: string, legacy: boolean): TextPart[] {
  if (!legacy) return [{ text }]
  // Existing stored projects stay unchanged; compatibility is presentation-only.
  const pattern = /m物 g l物=m砣 g l砣|[A-Za-z0-9θμ][A-Za-z0-9θμ .+*/²°-]*=[A-Za-z0-9θμ =.+*/²°-]+|\d+(?:\.\d+)?\s+(?:N·m|m\/s²|kg|N|m)\b|\b(?:mg|Fs|mgh|F|N|T|R|f)\b/g
  const result: TextPart[] = []
  let end = 0
  for (const match of text.matchAll(pattern)) {
    result.push({ text: text.slice(end, match.index) }, mathPart(legacyPhysicsTex(match[0])), { text: match[0].match(/\s+$/)?.[0] ?? '' })
    end = match.index + match[0].length
  }
  result.push({ text: text.slice(end) })
  return result
}

/** Plain content stays Vue-escaped; only KaTeX output may enter v-html. */
export function splitMathText(text: string, legacy = false): TextPart[] {
  const result: TextPart[] = []
  const pattern = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\\)\$([^\n$]+?)(?<!\\)\$/g
  let end = 0
  for (const match of text.matchAll(pattern)) {
    result.push(...plainParts(text.slice(end, match.index), legacy))
    result.push(mathPart(match[1] ?? match[2] ?? match[3] ?? match[4]!, Boolean(match[1] || match[2])))
    end = match.index + match[0].length
  }
  result.push(...plainParts(text.slice(end), legacy))
  return result
}
