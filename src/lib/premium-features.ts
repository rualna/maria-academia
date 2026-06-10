// ============================================================
// 156 — AI PRONUNCIATION COACH (avanzado)
// 157 — ADVANCED SPEAKING MODE
// 158 — EMOTIONAL VOICE SYNTHESIS
// 159 — AVATAR SYSTEM
// 160 — VOICE PERSONALITY SELECTION
// ============================================================

// ── 156 — AI PRONUNCIATION COACH ──
// Análisis fonético específico por sonido para hispanohablantes
export const PRONUNCIATION_DRILLS = {
  th_sound: {
    id: 'th_sound',
    name: 'El sonido TH',
    difficulty: 'A1',
    description: 'El sonido más difícil para hispanohablantes. Hay dos: sordo (think) y sonoro (this).',
    minimal_pairs: [
      { wrong: 'tree', right: 'three', note: 'tree = árbol, three = tres' },
      { wrong: 'sin', right: 'thin', note: 'sin = pecado, thin = delgado' },
      { wrong: 'dis', right: 'this', note: 'dis = (nada), this = este' },
      { wrong: 'day', right: 'they', note: 'day = día, they = ellos' },
    ],
    practice_sentences: [
      'Think about three things.',
      'This and that are both there.',
      'The weather is better together.',
    ],
    tip: 'Sacá la punta de la lengua entre los dientes y soplá. No es D ni S.',
  },
  b_vs_v: {
    id: 'b_vs_v',
    name: 'B vs V en inglés',
    difficulty: 'A1',
    description: 'En español B y V suenan igual. En inglés son diferentes.',
    minimal_pairs: [
      { wrong: 'berry', right: 'very', note: 'berry = fruta del bosque, very = muy' },
      { wrong: 'boat', right: 'vote', note: 'boat = bote, vote = votar' },
      { wrong: 'ban', right: 'van', note: 'ban = prohibir, van = camioneta' },
    ],
    practice_sentences: [
      'The very big van voted to leave.',
      'Vegetables are very good.',
    ],
    tip: 'La V inglesa: los dientes de arriba tocan el labio de abajo. Sentís una vibración.',
  },
  schwa: {
    id: 'schwa',
    name: 'El Schwa /ə/',
    difficulty: 'B1',
    description: 'El sonido más común del inglés. Las vocales no acentuadas se reducen a este sonido.',
    examples: [
      { word: 'about', phonetic: '/əˈbaʊt/', note: 'la A inicial suena como una "e" muy corta' },
      { word: 'banana', phonetic: '/bəˈnænə/', note: 'las A no acentuadas se reducen' },
      { word: 'the', phonetic: '/ðə/', note: '"the" antes de consonante suena /ðə/, no /ðiː/' },
    ],
    practice_sentences: [
      'About a banana and a sofa.',
      'The computer was a problem.',
    ],
    tip: 'Relajá la boca completamente. Es el sonido más neutro posible. "Uh".',
  },
}

// ── 157 — ADVANCED SPEAKING MODE ──
// Sesiones más largas y desafiantes para B1+
export const ADVANCED_SPEAKING_CONFIG = {
  B1: {
    min_duration_seconds: 120,  // 2 minutos mínimo por respuesta
    topics: [
      'Describe a challenge you overcame at work or school',
      'What would you change about your city and why?',
      'Talk about a person who influenced your life significantly',
      'Describe your ideal vacation and why you would choose it',
    ],
    evaluation_focus: ['coherence', 'vocabulary_range', 'grammar_accuracy', 'fluency'],
  },
  B2: {
    min_duration_seconds: 180,
    topics: [
      'Discuss the pros and cons of remote work',
      'How has technology changed the way we learn?',
      'What are the most important qualities of a good leader?',
      'Discuss the impact of social media on young people',
    ],
    evaluation_focus: ['argumentation', 'discourse_markers', 'idiomatic_expressions', 'pronunciation'],
  },
  C1: {
    min_duration_seconds: 300,
    topics: [
      'Analyze the role of AI in education — benefits and risks',
      'Discuss how globalization affects local cultures',
      'What economic policies should governments prioritize?',
      'How should companies balance profit with social responsibility?',
    ],
    evaluation_focus: ['critical_thinking', 'nuance', 'advanced_grammar', 'native_like_expressions'],
  },
}

// ── 158 — EMOTIONAL VOICE SYNTHESIS ──
// ElevenLabs — voz consistente y reconocible para María
export const VOICE_CONFIG = {
  provider: 'elevenlabs',
  status: 'pending_api_key',  // → agregar ELEVENLABS_API_KEY al .env
  maria_voice_id: null,        // → clonar voz de María una vez configurado
  settings: {
    stability: 0.75,           // consistencia de la voz
    similarity_boost: 0.85,    // similitud al original
    style: 0.3,                // expresividad
    use_speaker_boost: true,
  },
  emotions: {
    encouraging: { stability: 0.6, style: 0.5 },   // más expresiva al animar
    correcting:  { stability: 0.8, style: 0.2 },   // más seria al corregir
    celebrating: { stability: 0.5, style: 0.7 },   // más festiva al celebrar
    teaching:    { stability: 0.85, style: 0.15 },  // más clara al explicar
  },
  activation_note: 'Activar cuando haya primeros 50 estudiantes pagando — costo ~$20/mes',
}

// ── 159 — AVATAR SYSTEM ──
// HeyGen para evaluaciones trimestrales con video
export const AVATAR_CONFIG = {
  provider: 'heygen',
  status: 'pending_api_key',  // → agregar HEYGEN_API_KEY al .env
  maria_avatar_id: null,       // → crear avatar de María una vez configurado
  use_cases: [
    { trigger: 'quarterly_exam',     description: 'Evaluación trimestral cara a cara' },
    { trigger: 'graduation_exam',    description: 'Examen de graduación 15 meses' },
    { trigger: 'expopyme_demo',      description: 'Demo en eventos' },
    { trigger: 'milestone_video',    description: 'Video personalizado al completar un nivel' },
  ],
  cost_per_minute: 0.05,  // USD — solo para sesiones especiales
  activation_note: 'Plan Creator HeyGen: $29/mes. Activar para ExpoPyme julio 2026.',
}

// ── 160 — VOICE PERSONALITY SELECTION ──
// Futuro: el estudiante elige el acento/personalidad de su tutora
export const VOICE_PERSONALITIES = [
  { id: 'maria_default',   name: 'María',      accent: 'Neutral LATAM',  available: true  },
  { id: 'sarah_us',        name: 'Sarah',      accent: 'American',       available: false },
  { id: 'emily_uk',        name: 'Emily',      accent: 'British',        available: false },
  { id: 'james_au',        name: 'James',      accent: 'Australian',     available: false },
]

export function getAvailableVoices() {
  return VOICE_PERSONALITIES.filter(v => v.available)
}

export function getPremiumFeaturesStatus() {
  return {
    realtime_voice: { status: 'ready_to_activate', requires: 'OpenAI Realtime API — ya incluido en tu plan OpenAI' },
    elevenlabs_voice: { status: 'pending', requires: 'ELEVENLABS_API_KEY + $20/mes' },
    heygen_avatar: { status: 'pending', requires: 'HEYGEN_API_KEY + $29/mes Plan Creator' },
    roleplays: { status: 'active', requires: 'Ya funciona en modo texto' },
    simulations: { status: 'active', requires: 'Ya funciona en modo texto' },
    pronunciation_coach: { status: 'active', requires: 'Ya funciona' },
    advanced_speaking: { status: 'active', requires: 'Ya funciona' },
  }
}
