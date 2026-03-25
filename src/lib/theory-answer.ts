import type { Descendant } from '@platejs/slate'

/** Prefix for theory responses stored as Plate/Slate JSON in answers map. */
export const THEORY_PLATE_ANSWER_PREFIX = '__theory_plate_v1:'

export function isTheoryPlateAnswer(raw: string | undefined): boolean {
  return typeof raw === 'string' && raw.startsWith(THEORY_PLATE_ANSWER_PREFIX)
}

export function encodeTheoryPlateAnswer(value: Descendant[]): string {
  return `${THEORY_PLATE_ANSWER_PREFIX}${JSON.stringify(value)}`
}

export function decodeTheoryPlateAnswer(raw: string): Descendant[] | null {
  if (!isTheoryPlateAnswer(raw)) return null
  try {
    const parsed = JSON.parse(raw.slice(THEORY_PLATE_ANSWER_PREFIX.length))
    return Array.isArray(parsed) ? (parsed as Descendant[]) : null
  } catch {
    return null
  }
}

export function slateNodesToPlainText(nodes: Descendant[]): string {
  const walk = (n: Descendant): string => {
    if ('text' in n && typeof (n as { text?: string }).text === 'string') {
      return (n as { text: string }).text
    }
    if ('children' in n && Array.isArray((n as { children: Descendant[] }).children)) {
      return (n as { children: Descendant[] }).children.map(walk).join('')
    }
    return ''
  }
  return nodes.map(walk).join('\n').trim()
}

export function theoryAnswerToPlainText(raw: string): string {
  const doc = decodeTheoryPlateAnswer(raw)
  if (doc) return slateNodesToPlainText(doc)
  return raw.trim()
}

export function slateNodesToHtml(nodes: Descendant[]): string {
  const leaf = (n: Record<string, unknown>): string => {
    const text = String(n.text ?? '')
    if (!text) return ''
    let out = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    if (n.bold) out = `<strong>${out}</strong>`
    if (n.italic) out = `<em>${out}</em>`
    if (n.underline) out = `<u>${out}</u>`
    return out
  }

  const walk = (n: Descendant): string => {
    if ('text' in n) return leaf(n as unknown as Record<string, unknown>)
    const children = ('children' in n
      ? (n as { children: Descendant[] }).children
      : []
    )
      .map(walk)
      .join('')
    return `<p style="margin:0 0 6px">${children || '&nbsp;'}</p>`
  }

  return nodes.map(walk).join('')
}

export function theoryAnswerToHtml(raw: string): string {
  const doc = decodeTheoryPlateAnswer(raw)
  if (doc) return slateNodesToHtml(doc)
  const escaped = raw.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return escaped ? `<p style="margin:0">${escaped}</p>` : ''
}
