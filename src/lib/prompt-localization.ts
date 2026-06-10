// ============================================================
// 93 — PROMPT LOCALIZATION
// 94 — VOICE LOCALIZATION
// 95 — SHARED LANGUAGE ENGINE
// ============================================================
// Adapta los prompts y la voz de María según el idioma objetivo.
// El motor es el mismo — solo cambia el contenido.
// ============================================================

import { LanguageCode, getLanguageConfig, getLanguageRatio } from './language-config'

// ── 93 — PROMPT LOCALIZATION ──
// Genera el system prompt correcto según el idioma que enseña María
export function buildLanguagePrompt(
  langCode: LanguageCode,
  studentLevel: string,
  studentName: string
): string {
  const config = getLanguageConfig(langCode)
  const ratio = getLanguageRatio(langCode, studentLevel)

  const languageInstructions: Record<LanguageCode, string> = {
    en: `
You are teaching ENGLISH to Spanish-speaking Latin American students.
Tutor name: María
Language ratio at ${studentLevel}: ${ratio}
- Explain grammar rules in Spanish
- Model all examples in English
- Correct pronunciation based on common Spanish-speaker mistakes
- Use Latin American context (Costa Rica, names, food, places)
`,
    pt: `
Estás enseñando PORTUGUÉS a estudiantes latinoamericanos hispanohablantes.
Nombre de la tutora: Ana
Ratio de idioma en ${studentLevel}: ${ratio}
- Explicá las reglas gramaticales en español
- Mostrá todos los ejemplos en portugués
- Corregí pronunciación según errores típicos de hispanohablantes aprendiendo portugués
- Usá contexto latinoamericano cuando sea posible
`,
    fr: `
Estás enseñando FRANCÉS a estudiantes latinoamericanos hispanohablantes.
Nombre de la tutora: Sophie
Ratio de idioma en ${studentLevel}: ${ratio}
- Explicá las reglas gramaticales en español
- Mostrá todos los ejemplos en francés
- Corregí pronunciación según errores típicos de hispanohablantes aprendiendo francés
`,
    it: `
Estás enseñando ITALIANO a estudiantes latinoamericanos hispanohablantes.
Nombre de la tutora: Giulia
Ratio de idioma en ${studentLevel}: ${ratio}
- Explicá las reglas gramaticales en español
- Mostrá todos los ejemplos en italiano
`,
    ja: `
Estás enseñando JAPONÉS a estudiantes latinoamericanos hispanohablantes.
Nombre de la tutora: Yuki
Ratio de idioma en ${studentLevel}: ${ratio}
- Explicá todo en español por ahora
- Mostrá hiragana, katakana y kanji básicos con su pronunciación
`,
  }

  return `
IDIOMA QUE ENSEÑÁS: ${config.name} (${config.name_es})
TUTORA: ${config.tutor_name}
ESTUDIANTE: ${studentName}
NIVEL ACTUAL: ${studentLevel}

${languageInstructions[langCode] || languageInstructions['en']}
`
}

// ── 94 — VOICE LOCALIZATION ──
// Devuelve la configuración de voz correcta según el idioma
export type VoiceConfig = {
  voice: string           // voz de OpenAI TTS
  speed: number           // velocidad (0.5-2.0)
  language_hint: string   // código de idioma para el modelo
  whisper_language: string // código para Whisper transcription
}

export function getVoiceConfig(langCode: LanguageCode, studentLevel: string): VoiceConfig {
  const config = getLanguageConfig(langCode)

  // Velocidad adaptada al nivel: más lento en A1, normal en B2+
  const speedByLevel: Record<string, number> = {
    A1: 0.8,
    A2: 0.85,
    B1: 0.9,
    B2: 1.0,
    C1: 1.0,
    C2: 1.0,
  }

  return {
    voice: config.tts_voice,
    speed: speedByLevel[studentLevel] || 0.9,
    language_hint: config.code,
    whisper_language: config.whisper_model_language,
  }
}

// ── 95 — SHARED LANGUAGE ENGINE ──
// Motor central que determina qué idioma usar según el estudiante
export type LanguageSession = {
  language: LanguageCode
  tutor_name: string
  prompt_extension: string
  voice: VoiceConfig
  ratio: string
}

export function buildLanguageSession(
  langCode: LanguageCode,
  studentLevel: string,
  studentName: string
): LanguageSession {
  const config = getLanguageConfig(langCode)
  const voiceConfig = getVoiceConfig(langCode, studentLevel)
  const promptExtension = buildLanguagePrompt(langCode, studentLevel, studentName)

  return {
    language: langCode,
    tutor_name: config.tutor_name,
    prompt_extension: promptExtension,
    voice: voiceConfig,
    ratio: getLanguageRatio(langCode, studentLevel),
  }
}

// Evalúa speaking con contexto de idioma correcto
export function getSpeakingEvaluationLanguage(langCode: LanguageCode): string {
  const instructions: Record<LanguageCode, string> = {
    en: 'Evaluate English speaking. Focus on English pronunciation patterns for Spanish speakers.',
    pt: 'Evaluate Portuguese speaking (Brazilian). Focus on nasal sounds and vowel reduction.',
    fr: 'Evaluate French speaking. Focus on nasal vowels, liaison, and silent letters.',
    it: 'Evaluate Italian speaking. Similar to Spanish but focus on double consonants.',
    ja: 'Evaluate Japanese speaking. Focus on pitch accent and mora timing.',
  }
  return instructions[langCode] || instructions['en']
}
