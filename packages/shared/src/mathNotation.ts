export type MathTextPart = { text: string; math?: boolean; display?: boolean }

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

function mathPart(text: string, display = false): MathTextPart { return { text, math: true, display } }

function plainParts(text: string, legacy: boolean): MathTextPart[] {
  if (!legacy) return [{ text }]
  // Existing stored projects stay unchanged; compatibility is presentation-only.
  const pattern = /m物 g l物=m砣 g l砣|[A-Za-z0-9θμ][A-Za-z0-9θμ .+*/²°-]*=[A-Za-z0-9θμ =.+*/²°-]+|\d+(?:\.\d+)?\s+(?:N·m|m\/s²|kg|N|m)\b|\b(?:mg|Fs|mgh|F|N|T|R|f)\b/g
  const result: MathTextPart[] = []
  let end = 0
  for (const match of text.matchAll(pattern)) {
    result.push({ text: text.slice(end, match.index) }, mathPart(legacyPhysicsTex(match[0])), { text: match[0].match(/\s+$/)?.[0] ?? '' })
    end = match.index + match[0].length
  }
  result.push({ text: text.slice(end) })
  return result
}

/** Shared notation boundary for browser rendering and editable Word equations. */
export function tokenizeMathText(text: string, legacy = false): MathTextPart[] {
  const result: MathTextPart[] = []
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
