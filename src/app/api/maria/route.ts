import OpenAI from 'openai'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { MARIA_KNOWLEDGE } from '@/lib/maria-knowledge'
import { buildMariaContext } from '@/lib/maria-context'
import { analyzeRetention } from '@/lib/retention-engine'
import { getToneForStudent } from '@/lib/student-profiles'
import { buildLanguageSession } from '@/lib/prompt-localization'
import type { LanguageCode } from '@/lib/language-config'
import { buildMemorySummary } from '@/lib/ai-memory'
import { callWithFallback } from '@/lib/ai-orchestrator'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { awardRewards } from '@/lib/rewards'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Construye el bloque de adaptaciones para el prompt — NUNCA revela el perfil al estudiante
function buildLearningAdaptationsPrompt(adaptations: any): string {
  if (!adaptations || !adaptations.any_profile_active) {
    return 'Sin adaptaciones activas — comportamiento estándar.'
  }

  const lines: string[] = []

  if (adaptations.reading_support_mode) {
    lines.push('- Prioriza SIEMPRE explicaciones orales sobre escritas. Usa ejemplos hablados, no textos largos.')
    lines.push('- Da instrucciones cortas y una a la vez. Confirma comprensión antes de seguir.')
    lines.push(`- Tiempo de respuesta extendido (×${adaptations.time_multiplier}). No presiones por velocidad.`)
    lines.push('- Ofrece repetir en lugar de pedir que lea de nuevo.')
  }

  if (adaptations.short_session_mode) {
    lines.push(`- Ejercicios MÁXIMO ${adaptations.max_exercise_length} pasos. Divide las actividades en bloques pequeños.`)
    lines.push('- Celebra cada mini-logro inmediatamente. No acumules feedback para el final.')
    lines.push('- Si detectas desconcentración (respuestas cortas o sin sentido), sugiere una pausa corta y regresa al tema.')
    lines.push('- Mantén el ritmo dinámico — varía el tipo de actividad cada 2-3 intercambios.')
  }

  if (adaptations.audio_support_mode) {
    lines.push(`- Velocidad de audio recomendada: ${adaptations.default_audio_speed}x. Sugiere escuchar despacio.`)
    if (adaptations.show_transcript_option) {
      lines.push('- Puedes ofrecer mostrar el texto de lo que escuchó como apoyo, si el estudiante lo pide.')
    }
    lines.push('- Para ejercicios de listening: repite el audio antes de pedir la respuesta. No penalices si necesita escuchar dos veces.')
    lines.push('- Prioriza actividades de speaking sobre writing cuando puedas elegir.')
  }

  if (adaptations.low_stakes_speaking_mode) {
    lines.push('- NUNCA empieces con presión de speaking. Introduce el tema con chat primero.')
    if (adaptations.first_attempt_no_score) {
      lines.push('- En el PRIMER intento de speaking de la sesión: NO des score. Solo feedback positivo y el modelo correcto.')
    }
    if (!adaptations.show_numeric_score) {
      lines.push('- NO menciones números de score en esta sesión. Describe el progreso en palabras: "muy bien", "casi", "dale otra vez".')
    }
    lines.push('- Si el estudiante evita el speaking, no lo fuerces. Invítalo gentilmente: "¿Querés intentar decirlo vos?"')
    lines.push('- Celebra CUALQUIER intento de speaking, sin importar el resultado. El acto de intentar es el logro.')
  }

  if (lines.length === 0) return 'Sin adaptaciones activas — comportamiento estándar.'

  return lines.join('\n')
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorized()
    const student_id = user.id

    const { message } = await request.json()
    if (!message) {
      return Response.json({ success: false, error: 'message required' }, { status: 400 })
    }

    // Construir contexto completo del estudiante
    const ctx = await buildMariaContext(student_id)
    const retention = await analyzeRetention(student_id)
    const tone = getToneForStudent(retention.maria_tone)

    // 95 — Shared language engine: detectar idioma del estudiante
    const langCode: LanguageCode = (ctx as any).current_language || 'en'
    const langSession = buildLanguageSession(langCode, ctx.current_level, ctx.student_name)

    // 113/114 — AI Memory: recuperar memorias del estudiante
    const memorySummary = await buildMemorySummary(student_id)

    const systemPrompt = `
${MARIA_KNOWLEDGE}

# MEMORIA DEL ESTUDIANTE (113-114 AI Memory)
${memorySummary}


# CONFIGURACIÓN DE IDIOMA (Bloque 4 — Language OS)
${langSession.prompt_extension}


---

# CONTEXTO DEL ESTUDIANTE EN ESTA SESIÓN

Nombre: ${ctx.student_name}
Nivel: ${ctx.current_level} (${ctx.current_sublevel})
Semana actual: Semana ${ctx.current_week} de 4
Mes: ${ctx.current_month}
Idioma en esta etapa: ${ctx.maria_language_ratio}

Progreso:
- XP acumulado: ${ctx.xp}
- Chokis: ${ctx.chokis}
- Racha: ${ctx.streak_days} días
- Score promedio de speaking: ${ctx.speaking_score_avg}/10
- Lecciones completadas: ${ctx.lessons_completed.length > 0 ? ctx.lessons_completed.join(', ') : 'Ninguna aún'}

Temas débiles detectados: ${ctx.weak_topics.length > 0 ? ctx.weak_topics.join(', ') : 'Ninguno detectado aún'}
Lecciones que necesitan repaso URGENTE hoy: ${ctx.urgent_review?.length > 0 ? ctx.urgent_review.join(', ') : 'Ninguna'}

# ADAPTACIONES DE APRENDIZAJE (NUNCA mencionar al estudiante — actuar en silencio)
${buildLearningAdaptationsPrompt(ctx.learning_adaptations)}

# ESTADO EMOCIONAL Y TONO (Bloque 3 — Retention)
Estado motivacional: ${retention.status}
Nivel de frustración: ${retention.frustration_level}/100
Riesgo de abandono: ${retention.dropout_risk}/100
Tono que debe usar María HOY: ${retention.maria_tone}
Saludo sugerido: "${tone.greeting}"
Prefijo de corrección: "${tone.correction_prefix}"
Cierre de sesión: "${tone.session_close}"

Actividad reciente:
${ctx.recent_activity.length > 0 ? ctx.recent_activity.join('\n') : 'Sin actividad reciente'}

---

# RESTRICCIÓN TEMÁTICA — MUY IMPORTANTE

El estudiante está en la Semana ${ctx.current_week}.
Solo podés hablar, corregir y enseñar estos temas:
${ctx.available_topics.map(t => `- ${t}`).join('\n')}

Si el estudiante pregunta algo que NO está en esta lista:
→ Respondé: "Eso lo vemos más adelante. Por ahora practiquemos lo de esta semana. ¿Querés que practiquemos [tema de la semana actual]?"

---

# REGLAS DE COMPORTAMIENTO EN EL CHAT

1. NO adelantás temas futuros aunque el estudiante insista.
2. NO respondés sobre otros idiomas (chino, italiano, francés, etc.). Solo inglés.
3. NO respondés preguntas que no sean sobre el aprendizaje del inglés. Si preguntan otra cosa → redirigís amablemente.
4. SÍ podés hablar en español para explicar, pero modelás las frases en inglés.
5. SÍ corregís errores con amabilidad, nunca con dureza.
6. SÍ terminás SIEMPRE con una mini-práctica o pregunta para mantener activo al estudiante.
7. Si detectás un tema débil → lo reforzás antes de avanzar.
8. Tus respuestas son cortas: máximo 3-4 párrafos. Nunca monólogos largos.
`

    // 116/117/119/120 — AI Orchestrator: routing + caching + fallback
    const { content: reply, model_used } = await callWithFallback({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      task: 'chat',
      student_id,
    })

    // Guardar evento
    await supabase.from('student_events').insert([{
      student_id,
      event_type: 'ai_response',
      level: ctx.current_level,
      module_name: 'Maria Chat',
      lesson_id: null,
      skill: 'chat',
      score: null,
      event_data: {
        user_message: message,
        ai_response: reply,
        week: ctx.current_week,
        month: ctx.current_month,
      },
    }])

    // Otorgar XP por chatear (responsabilidad → migaja, con tope diario anti-farm)
    const rewards = await awardRewards(student_id, 'chat')

    return Response.json({ success: true, reply, rewards })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
