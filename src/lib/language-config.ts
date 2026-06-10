// ============================================================
// 91 — MULTI-LANGUAGE ARCHITECTURE
// 92 — LANGUAGE ABSTRACTION LAYER
// 100 — LANGUAGE CONFIGURATION SYSTEM
// 101-105 — LANGUAGE SUPPORT (English, Portuguese, French, Italian, Japanese)
// ============================================================
// Regla de negocio: Solo inglés activo.
// Francés o Portugués se activan cuando:
// → 100 estudiantes activos, O
// → Primeros estudiantes llegan a B1 en inglés
// ============================================================

export type LanguageCode = 'en' | 'pt' | 'fr' | 'it' | 'ja'

export type LanguageConfig = {
  code: LanguageCode
  name: string
  name_es: string           // nombre en español
  active: boolean           // si está disponible para estudiantes
  tutor_name: string        // nombre de la tutora IA para este idioma
  levels: string[]          // niveles CEFR del programa
  maria_language_ratio: Record<string, string>  // ratio español/idioma por nivel
  whisper_model_language: string  // código para Whisper
  tts_voice: string         // voz para TTS (OpenAI)
  unlock_trigger: string    // cuándo se desbloquea este idioma
  flag: string
  color: string             // color de marca del idioma
}

// ============================================================
// CONFIGURACIÓN DE TODOS LOS IDIOMAS
// ============================================================
export const LANGUAGE_CONFIGS: Record<LanguageCode, LanguageConfig> = {

  // 101 — ENGLISH (activo ahora)
  en: {
    code: 'en',
    name: 'English',
    name_es: 'Inglés',
    active: true,
    tutor_name: 'María',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    maria_language_ratio: {
      A1: '85% español / 15% inglés',
      A2: '70% español / 30% inglés',
      B1: '50% español / 50% inglés',
      B2: '25% español / 75% inglés',
      C1: '5% español / 95% inglés',
      C2: '0% español / 100% inglés',
    },
    whisper_model_language: 'en',
    tts_voice: 'nova',
    unlock_trigger: 'default_active',
    flag: '🇺🇸',
    color: '#10B981',
  },

  // 102 — PORTUGUESE (próximo — trigger: 100 estudiantes o primeros B1)
  pt: {
    code: 'pt',
    name: 'Português',
    name_es: 'Portugués',
    active: false,
    tutor_name: 'Ana',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    maria_language_ratio: {
      A1: '85% español / 15% portugués',
      A2: '65% español / 35% portugués',
      B1: '40% español / 60% portugués',
      B2: '15% español / 85% portugués',
      C1: '0% español / 100% portugués',
    },
    whisper_model_language: 'pt',
    tts_voice: 'shimmer',
    unlock_trigger: '100_students_or_first_B1_english',
    flag: '🇧🇷',
    color: '#3B82F6',
  },

  // 103 — FRENCH
  fr: {
    code: 'fr',
    name: 'Français',
    name_es: 'Francés',
    active: false,
    tutor_name: 'Sophie',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    maria_language_ratio: {
      A1: '85% español / 15% francés',
      A2: '65% español / 35% francés',
      B1: '40% español / 60% francés',
      B2: '15% español / 85% francés',
      C1: '0% español / 100% francés',
    },
    whisper_model_language: 'fr',
    tts_voice: 'alloy',
    unlock_trigger: 'after_portuguese_launch',
    flag: '🇫🇷',
    color: '#8B5CF6',
  },

  // 104 — ITALIAN
  it: {
    code: 'it',
    name: 'Italiano',
    name_es: 'Italiano',
    active: false,
    tutor_name: 'Giulia',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    maria_language_ratio: {
      A1: '85% español / 15% italiano',
      A2: '65% español / 35% italiano',
      B1: '40% español / 60% italiano',
      B2: '15% español / 85% italiano',
      C1: '0% español / 100% italiano',
    },
    whisper_model_language: 'it',
    tts_voice: 'echo',
    unlock_trigger: 'future',
    flag: '🇮🇹',
    color: '#EF4444',
  },

  // 105 — JAPANESE
  ja: {
    code: 'ja',
    name: '日本語',
    name_es: 'Japonés',
    active: false,
    tutor_name: 'Yuki',
    levels: ['N5', 'N4', 'N3', 'N2', 'N1'],
    maria_language_ratio: {
      N5: '90% español / 10% japonés',
      N4: '70% español / 30% japonés',
      N3: '50% español / 50% japonés',
      N2: '20% español / 80% japonés',
      N1: '0% español / 100% japonés',
    },
    whisper_model_language: 'ja',
    tts_voice: 'fable',
    unlock_trigger: 'future',
    flag: '🇯🇵',
    color: '#F59E0B',
  },
}

// ============================================================
// FUNCIONES DE ACCESO
// ============================================================

// Idiomas activos para nuevos estudiantes
export function getActiveLanguages(): LanguageConfig[] {
  return Object.values(LANGUAGE_CONFIGS).filter(l => l.active)
}

// Config de un idioma específico
export function getLanguageConfig(code: LanguageCode): LanguageConfig {
  return LANGUAGE_CONFIGS[code] || LANGUAGE_CONFIGS['en']
}

// Ratio de idioma según nivel del estudiante
export function getLanguageRatio(langCode: LanguageCode, level: string): string {
  const config = getLanguageConfig(langCode)
  return config.maria_language_ratio[level] || config.maria_language_ratio['A1']
}

// Verificar si un idioma está disponible
export function isLanguageActive(code: LanguageCode): boolean {
  return LANGUAGE_CONFIGS[code]?.active || false
}

// El idioma que viene después del inglés según las reglas de negocio
export function getNextLanguage(): LanguageCode {
  const priority: LanguageCode[] = ['pt', 'fr', 'it', 'ja']
  return priority.find(l => !LANGUAGE_CONFIGS[l].active) || 'pt'
}
