// ============================================================
// 38 — SKILL TREE
// Define qué lecciones son prerequisito de otras.
// Una lección no se desbloquea hasta que sus prerequisitos
// estén completados con score >= 80%.
// ============================================================

export type SkillNode = {
  id: string
  title: string
  week: number
  month: number
  level: string
  requires: string[]  // IDs de lecciones que deben estar completadas
  unlocks: string[]   // IDs de lecciones que esto desbloquea
}

export const SKILL_TREE: SkillNode[] = [
  // ── SEMANA 1 — sin prerequisitos, son las primeras ──
  {
    id: 'a1-m1-w1-l1', title: "What's your name", week: 1, month: 1, level: 'A1',
    requires: [],
    unlocks: ['a1-m1-w1-l2'],
  },
  {
    id: 'a1-m1-w1-l2', title: 'Greetings and goodbyes', week: 1, month: 1, level: 'A1',
    requires: ['a1-m1-w1-l1'],
    unlocks: ['a1-m1-w1-l3'],
  },
  {
    id: 'a1-m1-w1-l3', title: 'Alphabet and spelling', week: 1, month: 1, level: 'A1',
    requires: ['a1-m1-w1-l2'],
    unlocks: ['a1-m1-w1-l4'],
  },
  {
    id: 'a1-m1-w1-l4', title: 'Numbers 0 to 10', week: 1, month: 1, level: 'A1',
    requires: ['a1-m1-w1-l3'],
    unlocks: ['a1-m1-w2-l5'],
  },

  // ── SEMANA 2 — requiere semana 1 completa ──
  {
    id: 'a1-m1-w2-l5', title: 'Classroom objects', week: 2, month: 1, level: 'A1',
    requires: ['a1-m1-w1-l4'],
    unlocks: ['a1-m1-w2-l6'],
  },
  {
    id: 'a1-m1-w2-l6', title: 'This That These Those', week: 2, month: 1, level: 'A1',
    requires: ['a1-m1-w2-l5'],
    unlocks: ['a1-m1-w2-l7'],
  },
  {
    id: 'a1-m1-w2-l7', title: 'Plurals', week: 2, month: 1, level: 'A1',
    requires: ['a1-m1-w2-l6'],
    unlocks: ['a1-m1-w2-l8'],
  },
  {
    id: 'a1-m1-w2-l8', title: 'Countries and nationalities', week: 2, month: 1, level: 'A1',
    requires: ['a1-m1-w2-l7'],
    unlocks: ['a1-m1-w2-l9'],
  },
  {
    id: 'a1-m1-w2-l9', title: 'Ages', week: 2, month: 1, level: 'A1',
    requires: ['a1-m1-w2-l8'],
    unlocks: ['a1-m1-w3-l10'],
  },

  // ── SEMANA 3 — requiere semana 2 completa ──
  {
    id: 'a1-m1-w3-l10', title: 'Time and clock', week: 3, month: 1, level: 'A1',
    requires: ['a1-m1-w2-l9'],
    unlocks: ['a1-m1-w3-l11'],
  },
  {
    id: 'a1-m1-w3-l11', title: 'Daily routines', week: 3, month: 1, level: 'A1',
    requires: ['a1-m1-w3-l10'],
    unlocks: ['a1-m1-w3-l12'],
  },
  {
    id: 'a1-m1-w3-l12', title: 'Transportation', week: 3, month: 1, level: 'A1',
    requires: ['a1-m1-w3-l11'],
    unlocks: ['a1-m1-w3-l13'],
  },
  {
    id: 'a1-m1-w3-l13', title: 'Jobs and occupations', week: 3, month: 1, level: 'A1',
    requires: ['a1-m1-w3-l12'],
    unlocks: ['a1-m1-w3-l14'],
  },
  {
    id: 'a1-m1-w3-l14', title: 'Food basics', week: 3, month: 1, level: 'A1',
    requires: ['a1-m1-w3-l13'],
    unlocks: ['a1-m1-w3-l15'],
  },
  {
    id: 'a1-m1-w3-l15', title: 'Sports and abilities', week: 3, month: 1, level: 'A1',
    requires: ['a1-m1-w3-l14'],
    unlocks: ['a1-m1-w4-l16'],
  },

  // ── SEMANA 4 — requiere semana 3 completa ──
  {
    id: 'a1-m1-w4-l16', title: 'Going to future plans', week: 4, month: 1, level: 'A1',
    requires: ['a1-m1-w3-l15'],
    unlocks: ['a1-m1-w4-l17'],
  },
  {
    id: 'a1-m1-w4-l17', title: 'Invitations', week: 4, month: 1, level: 'A1',
    requires: ['a1-m1-w4-l16'],
    unlocks: ['a1-m1-w4-l18'],
  },
  {
    id: 'a1-m1-w4-l18', title: 'Body and health', week: 4, month: 1, level: 'A1',
    requires: ['a1-m1-w4-l17'],
    unlocks: ['a1-m1-w4-l19'],
  },
  {
    id: 'a1-m1-w4-l19', title: 'Places and prepositions', week: 4, month: 1, level: 'A1',
    requires: ['a1-m1-w4-l18'],
    unlocks: ['a1-m1-w4-l20'],
  },
  {
    id: 'a1-m1-w4-l20', title: 'Directions', week: 4, month: 1, level: 'A1',
    requires: ['a1-m1-w4-l19'],
    unlocks: [], // última del mes 1 — desbloquea examen mensual
  },
]

// ============================================================
// FUNCIONES DEL SKILL TREE
// ============================================================

// Dado un set de lecciones completadas, devuelve cuáles están desbloqueadas
export function getUnlockedLessons(completedIds: string[]): string[] {
  return SKILL_TREE
    .filter(node => node.requires.every(req => completedIds.includes(req)))
    .map(node => node.id)
}

// Verifica si una lección específica está desbloqueada
export function isLessonUnlocked(lessonId: string, completedIds: string[]): boolean {
  const node = SKILL_TREE.find(n => n.id === lessonId)
  if (!node) return false
  return node.requires.every(req => completedIds.includes(req))
}

// Devuelve el árbol completo con estado para un estudiante
export function getSkillTreeStatus(completedIds: string[]) {
  return SKILL_TREE.map(node => ({
    ...node,
    completed: completedIds.includes(node.id),
    unlocked: isLessonUnlocked(node.id, completedIds),
    locked: !isLessonUnlocked(node.id, completedIds),
  }))
}

// Verifica si el mes 1 está completo (todas las lecciones completadas)
export function isMonth1Complete(completedIds: string[]): boolean {
  const month1Lessons = SKILL_TREE.filter(n => n.month === 1).map(n => n.id)
  return month1Lessons.every(id => completedIds.includes(id))
}
