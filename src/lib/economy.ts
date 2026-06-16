// ============================================================
// ECONOMÍA DE ACADEMIA — fuente única de verdad de XP y Chokis.
// ------------------------------------------------------------
// XP    = avance (solo sube, nunca se gasta).
// Chokis = moneda (se gana y se gasta). 3 tipos:
//   - Hábito  (responsabilidad) → migajas
//   - Logro   (mérito)          → paga bien
//   - Negocio (aporte)          → paga muy bien   [no cableado hoy: referidos a futuro]
//
// Regla de oro: tacaño con lo obligatorio, generoso con el mérito.
//
// ⚠️ NÚMEROS PROVISIONALES — se calibran en el piloto.
//    Para recalibrar, se toca SOLO este archivo.
// ============================================================

export const ECONOMY = {
  xp: {
    chat_message: 2,       // chatear es responsabilidad → migaja
    speaking_attempt: 10,  // hizo su práctica
    good_bonus: 10,        // + si score >= good (mérito)
    great_bonus: 20,       // + si score >= great (mérito alto)
  },
  chokis: {
    speaking_habito: 1,    // Hábito: migaja por completar la práctica
    good_logro: 5,         // Logro: mérito → paga bien
    great_logro: 10,       // Logro: mérito alto → paga muy bien
  },
  // Umbrales de score (sobre 10, como devuelve /api/speaking-feedback)
  scoreThresholds: { good: 7, great: 9 },
  // Topes diarios anti-farm (por estudiante, por fuente)
  dailyCaps: {
    chat_xp: 20,          // máx XP/día por chatear (~10 mensajes premiados)
    speaking_awards: 8,   // máx prácticas premiadas/día
  },
} as const

export type RewardSource = 'chat' | 'speaking'
