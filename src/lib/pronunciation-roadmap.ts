// ============================================================
// 41 — PRONUNCIATION ROADMAP
// Qué sonidos trabaja el estudiante en cada nivel.
// Hispanohablantes tienen dificultades específicas con el inglés
// que varían según el nivel. María las conoce y las prioriza.
// ============================================================

export type PronunciationFocus = {
  level: string
  title: string
  target_sounds: string[]
  common_errors: string[]     // errores típicos de hispanohablantes
  maria_instructions: string  // cómo María evalúa en este nivel
  tolerance: 'high' | 'medium' | 'low'  // qué tan exigente es María
}

export const PRONUNCIATION_ROADMAP: PronunciationFocus[] = [
  {
    level: 'A1',
    title: 'Sonidos básicos — supervivencia fonética',
    target_sounds: [
      'Vocales cortas: /ɪ/ (sit), /ʊ/ (book)',
      'Consonantes críticas: /b/ vs /v/ (boat vs vote)',
      'Th sordo: /θ/ (think, three, thanks)',
      'Final de palabras: -s, -ed, -ng',
      'Acento en sílaba correcta: HEllo, toGEther',
    ],
    common_errors: [
      'Decir "si" en vez de "see" — vocal larga /iː/',
      'Confundir /b/ y /v/: "berry" suena como "very"',
      'Ignorar la /h/: "hello" sin la h aspirada',
      'Pronunciar la /e/ de "the" como "de" en español',
      'Omitir la /s/ final en plurales y tercera persona',
    ],
    maria_instructions: `
En A1 evaluá pronunciación con tolerancia ALTA.
Solo señalá errores que impidan la comprensión.
Enfocate en: /b/ vs /v/, th básico, y la /h/ aspirada.
NO corrijas acento ni entonación todavía.
Si el mensaje se entiende → pronunciación aceptable.
Frase para practicar: "Three big vans" (trabaja th + b/v).
`,
    tolerance: 'high',
  },
  {
    level: 'A2',
    title: 'Claridad — que te entiendan siempre',
    target_sounds: [
      'Th sonoro: /ð/ (this, that, the, they)',
      'Diferencia /iː/ vs /ɪ/: sheep vs ship',
      'Diferencia /æ/ vs /ɑː/: cat vs cart',
      'Consonante /r/ inglesa (no vibrante como español)',
      'Linking words: "an apple" suena "anapple"',
    ],
    common_errors: [
      'Th sonoro /ð/: decir "dis" en vez de "this"',
      'Ship/sheep: confundir /ɪ/ y /iː/',
      'Pronunciar /r/ como en español (vibrante)',
      'No hacer linking entre palabras',
      'Decir "yob" en vez de "job" — /dʒ/ vs /j/',
    ],
    maria_instructions: `
En A2 evaluá con tolerancia MEDIA.
Corregí th sonoro/sordo y la diferencia i/ee.
Modelá el linking: "I am" → "I'm", "an apple" → "anapple".
Podés nombrar el error: "Dijiste 'dis', la forma correcta es 'this' con th."
Pide repetición 2 veces antes de avanzar.
`,
    tolerance: 'medium',
  },
  {
    level: 'B1',
    title: 'Fluidez fonética — ritmo y entonación',
    target_sounds: [
      'Schwa /ə/: el sonido más común del inglés (about, banana)',
      'Consonantes difíciles: /w/ vs /v/, /dʒ/ (job, jump)',
      'Stress patterns en palabras largas: phoTOgraphy vs PHOtograph',
      'Entonación en preguntas yes/no vs wh-questions',
      'Reducción de palabras: "want to" → "wanna", "going to" → "gonna"',
    ],
    common_errors: [
      'Pronunciar todas las sílabas con igual fuerza (español es isosílabo)',
      'No reducir "a, the, of" — suenan completas cuando deberían ser schwa',
      'Entonación plana — sin curva melódica natural',
      'Pronunciar /w/ como /b/: "wine" suena "bine"',
      'No usar contracciones al hablar: "I am" en vez de "I\'m"',
    ],
    maria_instructions: `
En B1 evaluá con tolerancia BAJA para errores básicos, MEDIA para avanzados.
Corregí stress patterns y schwa.
Modelá la reducción natural: "I'm going to" → "I'm gonna".
Trabajá la curva de entonación en preguntas.
Ejercicio: shadowing — el estudiante repite inmediatamente después de escuchar.
`,
    tolerance: 'medium',
  },
  {
    level: 'B2',
    title: 'Naturalidad — sonar real',
    target_sounds: [
      'Acento tónico en frases (sentence stress): "I LOVE coffee" vs "I love COFFEE"',
      'Consonantes finales: nunca omitirlas',
      'Assimilation: "good boy" → "goob boy"',
      'Elision: "last night" → "las night"',
      'Intonation patterns: rise-fall para afirmaciones, rise para yes/no',
    ],
    common_errors: [
      'Omitir consonantes finales: "tes" en vez de "test"',
      'Stress incorrecto en compound nouns: "BLACKbird" vs "black BIRD"',
      'Entonación interrogativa incorrecta',
      'No usar assimilation natural',
      'Ritmo irregular — pauses en lugares incorrectos',
    ],
    maria_instructions: `
En B2 evaluá con tolerancia BAJA.
Señalá errores de stress, elision y assimilation.
El objetivo es sonar natural, no perfecto.
Compará con un hablante nativo cuando sea necesario.
Ejercicio: leer en voz alta y analizar cada línea con María.
`,
    tolerance: 'low',
  },
  {
    level: 'C1',
    title: 'Dominio — precisión y confianza',
    target_sounds: [
      'Acento propio claro y consistente — no necesita nativo, sí comprensible',
      'Pragmatic intonation: sarcasmo, énfasis, duda, entusiasmo',
      'Connected speech: todos los fenómenos de habla natural',
      'Registro formal vs informal en pronunciación',
      'Pronunciación de cognados falsos: "actually", "eventually"',
    ],
    common_errors: [
      'Pronunciar cognados como en español: "actually" con acento en "al"',
      'Entonación plana en discurso largo — falta de expresividad',
      'No adaptar pronunciación al registro (formal vs casual)',
      'Pausas en lugares no naturales del discurso',
    ],
    maria_instructions: `
En C1 evaluá con tolerancia MÍNIMA para errores básicos.
El foco es expresividad, registro y confianza.
No corrijas acento — corregí imprecisiones que afecten la comunicación.
Evaluá si el estudiante puede mantener claridad bajo presión (hablar rápido, improvisar).
`,
    tolerance: 'low',
  },
]

// ============================================================
// FUNCIONES DE ACCESO
// ============================================================

export function getPronunciationFocus(level: string): PronunciationFocus | null {
  return PRONUNCIATION_ROADMAP.find(p => p.level === level) || null
}

export function getPronunciationInstructions(level: string): string {
  const focus = getPronunciationFocus(level)
  if (!focus) return 'Evalúa pronunciación con tolerancia media.'
  return focus.maria_instructions
}

export function getCommonErrors(level: string): string[] {
  const focus = getPronunciationFocus(level)
  return focus?.common_errors || []
}

export function getTargetSounds(level: string): string[] {
  const focus = getPronunciationFocus(level)
  return focus?.target_sounds || []
}
