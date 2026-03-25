/**
 * Parse how many objective vs theory questions the user asked for in natural language.
 * Examples: "40 obj and 8 theory", "40 objective, 8 written questions"
 */
export type ExtractedQuestionCounts = {
  objectiveCount: number | null
  theoryCount: number | null
}

export function clampQuestionCount(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

export function extractQuestionCountsFromPrompt(content: string): ExtractedQuestionCounts {
  let objectiveCount: number | null = null
  let theoryCount: number | null = null
  const t = content.trim()

  const pairObjFirst = t.match(
    /(\d+)\s*(?:obj|objectives?|mcq|m\.?\s*c\.?\s*q\.?s?|multiple[\s-]*choice)(?:\s+questions?)?\s*(?:,|\band\b|&|\+|\/)\s*(\d+)\s*(?:theory|theories|written|essay|long(?:[\s-]*(?:form|answer))?)(?:\s+questions?)?/i
  )
  if (pairObjFirst) {
    objectiveCount = parseInt(pairObjFirst[1], 10)
    theoryCount = parseInt(pairObjFirst[2], 10)
    return { objectiveCount, theoryCount }
  }

  const pairTheoryFirst = t.match(
    /(\d+)\s*(?:theory|theories|written|essay|long(?:[\s-]*(?:form|answer))?)(?:\s+questions?)?\s*(?:,|\band\b|&|\+|\/)\s*(\d+)\s*(?:obj|objectives?|mcq|m\.?\s*c\.?\s*q\.?s?|multiple[\s-]*choice)(?:\s+questions?)?/i
  )
  if (pairTheoryFirst) {
    theoryCount = parseInt(pairTheoryFirst[1], 10)
    objectiveCount = parseInt(pairTheoryFirst[2], 10)
    return { objectiveCount, theoryCount }
  }

  const theoryMatch = t.match(
    /(\d+)\s*(?:theory|theories|written|essay|long(?:[\s-]*(?:form|answer))?)(?:\s+questions?)?\b/i
  )
  if (theoryMatch) theoryCount = parseInt(theoryMatch[1], 10)

  const objMatch = t.match(
    /(\d+)\s*(?:obj|objectives?|mcq|m\.?\s*c\.?\s*q\.?s?|multiple[\s-]*choice)(?:\s+questions?)?\b/i
  )
  if (objMatch) objectiveCount = parseInt(objMatch[1], 10)

  if (objectiveCount === null && theoryCount === null) {
    const generic = t.match(/\b(?:generate|create|make)\s+(\d+)\s+questions?\b/i)
    if (generic) objectiveCount = parseInt(generic[1], 10)
  }

  return { objectiveCount, theoryCount }
}

/** Defaults for mixed generation when the user does not specify counts. */
export function resolveCountsForMixed(e: ExtractedQuestionCounts): {
  objective: number
  theory: number
} {
  if (e.objectiveCount !== null && e.theoryCount !== null) {
    return {
      objective: clampQuestionCount(e.objectiveCount, 1, 80),
      theory: clampQuestionCount(e.theoryCount, 0, 25),
    }
  }
  if (e.objectiveCount !== null) {
    return {
      objective: clampQuestionCount(e.objectiveCount, 1, 80),
      theory: 0,
    }
  }
  if (e.theoryCount !== null) {
    return {
      objective: 0,
      theory: clampQuestionCount(e.theoryCount, 1, 25),
    }
  }
  return { objective: 10, theory: 0 }
}
