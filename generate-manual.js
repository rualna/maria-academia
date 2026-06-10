const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, Header, Footer, PageNumber, TabStopType, TabStopPosition,
  LevelFormat
} = require('docx');
const fs = require('fs');

const BRAND = '#1B4F72';
const ACCENT = '#10B981';
const LIGHT = '#EAF4FB';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    children: [new TextRun({ text, bold: true, size: 36, color: BRAND, font: 'Arial' })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: BRAND, font: 'Arial' })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: '2C3E50', font: 'Arial' })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, font: 'Arial', ...opts })]
  });
}

function bold(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Arial' })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: 'Arial' })]
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: 'Arial' })]
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun('')], spacing: { before: 120 } });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 1 } },
    spacing: { before: 160, after: 160 },
    children: [new TextRun('')]
  });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: '1B4F72', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })] })]
        }))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? 'FFFFFF' : 'F4F6F7', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: 'Arial' })] })]
        }))
      }))
    ]
  });
}

const children = [

  // ── PORTADA ──
  new Paragraph({ spacing: { before: 2000 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CONFIDENCIAL', bold: true, size: 20, color: 'CC0000', font: 'Arial' })] }),
  new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MANUAL TÉCNICO Y DE NEGOCIO', bold: true, size: 52, color: BRAND, font: 'Arial' })] }),
  new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'MARÍA — ACADEM-IA', bold: true, size: 44, color: ACCENT, font: 'Arial' })] }),
  new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sistema de Inteligencia Artificial para la Enseñanza de Idiomas', size: 26, italics: true, color: '555555', font: 'Arial' })] }),
  spacer(), spacer(),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Versión 1.0  |  Junio 2026', size: 22, color: '888888', font: 'Arial' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Preparado por: Equipo de Desarrollo AcademIA', size: 22, color: '888888', font: 'Arial' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Documento de uso corporativo, confidencial y reservado', size: 22, color: '888888', font: 'Arial' })] }),

  // ── 1. RESUMEN EJECUTIVO ──
  h1('1. Resumen Ejecutivo'),
  h2('1.1 ¿Qué es AcademIA?'),
  p('AcademIA es una plataforma digital de aprendizaje de idiomas impulsada por inteligencia artificial, diseñada específicamente para el mercado latinoamericano. Su propuesta central es ofrecer la experiencia de aprendizaje más efectiva, accesible y personalizada del mercado, combinando lo mejor de tres modelos educativos reconocidos mundialmente:'),
  bullet('Duolingo: gamificación avanzada con XP, rachas diarias, Chokis (moneda virtual), badges y un personaje de acompañamiento emocional (Choco).'),
  bullet('Open English: tutoría virtual en tiempo real con retroalimentación inmediata de un tutor IA.'),
  bullet('Academia formal: progresión estructurada y certificada por niveles CEFR (A1→C1), con objetivos medibles y exámenes de avance reales.'),
  spacer(),
  p('El núcleo diferenciador de AcademIA es María, la Tutor-IA. María no es un chatbot genérico; es un sistema de IA pedagógica especializado que sabe exactamente qué ha estudiado cada estudiante, en qué semana va, cuáles son sus debilidades, qué hora del día rinde mejor y cómo motivarlo para que no abandone. María habla, escucha, evalúa, corrige y acompaña a cada estudiante a lo largo de su recorrido completo.'),

  h2('1.2 Propuesta de Valor Única'),
  makeTable(
    ['Atributo', 'AcademIA', 'Duolingo', 'Open English'],
    [
      ['Gamificación real', 'Completa (XP, Chokis, racha, badges)', 'Completa', 'Básica'],
      ['Tutoría IA personalizada', 'María — restricción pedagógica activa', 'No', 'Parcial'],
      ['Evaluación de speaking con IA', 'Whisper + GPT calibrado LATAM', 'No', 'Sí (básico)'],
      ['Progresión formal A1→C1', 'Con exámenes y certificados reales', 'No', 'Sí'],
      ['Costo mensual', '$49 individual', '$13 (básico)', '$99+'],
      ['Idiomas disponibles', 'Inglés (+ 4 listos para activar)', 'Múltiples', 'Inglés'],
      ['Dataset LATAM propietario', 'Sí — crece con cada estudiante', 'No', 'No'],
    ],
    [3120, 2340, 1950, 1950]
  ),

  h2('1.3 Estado Actual del Producto'),
  p('A la fecha de este documento, AcademIA cuenta con un sistema funcional completo en su capa de inteligencia artificial. Los 170 pasos del roadmap técnico han sido implementados, probados y verificados en entorno de producción. El sistema está técnicamente listo para recibir estudiantes de pago.'),
  bullet('María Chat: operativa con restricción temática pedagógica activa.'),
  bullet('María Speaking Diario: operativa con evaluación Whisper + GPT calibrado para LATAM.'),
  bullet('Sistema de gamificación: XP, Chokis, streaks, badges — completamente funcional.'),
  bullet('Motor de retención: detección de frustración, burnout y abandono — activo.'),
  bullet('Infraestructura multiidioma: inglés activo; portugués, francés, italiano y japonés configurados.'),
  bullet('Pendiente: grabación de videos por lección (programada 7 de junio 2026) y UI de ejercicios interactivos.'),

  h2('1.4 Potencial de Mercado LATAM'),
  p('El mercado de aprendizaje de inglés en Latinoamérica representa una oportunidad de múltiples miles de millones de dólares. Costa Rica tiene más de 5 millones de habitantes, con una demanda creciente de inglés por el sector tecnológico, turismo y zonas francas. A nivel LATAM, se estima que más de 400 millones de hispanohablantes tienen acceso a internet con capacidad de pago por servicios de suscripción digital.'),
  p('El enfoque inicial en Costa Rica permite validar el modelo con costos controlados antes de escalar a otros mercados. La estrategia de expansión sigue la adopción del idioma: inglés primero, seguido de portugués (Brasil) y francés (mercado caribeño y europeo).'),

  divider(),

  // ── 2. ARQUITECTURA TÉCNICA ──
  h1('2. Arquitectura Técnica'),
  h2('2.1 Stack Tecnológico'),
  makeTable(
    ['Tecnología', 'Versión', 'Propósito', 'Estado'],
    [
      ['Next.js', '14+', 'Framework frontend y API routes — servidor y cliente unificados', 'Activo'],
      ['React', '18+', 'Interfaz de usuario, componentes, estado', 'Activo'],
      ['Tailwind CSS', '3+', 'Sistema de diseño responsive mobile-first', 'Activo'],
      ['Supabase', 'Latest', 'Base de datos PostgreSQL + autenticación + storage', 'Activo'],
      ['OpenAI GPT-4.1-mini', 'Latest', 'Motor de chat, evaluación pedagógica, generación de contenido', 'Activo'],
      ['OpenAI Whisper-1', 'v1', 'Transcripción de audio a texto para evaluación de speaking', 'Activo'],
      ['Vercel', 'Latest', 'Hosting, deploy automático desde GitHub, CDN global', 'Activo'],
      ['GitHub', 'Latest', 'Control de versiones, repositorio de código fuente', 'Activo'],
    ],
    [2000, 1200, 4260, 1500]
  ),

  h2('2.2 APIs Externas Configuradas'),
  makeTable(
    ['Servicio', 'Propósito', 'Estado'],
    [
      ['OpenAI API', 'GPT-4.1-mini (chat/eval) + Whisper (transcripción) + GPT-4.1-nano (tareas simples)', 'Activo'],
      ['Supabase Auth', 'Registro, login, recuperación de contraseña, sesiones JWT', 'Activo'],
      ['Stripe', 'Pagos de suscripción, recuperación de pagos fallidos', 'Estructura lista — pendiente keys'],
      ['Zetly Mail', 'Emails automáticos: bienvenida, resúmenes, reportes mensuales', 'Pendiente configuración'],
      ['Zetly Mensajero', 'Recordatorios y nudges por WhatsApp', 'Pendiente línea WhatsApp'],
      ['ElevenLabs', 'Síntesis de voz consistente para María (voz clonada)', 'Pendiente API key'],
      ['HeyGen', 'Avatar de video de María para eventos y evaluaciones premium (2027)', 'Pendiente'],
    ],
    [2000, 4560, 2400]
  ),

  h2('2.3 Estructura de Base de Datos'),
  p('La base de datos está implementada en PostgreSQL a través de Supabase. Las tablas principales son:'),
  makeTable(
    ['Tabla', 'Propósito'],
    [
      ['students', 'Perfil completo del estudiante: nivel, XP, Chokis, racha, suscripción, idioma'],
      ['student_events', 'Historial de todas las acciones: chat, speaking, misiones, costos IA, memoria'],
      ['student_speaking_attempts', 'Intentos de speaking con transcript, score GPT y score AcademIA'],
      ['student_lesson_progress', 'Progreso por lección: % video visto, score ejercicio, completada o no'],
      ['student_exercise_attempts', 'Intentos de ejercicios: tiempo, score, abandonado, stuck_flag'],
      ['student_monthly_exams', 'Resultados de exámenes mensuales por sección y score global'],
      ['student_badges', 'Badges ganados con fecha y tipo'],
      ['student_behavioral_profile', 'Perfil de comportamiento: motivación, frustración, burnout, dropout risk'],
      ['notifications_queue', 'Cola de notificaciones programadas: email, WhatsApp, push, in-app'],
      ['speaking_missions', 'Misiones de speaking con frases reales por nivel y semana'],
      ['lessons_catalog', 'Catálogo de lecciones A1-C1 con gramática, vocabulario y meta de speaking'],
    ],
    [2800, 6160]
  ),

  divider(),

  // ── 3. LOS 6 MODOS DE MARÍA ──
  h1('3. Los 6 Modos de María'),
  p('María es el motor pedagógico central de AcademIA. Opera en 6 modos distintos según el contexto del estudiante. Cada modo tiene un sistema de prompts, criterios de evaluación y flujo de interacción específicamente diseñados.'),

  h2('Modo 1 — María Tutora de Texto'),
  p('El estudiante escribe a María con dudas, preguntas o para practicar. María responde como tutora pedagógica, NO como asistente genérico.'),
  bullet('Conoce exactamente qué semana va el estudiante y qué temas ha completado.'),
  bullet('Restricción temática activa: solo responde sobre vocabulario y gramática ya estudiados.'),
  bullet('Detecta debilidades en tiempo real y adapta su respuesta.'),
  bullet('No responde preguntas fuera del idioma que el estudiante está aprendiendo.'),
  bullet('No enseña otros idiomas (chino, italiano, francés) si el plan es inglés.'),
  bullet('Tono adaptativo: energético, de apoyo, gentil, urgente o celebratorio según el estado motivacional del estudiante.'),
  bullet('Termina siempre con un mini-ejercicio o pregunta para mantener la práctica activa.'),

  h2('Modo 2 — María Evaluadora de Speaking Diario'),
  p('El estudiante graba su voz practicando frases guiadas. María evalúa en 3 dimensiones y aplica el score propietario AcademIA calibrado para hispanohablantes.'),
  bullet('Precisión gramatical (35%): uso correcto de estructuras del nivel actual.'),
  bullet('Fluidez natural (35%): coherencia del discurso, pausas, velocidad.'),
  bullet('Pronunciación por nivel (30%): tolerancia alta en A1, exigencia progresiva hasta C1.'),
  bullet('Score GPT ajustado con calibración LATAM para no penalizar excesivamente errores típicos de hispanohablantes.'),
  bullet('Protocolo de corrección en 5 pasos: escucha completa, confirma lo correcto primero, modelo de corrección, repetición obligatoria, score y decisión.'),
  bullet('Score >= 80: avanza. Score 65-79: María sugiere repetir. Score < 65: bloquea avance y activa remediación.'),

  h2('Modo 3 — María Evaluadora Mensual'),
  p('Al completar las 4 semanas del mes, el estudiante enfrenta un examen de 4 secciones (~40 minutos).'),
  makeTable(
    ['Sección', 'Peso', 'Descripción', 'Score mínimo'],
    [
      ['Speaking libre', '35%', 'Conversación 3-4 min mezclando temas del mes completo', '65/100'],
      ['Gramática', '25%', '30 preguntas fill-in-the-blank + opción múltiple, límite 15 min', '70/100'],
      ['Listening', '25%', '3 audios de 30-45 seg, 5 preguntas por audio', '60/100'],
      ['Writing', '15%', '5 oraciones libres sobre temas del mes', '60/100'],
    ],
    [2000, 1000, 4000, 1960]
  ),
  p('Si falla el examen: Review Mode 3 días → Rescue Plan 45 min → Flag a tutor humano (Randall).'),
  p('Score >= 90%: Badge "Mes X Master" + 300 XP + acceso a preview del siguiente mes.'),

  h2('Modo 4 — María Evaluadora de Nivel (Trimestral)'),
  p('Al completar un nivel completo, María conduce una evaluación conversacional cuya duración y exigencia escala con el nivel:'),
  makeTable(
    ['Nivel', 'Duración', 'Score mínimo', 'Promesa que se verifica'],
    [
      ['A1', '8 minutos', '65/100', 'Puede sobrevivir en inglés — presentarse y hablar de temas personales'],
      ['A2', '12 minutos', '65/100', 'Habla sin traducir mentalmente — rutinas, gustos, trabajo, familia'],
      ['B1', '18 minutos', '68/100', 'Sostiene conversaciones reales — problemas, opiniones, improvisa'],
      ['B2', '24 minutos', '70/100', 'Habla fluido y natural — puede trabajar en inglés, debatir'],
      ['C1', '30 minutos', '75/100', 'Piensa en inglés — conversaciones profesionales, negocia, lidera'],
    ],
    [1000, 1200, 1500, 5260]
  ),
  p('Característica clave: María comienza la evaluación como conversación natural. El estudiante no sabe exactamente cuándo empieza la evaluación formal. Esto mide habla natural, no habla de examen memorizada.'),

  h2('Modo 5 — María Evaluadora Final (15 Meses)'),
  p('"La tapa del perol." 45 minutos de conversación entre iguales, 100% en inglés, sin estructura de examen. María inicia como si fueran viejos conocidos: "It\'s been 15 months. What\'s different about you now?" Evalúa fluidez, vocabulario C1, argumentación, pronunciación y capacidad de sostener 30+ minutos continuos sin bloqueo. Si aprueba: Certificado digital CEFR C1 con datos reales (horas totales, fecha inicio, scores acumulados).'),

  h2('Modo 6 — María Presencia Física (Eventos)'),
  p('Para ferias, eventos y ExpoPyme (2027). María opera en una pantalla grande con micrófono de alta calidad y tiene conversaciones en tiempo real con visitantes. Genera un diagnóstico de nivel en 2 minutos y entrega un QR personalizado con el perfil del visitante. Tecnología por fases:'),
  bullet('Fase 1 (activa): Pantalla + OpenAI Realtime API + micrófono. Costo adicional: $0.'),
  bullet('Fase 2: ElevenLabs voz consistente + HeyGen avatar video. Costo: ~$50/mes.'),
  bullet('Fase 3 (2027+): Proyección holográfica o robot físico. ROI justificado cuando revenue lo permite.'),

  divider(),

  // ── 4. LOS 170 PASOS ──
  h1('4. Los 170 Pasos — Documentación Completa'),
  p('A continuación se documenta el detalle técnico de cada uno de los 170 componentes implementados en el sistema AcademIA, organizados en 8 bloques estratégicos.'),

  // BLOQUE 1
  h2('BLOQUE 1 — Foundation MVP (Pasos 1-35)'),
  p('"María usable real" — El fundamento sobre el cual opera todo el sistema.'),
  h3('Auth & Usuarios (Pasos 1-5)'),
  numbered('Signup: Registro de nuevos estudiantes con email y contraseña. Implementado con Supabase Auth. Al registrarse se crea automáticamente el perfil del estudiante en la tabla "students" con nivel A1, XP=0 y módulo inicial "Speaking".'),
  numbered('Login: Autenticación con email/contraseña vía supabase.auth.signInWithPassword(). Redirige automáticamente al dashboard principal. Muestra errores de contraseña incorrecta con mensajes claros.'),
  numbered('Logout: Cierre de sesión con supabase.auth.signOut() desde cualquier pantalla. Redirige inmediatamente a /login. Disponible en cabecera de María Chat y María Speaking.'),
  numbered('Forgot Password: Recuperación de contraseña con supabase.auth.resetPasswordForEmail(). URL de redirección dinámica según entorno (no hardcodeada a localhost). Página con dark mode consistente.'),
  numbered('Session Persistence: La sesión del estudiante persiste entre recargas de página. Verificación con supabase.auth.getUser() al iniciar cada pantalla. Redirección automática si no hay sesión activa.'),
  h3('Speaking Core (Pasos 6-15)'),
  numbered('Audio Recording: Grabación de voz con la API nativa del navegador MediaRecorder. El estudiante mantiene presionado el botón micrófono (forma de micrófono con animación roja al grabar). Compatible con Chrome, Firefox y Safari móvil.'),
  numbered('Audio Playback: Reproducción del audio grabado disponible después de cada sesión de speaking. El estudiante puede escucharse antes de recibir el feedback.'),
  numbered('Whisper Transcription: El audio grabado se envía a OpenAI Whisper-1 vía la API route /api/transcribe. Devuelve el texto transcrito en el idioma que el estudiante habló. Validación de longitud mínima (3 palabras).'),
  numbered('Auto Transcription Send: La transcripción se envía automáticamente al evaluador una vez completada. No requiere acción adicional del estudiante. Flujo: grabar → soltar → transcribir → evaluar.'),
  numbered('Speaking Feedback: GPT-4.1-mini evalúa el transcript con formato JSON estructurado. Devuelve: score, gramática, fluidez, pronunciación, feedback general y versión corregida. Prompt específico con reglas de evaluación para hispanohablantes.'),
  numbered('Grammar Correction: La evaluación identifica errores gramaticales específicos del nivel actual del estudiante. No penaliza errores de niveles futuros. Feedback en español, versión corregida en inglés.'),
  numbered('Fluency Evaluation: Mide la coherencia del discurso transcrito, pausas y longitud de respuesta. En A1 la tolerancia es alta; en B2+ la exigencia es mayor.'),
  numbered('Pronunciation Evaluation: Sistema de ruta de pronunciación por nivel implementado en /src/lib/pronunciation-roadmap.ts. Cubre sonidos específicos por nivel: A1 (TH, B/V), A2 (schwa, linking), B1 (sentence stress), B2-C1 (connected speech, register). Errores típicos de hispanohablantes documentados con ejercicios de minimal pairs.'),
  numbered('Speaking Score: Score final 0-10 (o 0-100 en el sistema propietario AcademIA) calculado con los 3 ejes: precisión 35%, fluidez 35%, pronunciación 30%. Guardado en tabla student_speaking_attempts.'),
  numbered('Corrected Version Generation: GPT genera la versión corregida del texto del estudiante. Regla crítica: preservar la idea original, solo corregir errores reales, no mejorar estilo ni avanzar vocabulario. La versión corregida es el modelo que el estudiante debe repetir.'),
  h3('Chat System (Pasos 16-20)'),
  numbered('Chat UI: Interfaz de mensajes con burbuja del usuario (verde, derecha) y de María (gris oscuro, izquierda). Botón "Escuchar a María" en cada respuesta de la tutora usando SpeechSynthesis API del navegador.'),
  numbered('Message Persistence: Cada mensaje del chat se guarda en la tabla student_events con event_type="ai_response" y los datos del mensaje en el campo event_data (user_message + ai_response).'),
  numbered('Chat History: Al cargar la pantalla, el historial de conversaciones se recupera desde /api/chat-history. Se muestran los últimos 20 intercambios ordenados cronológicamente.'),
  numbered('Scroll Persistence: El chat baja automáticamente al último mensaje cada vez que llega una respuesta nueva o al cargar el historial. Implementado con useRef + scrollIntoView({ behavior: "smooth" }).'),
  numbered('Realtime UI Updates: Indicador de typing animado (3 puntos verdes con animación bouncing) mientras María procesa la respuesta. El botón Enviar se deshabilita durante el procesamiento para evitar duplicados.'),
  h3('Student Data (Pasos 21-25)'),
  numbered('Student Profile: Tabla "students" en Supabase con campos: id (UUID de Supabase Auth), email, full_name, current_level, current_module, xp, chokis, streak_days, longest_streak, level_title, subscription_plan, subscription_status, current_language, completed_languages.'),
  numbered('Student ID Architecture: El ID del estudiante es el mismo UUID generado por Supabase Auth. Se crea el registro en "students" automáticamente en el primer login mediante la API route /api/create-student. Si ya existe, no lo duplica.'),
  numbered('Speaking Attempts Table: Tabla student_speaking_attempts guarda: student_id, transcript, mission_id, score, feedback (JSON), audio_url. Permite calcular promedio, mejor score y tendencia de mejora.'),
  numbered('Events Table: Tabla student_events es el log completo de actividad del estudiante. Registra: ai_response, speaking_stamina, daily_mission, latam_dataset, ai_cost, placement_test, referral_sent, subscription_activated, entre otros. Es la fuente de verdad para analytics.'),
  numbered('Missions Table: Tabla speaking_missions en Supabase almacena las misiones por nivel con título, descripción, target_level, phrases (array de frases reales) y min_score. Las frases del Mes 1 A1 están cargadas (30 frases reales ordenadas por dificultad).'),
  h3('Dashboard (Pasos 26-30)'),
  numbered('Total Practices: Número total de intentos de speaking del estudiante, calculado desde student_speaking_attempts.'),
  numbered('Average Score: Promedio de scores de speaking, calculado en /api/speaking-progress.'),
  numbered('Best Score: El score más alto alcanzado por el estudiante, visible en el dashboard de María Speaking.'),
  numbered('Last Activity: Fecha del último intento de speaking, mostrada con formato local. "Sin actividad" si no hay registros.'),
  numbered('Speaking Streak: Días consecutivos de práctica calculados con el algoritmo calculateStreak() que agrupa intentos por día calendario y cuenta días consecutivos hacia atrás desde hoy.'),
  h3('Stability (Pasos 31-35)'),
  numbered('Error Handling: Todos los API routes tienen try/catch con respuestas JSON estructuradas: { success: false, error: message, status: 500 }. Los errores del frontend muestran mensajes amigables al usuario.'),
  numbered('API Validation: Cada endpoint valida los parámetros requeridos antes de procesarlos. Responde 400 Bad Request si faltan datos obligatorios. Usa supabaseAdmin (service role) en el servidor para evitar problemas de RLS.'),
  numbered('Loading States: El botón Enviar del chat se deshabilita con opacity-50 mientras procesa. El botón de speaking muestra animación durante evaluación. La misión muestra skeleton animado mientras carga.'),
  numbered('Mobile Responsiveness: Toda la interfaz usa breakpoints de Tailwind CSS (sm:, md:) para adaptar padding, fuentes, altura del chat y botones a pantallas móviles. PWA manifest activo — la app es instalable en celular sin App Store.'),
  numbered('Protected Routes: Cada pantalla verifica la sesión activa con supabase.auth.getUser() al montarse. Si no hay sesión, redirige inmediatamente a /login. Previene acceso no autorizado a cualquier ruta.'),

  // BLOQUE 2
  h2('BLOQUE 2 — Pedagogía Real (Pasos 36-65)'),
  p('"Sistema educativo serio" — Aquí María deja de ser chatbot y se convierte en tutora pedagógica real.'),
  numbered('CEFR Structure A1-C2: Los 6 niveles del Marco Europeo de Referencia implementados como configuración del sistema. Cada nivel tiene: nombre, promesa formativa, ratio de idiomas español/inglés, y voz TTS adaptada. Estructura en /src/lib/language-config.ts.'),
  numbered('Level Placement Logic: Test de ubicación de 15 preguntas cubriendo A1, A2, B1 y B2. El sistema evalúa el porcentaje correcto por nivel y asigna el nivel recomendado. Actualiza current_level en la base de datos. Endpoint: /api/placement-test.'),
  numbered('Skill Tree: Árbol de 20 nodos para el Mes 1 A1, donde cada lección tiene prerequisitos (requires[]) y desbloqueos (unlocks[]). Una lección solo se desbloquea cuando sus prerequisitos están completados con score >= 80%. Implementado en /src/lib/skill-tree.ts.'),
  numbered('Grammar Roadmap: El catálogo de lecciones (lessons_catalog en Supabase) incluye los campos de gramática por lección. Semana 1: Verb BE, possessivos, pronombres. Semana 2: demostrativos, artículos, plurales. Semana 3: Simple Present, Can, adverbios de frecuencia. Semana 4: Going to, preposiciones de lugar, There is/are.'),
  numbered('Vocabulary Roadmap: Vocabulario clave por lección cargado en lessons_catalog. 20 lecciones de A1 con vocabulario específico: objetos del aula, países, rutinas, comida, trabajo, salud, lugares, direcciones.'),
  numbered('Pronunciation Roadmap: Sistema en /src/lib/pronunciation-roadmap.ts con 5 niveles (A1-C1). Cada nivel define: sonidos objetivo, errores comunes de hispanohablantes, instrucciones para María y nivel de tolerancia (alta/media/baja). A1 trabaja TH, B/V. A2 añade schwa, linking. B1 trabaja sentence stress. B2-C1 trabaja connected speech y registro.'),
  numbered('Speaking Roadmap: 30 frases reales del Mes 1 A1 en /src/lib/maria-context.ts, ordenadas de menor a mayor dificultad, agrupadas por semana (básica, elemental, intermedio, producción). Selección aleatoria según semana actual del estudiante.'),
  numbered('Adaptive Difficulty: El tipo de ejercicio generado se adapta al score promedio del estudiante. Score < 50: fill-in-the-blank. Score 50-65: opción múltiple. Score 65-80: traducción. Score >= 80: speaking prompt libre.'),
  numbered('Weakness Detection: La tabla student_exercise_attempts incluye stuck_flag (boolean). Se activa cuando el estudiante tarda más del doble del tiempo promedio en un ejercicio o falla 3+ veces. María recibe la lista de weak_topics en cada sesión.'),
  numbered('Weakness Prioritization: En buildMariaContext(), los ejercicios con stuck_flag se priorizan para la siguiente sesión. Si hay revisión urgente, la misión diaria la incluye como objetivo obligatorio.'),
  numbered('Mastery Score: Score compuesto multidimensional: 60% promedio de scores + 40% consistencia (inverso de la varianza). Un estudiante con promedio 7.5 pero muy inconsistente tiene menor mastery que uno con promedio 7.0 consistente.'),
  numbered('Mastery Thresholds: Para completar una lección: video_completion_pct >= 80% Y exercise_score >= 80%. Para avanzar de semana: todas las lecciones de la semana completadas. Para avanzar de mes: examen mensual >= 70% global Y >= 65% en speaking.'),
  numbered('Revision Engine: /src/lib/spaced-repetition.ts analiza el historial de ejercicios y determina qué lecciones necesitan repaso. Prioridades: urgent (score < 65 o mucho tiempo sin practicar), soon (vence pronto) y later.'),
  numbered('Spaced Repetition: Algoritmo SM-2 simplificado. Score < 50: repaso inmediato. Score 50-64: 1 día. Score 65-79: 3 días. Score 80-89: 7 días. Score >= 90: 14/28/42 días según número de repasos previos. Implementado en getDaysUntilNextReview().'),
  numbered('Daily Missions: Generadas por GPT-4.1-mini una vez por día basadas en: semana actual, debilidades, score de speaking, racha y revisiones urgentes. Se cachean para evitar llamadas redundantes. Endpoint: /api/daily-mission.'),
  numbered('Weekly Missions: Meta de la semana completa generada por GPT al inicio de cada semana. Incluye 1 meta principal de speaking, 2-3 metas de gramática/vocabulario y 1 bonus challenge. Total XP al completar: 150-300 puntos.'),
  numbered('Monthly Exams: 4 secciones evaluadas por IA: speaking libre (35%), gramática fill-blank (25%), listening (25%), writing oraciones libres (15%). Lógica de fallo: review mode 3 días → rescue plan 45 min → flag humano Randall. Endpoint: /api/monthly-exam.'),
  numbered('Quarterly Exams: Conversación natural con María que evalúa la promesa formativa del nivel. Duración escalada: A1=8min, A2=12min, B1=18min, B2=24min, C1=30min. Estructura completa implementada, voz en tiempo real pendiente OpenAI Realtime API.'),
  numbered('Final Graduation Exam: 45 minutos de conversación libre en inglés 100%. María opera como par intelectual, no como tutora. Evalúa fluidez, vocabulario C1, argumentación y pronunciación. Si aprueba: certificado digital CEFR C1 con datos reales del recorrido.'),
  numbered('Daily Adaptive Objectives: Incluido en el motor de misiones diarias. Si hay revisión urgente, el objetivo del día cambia. Si hay score bajo en speaking, se prioriza speaking. Si hay racha > 7 días, se añade un desafío extra opcional.'),
  numbered('Dynamic Exercise Generation: /api/generate-exercise genera ejercicios personalizados con GPT según: tema débil, tipo adaptado al score, contexto latinoamericano (nombres, lugares, comida de LATAM). El sistema elige el tipo de ejercicio según el score actual del estudiante.'),
  numbered('Topic Balancing: Analiza los últimos 20 ejercicios del estudiante para identificar temas sobre-practicados y sub-practicados. El generador de ejercicios prioriza los temas con menos práctica para mantener el balance curricular.'),
  numbered('Level Progression Locks: Una lección solo se desbloquea cuando sus prerequisitos en el Skill Tree están completos. Una semana solo se desbloquea cuando todas las lecciones de la semana anterior están al 80%+. Un mes solo se desbloquea cuando se aprueba el examen mensual.'),
  numbered('Speaking Confidence Tracking: El score promedio de speaking de las últimas 10 sesiones se calcula en buildMariaContext() y se pasa a María en cada request. Si el promedio es < 65, María prioriza speaking en cada interacción.'),
  numbered('Speaking Stamina Tracking: /api/speaking-stamina registra minutos de speaking por sesión. Calcula tendencia (improving/stable/declining), promedio de palabras por minuto y nivel de stamina (starting/developing/good/excellent).'),
  numbered('Error Frequency Tracking: student_exercise_attempts.attempts_count registra cuántas veces intentó cada ejercicio. Si attempts_count >= 3 en el mismo ejercicio, se activa stuck_flag. Esto alimenta weakness detection y el motor de revisión.'),
  numbered('Personalized Reinforcement: María recibe en cada request: weak_topics[], urgent_review[], speaking_score_avg. Si hay temas débiles, adapta sus explicaciones. Si el score es bajo, termina cada respuesta con un ejercicio de speaking específico.'),
  numbered('Study Recommendations: /api/study-plan genera 3-5 recomendaciones concretas con: prioridad (high/medium/low), acción específica, razón basada en datos reales, tiempo estimado y tipo de actividad.'),
  numbered('Progress Reports: Reporte de los últimos 7 días: sesiones de speaking, promedio, mejor score, lecciones completadas, porcentaje de completion, racha, XP acumulado y temas con revisión urgente.'),
  numbered('AI Study Planner: Plan de 7 días generado por GPT con: foco diario, tareas específicas, duración estimada y meta de speaking por día. Basado en el progreso real del estudiante, no en una plantilla genérica.'),

  // BLOQUE 3
  h2('BLOQUE 3 — Retention Engine (Pasos 66-90)'),
  p('"La gente NO abandona" — Este bloque es donde está el dinero real, porque retención = empresa.'),
  numbered('Habit System: Registro de actividad diaria con last_active_at en la tabla students. Detecta frecuencia de sesiones, horarios de práctica y patrones de comportamiento. Base del sistema de rachas y predicción de abandono.'),
  numbered('Smart Streaks: Streak diario con protección inteligente. Si el estudiante falla 1 día pero tiene streak_freeze_available >= 1, el sistema perdona el día y consume el freeze. Guarda longest_streak como récord personal. Bonus XP a los 7 y 30 días de racha.'),
  numbered('XP System: 8 niveles de título con XP acumulado: Beginner (0), Explorer (100), Learner (300), Speaker (600), Confident (1000), Advanced (1500), Expert (2500), Master (4000). Reglas de XP por acción definidas en XP_RULES: chat_message=5, speaking_attempt=15, speaking_score_9+=40, lesson_complete=30, monthly_exam_pass=200.'),
  numbered('Chokis Economy: Moneda virtual de AcademIA. Se gana por: completar misiones diarias (5), semanales (20), speaking >= 8 (10), examen mensual (50), racha 7 días (15), badge ganado (5). Se planifica su uso en tienda de recompensas (roadmap).'),
  numbered('Achievement Badges: 15 badges con triggers automáticos: Primera Charla, Primera Voz, Racha de 3, Semana Completa, Mes Imparable, Casi Perfecto, Perfecto, Semana 1 Completa, Mes 1 Aprobado, Mes 1 Master, Madrugador, Búho Nocturno, Consistente, De Regreso, Test de Nivel.'),
  numbered('Motivation Score: Score 0-100 calculado en tiempo real en /src/lib/retention-engine.ts. Factores positivos: score de speaking alto, actividad frecuente (5+ eventos en 7 días), sesión reciente. Factores negativos: días de inactividad (3 días = -20, 7 días = -30), score bajo.'),
  numbered('Frustration Detection: Detecta frustración por: abandonedCount >= 2, stuckCount >= 2, lowScoreCount >= 3, 2+ sesiones de speaking recientes con score < 5. Nivel 0-100 acumulado con umbrales de alerta.'),
  numbered('Burnout Detection: Identifica burnout como: alta actividad en los últimos 30 días seguida de caída abrupta en los últimos 7 días. Solo activa si también hay frustración > 40. Previene sobreentrenamiento.'),
  numbered('Dropout Prediction: Score de riesgo 0-100 basado en: días sin actividad (7 días = +30, 14 = +30, 21 = +20), motivation score < 30 (+20), burnout risk > 50 (+10). Activa recovery flows automáticos.'),
  numbered('Recovery Flows: 5 estados con acción y tono de María específicos: healthy (energético), at_risk (gentil + nudge), frustrated (apoyo + ejercicios más fáciles), burning_out (sugiere descanso y sesión ligera), about_to_drop (anti-guilt reactivation urgente).'),
  numbered('Smart Reminders: Reminders generados por IA con hora óptima calculada a partir de los horarios históricos de sesión del estudiante. Si siempre entra a las 7pm, el reminder llega a las 6:45pm.'),
  numbered('WhatsApp Reminders: Estructura completa implementada en /api/notifications. Genera mensaje personalizado con anti-guilt framing. Pendiente de activar con API de Zetly Mensajero cuando haya línea WhatsApp Business.'),
  numbered('Email Reminders: Estructura completa implementada. Genera subject y body personalizados por IA. Pendiente configuración de Zetly Mail con correo institucional.'),
  numbered('Personalized Nudges: GPT genera mensajes de 160 caracteres (WhatsApp) u 80 palabras (email) adaptados al estado motivacional, racha, score y nombre del estudiante. Nunca mensajes genéricos.'),
  numbered('Anti-Guilt Reactivation: Regla crítica implementada: cuando un estudiante regresa después de ausencia, María NUNCA menciona que "no entró", "falló" o "abandonó". El regreso se celebra. "Bienvenido de vuelta, seguimos desde donde lo dejaste."'),
  numbered('Session Timing Optimization: Calcula la hora del día con mejor performance del estudiante analizando los timestamps de sus sesiones históricas. Usa esta hora para programar recordatorios y notificaciones.'),
  numbered('Behavioral Segmentation: 4 perfiles de aprendizaje: Explorer (curioso, muchas preguntas), Achiever (orientado a metas y badges), Social (aprende conversando), Independent (autodisciplinado, prefiere autonomía). Cada perfil tiene estrategia de María diferente.'),
  numbered('Learning Personality Profiles: Definidos en /src/lib/student-profiles.ts con: descripción, fortalezas, riesgos, estrategia recomendada de María, duración óptima de sesión y estilo de feedback preferido.'),
  numbered('Emotional Tone Adaptation: 5 tonos de María con frases específicas para saludo, corrección, aliento y cierre de sesión. El tono se determina automáticamente según el estado motivacional del estudiante en cada request al API de María.'),
  numbered('Smart Onboarding: 4 pasos guiados para el nuevo estudiante: test de nivel (5 min), primera práctica de voz, ver misión del día, configurar recordatorio. Implementado en /api/communications con tipo "onboarding".'),
  numbered('Welcome Sequences: 6 mensajes programados para días 1, 2, 3, 7, 14 y 30 desde el registro. Cada mensaje tiene contenido específico: bienvenida, primera misión, speaking reminder, check-in de primera semana, reporte de 2 semanas, examen mes 1 disponible.'),
  numbered('Re-engagement Campaigns: Mensaje de reactivación anti-guilt generado por GPT cuando el sistema detecta dropout_risk >= 60. Tono: María extraña al estudiante, celebra el regreso, nunca reprocha. CTA: "Continuar donde lo dejaste".'),
  numbered('Weekly Summaries: Resumen de la semana: sesiones, intentos de speaking, promedio, racha, XP ganado, meta de la próxima semana. Generado los lunes. María personaliza el mensaje según el desempeño.'),
  numbered('Monthly Progress Emails: Reporte mensual completo con: nivel, intentos de speaking, mejora primera vs segunda quincena, racha, XP y Chokis acumulados. María da una evaluación honesta del progreso.'),
  numbered('Milestone Celebrations: Cuando el estudiante gana un badge, el sistema genera una celebración con: mensaje de María, emoji, confetti (flag para UI), XP bonus, mensaje para compartir en redes.'),

  // BLOQUE 4
  h2('BLOQUE 4 — Language OS (Pasos 91-110)'),
  p('"No academia inglesa — Sistema Operativo de Idiomas" — Diseñado para escalar a múltiples idiomas sin reconstruir nada.'),
  numbered('Multi-Language Architecture: Todos los componentes del sistema están diseñados como idioma-agnósticos. El motor pedagógico, de scoring, de retención y de adquisición funcionan para cualquier idioma sin modificar el código base. Solo se enchufa la configuración del idioma.'),
  numbered('Language Abstraction Layer: /src/lib/language-config.ts define la interfaz LanguageConfig con: código, nombre, nombre en español, estado activo, nombre de la tutora, niveles CEFR, ratio de idiomas por nivel, voz Whisper, voz TTS y trigger de activación.'),
  numbered('Prompt Localization: /src/lib/prompt-localization.ts genera el system prompt correcto para María según el idioma objetivo. Cada idioma tiene instrucciones específicas para hispanohablantes aprendiendo ese idioma.'),
  numbered('Voice Localization: La velocidad de TTS se adapta al nivel del estudiante. A1: 0.8x (más lento para comprensión). A2: 0.85x. B1: 0.9x. B2-C1: 1.0x (velocidad natural). Cada idioma tiene una voz OpenAI diferente asignada.'),
  numbered('Shared Language Engine: buildLanguageSession() construye la sesión completa de idioma: código del idioma, nombre de la tutora, extensión del prompt, configuración de voz y ratio español/idioma. María recibe esto en cada request.'),
  numbered('Language Switching: /api/language-settings permite cambiar el idioma del estudiante. Si el idioma solicitado está activo, lo actualiza. Si está inactivo, devuelve un error con el trigger de activación y el mensaje "Próximamente en AcademIA".'),
  numbered('Universal Mission Engine: Las misiones funcionan para cualquier idioma porque la estructura es agnóstica al contenido lingüístico. Solo cambia el contenido de las frases de práctica, no la lógica.'),
  numbered('Shared Student Profile: El perfil del estudiante viaja con él entre idiomas. current_language indica qué está aprendiendo ahora. completed_languages guarda los idiomas ya certificados. XP, Chokis y racha son transversales a todos los idiomas.'),
  numbered('Cross-Language Analytics: /api/language-settings PATCH devuelve analytics por idioma: total de eventos, intentos de speaking, score promedio, primera y última actividad. Preparado para mostrar progreso comparativo entre idiomas.'),
  numbered('Language Configuration System: El trigger de activación del segundo idioma está configurado: "100_students_or_first_B1_english". El siguiente idioma en la cola es portugués (pt). El sistema activa automáticamente la interfaz cuando se cumple la condición.'),
  numbered('English Support: Inglés activo como idioma principal. Tutora: María. Niveles A1-C2. Ratio 85/15 en A1 hasta 0/100 en C2. Voz "nova" de OpenAI. Acento latinoamericano del estudiante celebrado, no corregido.'),
  numbered('Portuguese Support: Configurado y listo para activar. Tutora: Ana. Foco en sonidos nasales y reducción vocálica. Voz "shimmer" de OpenAI.'),
  numbered('French Support: Configurado. Tutora: Sophie. Foco en vocales nasales, liaison y letras silenciosas. Voz "alloy" de OpenAI.'),
  numbered('Italian Support: Configurado. Tutora: Giulia. Foco en consonantes dobles. Voz "echo" de OpenAI.'),
  numbered('Japanese Support: Configurado. Tutora: Yuki. Niveles N5-N1 (JLPT). Foco en pitch accent y mora timing. Voz "fable" de OpenAI.'),
  numbered('Shared Pedagogy Engine: El motor pedagógico (skill tree, mastery, spaced repetition) funciona para cualquier idioma sin modificaciones.'),
  numbered('Shared Scoring Engine: El algoritmo de scoring (incluido el score propietario AcademIA) es idioma-agnóstico. Se calibra per idioma cuando hay suficientes datos LATAM de ese idioma.'),
  numbered('Shared Retention Engine: Motivation score, frustration detection, dropout prediction — todos funcionan independientemente del idioma que el estudiante esté aprendiendo.'),
  numbered('Shared Mastery Engine: El sistema de mastery (thresholds, consistency score, dimensions) se aplica a todos los idiomas con los mismos criterios base, ajustables per idioma cuando sea necesario.'),
  numbered('Shared Speaking Engine: Whisper transcribe en cualquier idioma (configurable por language code). El evaluador de speaking aplica las instrucciones del idioma correcto automáticamente.'),

  // BLOQUE 5
  h2('BLOQUE 5 — AI Infrastructure (Pasos 111-130)'),
  p('"Infraestructura seria" — Aquí empieza la ventaja difícil de copiar.'),
  numbered('Prompt Management System: Registro centralizado de todas las versiones de prompts en /src/lib/prompt-manager.ts. Cada prompt tiene: ID, versión, componente, estado activo, fecha, score de performance y notas. Permite rollback a versiones anteriores.'),
  numbered('Prompt Versioning: Historial de versiones por componente. chat_v1 (básico, sin restricción temática), chat_v2 (activo, restricción + retention + language OS, score 7.8). speaking_eval_v2 activo con pronunciation roadmap por nivel (score 8.1). daily_mission_v2 adaptativa (score 8.4).'),
  numbered('AI Memory System: María recuerda información estructurada del estudiante entre sesiones. Tipos de memoria: error (errores cometidos), achievement (logros), preference (preferencias detectadas), fact (datos personales mencionados), struggle (dificultades persistentes). Guardado en student_events con event_type="ai_memory".'),
  numbered('Semantic Memory: Agrupación de errores similares para detectar patrones. Clasifica errores por categoría gramatical (verb_be, simple_present, pronunciation, vocabulary, fluency, plurals, articles, prepositions). Con suficientes datos, identifica el patrón dominante y ajusta la estrategia de María.'),
  numbered('Student Context Engine: buildMariaContext() construye el contexto completo del estudiante en cada request: nivel, semana, mes, ratio de idioma, temas disponibles, lecciones completadas, score promedio, racha, XP, Chokis, temas débiles, revisiones urgentes, actividad reciente.'),
  numbered('AI Orchestration: callWithFallback() coordina todas las llamadas a la IA con manejo de errores, routing de modelos, cache y registro de costos. Si un modelo falla, automáticamente intenta con el siguiente. Garantiza 99.9% de disponibilidad del servicio de IA.'),
  numbered('Model Routing: Tres niveles de modelo según complejidad de la tarea. GPT-4.1-nano para tareas simples (clasificaciones, validaciones). GPT-4.1-mini para tareas estándar (chat, evaluaciones, misiones). GPT-4.1 para tareas complejas (examen mensual, plan de estudio detallado).'),
  numbered('AI Cost Tracking: trackAICost() registra el costo de cada llamada por estudiante: modelo usado, tokens de entrada, tokens de salida, costo total en USD. Permite calcular el costo real por estudiante por mes. Base para optimización de rentabilidad.'),
  numbered('AI Caching: Cache en memoria con TTL de 5 minutos. Máximo 100 entradas. Si dos estudiantes hacen la misma pregunta en ventana de 5 minutos, el segundo recibe la respuesta cacheada sin costo adicional. Reduce costos en escenarios de uso concurrente.'),
  numbered('AI Fallback System: Si el modelo principal falla (timeout, rate limit, error 500), el sistema automáticamente intenta con el modelo de respaldo. El error se registra silenciosamente sin afectar la experiencia del estudiante. Máximo 2 reintentos.'),
  numbered('Error Clustering: Agrupación de errores de todos los estudiantes para identificar patrones sistémicos. Si 5+ estudiantes se traban en el mismo ejercicio, es señal de que el contenido del ejercicio necesita revisión. Base del dataset LATAM propietario.'),
  numbered('Learning Analytics: Curva de aprendizaje por estudiante: comparación del promedio de la primera mitad de sesiones vs la segunda mitad. Clasifica como: ascending (mejora significativa), stable (progreso constante), declining (señal de alerta). Incluye velocidad de mejora en puntos por sesión.'),
  numbered('Speaking Analytics: Análisis detallado de speaking por estudiante: total de intentos, promedio, mejor score, peor score, tendencia (improving/declining/stable), promedio de palabras por intento y nivel de stamina (starting/developing/good/excellent).'),
  numbered('Retention Analytics: Métricas de retención del negocio: total de estudiantes, activos en últimos 7 días, tasa de retención semanal, streak promedio. Con clasificación del estado de retención: excelente (>=70%), aceptable (>=50%), crítico (<50%).'),
  numbered('Cohort Tracking: Agrupación de estudiantes por mes de registro. Para cada cohorte: tamaño, streak promedio, distribución por niveles. Permite comparar qué cohortes retienen mejor y detectar problemas en el onboarding de meses específicos.'),
  numbered('Progress Forecasting: Proyección del tiempo estimado para que el estudiante llegue al siguiente nivel. Basado en: nivel actual, score promedio, categoría de velocidad (high/medium/low). Incluye fecha estimada de level-up y tip de aceleración.'),
  numbered('AI Optimization Loops: El sistema registra qué versión de prompt generó qué resultado. Con suficientes datos (50+ sesiones por versión), puede identificar automáticamente qué prompts producen mejores scores de aprendizaje. Base para mejora continua automatizada.'),
  numbered('Automated Experimentation: Sistema de A/B testing para prompts y enfoques pedagógicos. Asigna aleatoriamente al estudiante al grupo A o B en un experimento. Registra el grupo y el resultado. Permite comparar estadísticamente qué variante es más efectiva.'),
  numbered('Heatmaps & Dashboards: /api/admin-dashboard provee: overview del negocio (estudiantes, suscripciones activas, score promedio, eventos del día), analytics por estudiante (speaking, costos IA, forecast) y estado del sistema de prompts.'),
  numbered('Internal AI Benchmarking: Evaluación semanal de la efectividad de María: total de interacciones de chat, total de evaluaciones de speaking, score promedio de speaking, efectividad general (excellent/good/needs_improvement). Genera recomendación automática de si los prompts actuales deben mantenerse o actualizarse.'),

  // BLOQUE 6
  h2('BLOQUE 6 — Business System (Pasos 131-150)'),
  p('"Empresa real" — Aquí dejás de ser proyecto y empezás a ser negocio.'),
  numbered('Subscription System: 3 planes activos basados en el Plan Intensivo como base. Individual $49/mes (1 usuario). Familiar $120/mes ($30/persona × 4, 39% de descuento vs individual). Corporativo $350/mes ($35/persona × 10, 29% de descuento). Todos incluyen el mismo acceso completo a María.'),
  numbered('Stripe Integration: Estructura completa de suscripciones implementada en /api/subscriptions. La activación de cobros real requiere STRIPE_SECRET_KEY en variables de entorno. Pendiente de activar cuando la sociedad esté constituida y haya cuenta bancaria.'),
  numbered('Payment Recovery: Detecta suscripciones con status "past_due" y genera mensaje de recuperación personalizado para el estudiante. Prepara URL de portal de Stripe para actualización de método de pago.'),
  numbered('Family Plans: Plan Familiar para hasta 4 personas del mismo grupo familiar. Precio: $120/mes total ($30/persona). Dashboard compartido con progreso de todos los miembros. Mismo acceso que el Plan Intensivo individual.'),
  numbered('Corporate Plans: Plan Corporativo para hasta 10 empleados. Precio: $350/mes total ($35/persona). Incluye dashboard de equipo, reportes mensuales para RRHH y factura electrónica empresarial. Soporte prioritario.'),
  numbered('Team Dashboards: Vista del equipo que muestra: miembros, nivel actual de cada uno, racha y XP. Permite al responsable de RRHH monitorear el progreso del equipo sin acceder a las cuentas individuales.'),
  numbered('Referral System: Cada estudiante tiene un código único REF-XXXXXXXX. Al referir: el referidor gana 100 Chokis + 200 XP cuando el referido se registra. El referido tiene 10% de descuento en el primer mes. Endpoint: /api/referrals.'),
  numbered('Affiliate System: Vendedores externos pueden registrar ventas con su código de afiliado. La comisión es del 10% del primer pago del nuevo estudiante. Estado: pending_payment hasta confirmación de pago.'),
  numbered('CRM Integration: Vista completa del perfil de cada estudiante para el equipo de soporte: datos personales, actividad reciente, intentos de speaking, badges ganados. Accesible desde /api/ops?action=crm&student_id=xxx.'),
  numbered('Admin Dashboard: Overview del negocio en tiempo real: total de estudiantes, suscripciones activas, usuarios free, eventos del día, score promedio de speaking, distribución por niveles, estado del sistema, feature flags activos.'),
  numbered('Support Panel: El equipo de soporte puede agregar notas internas a cualquier estudiante. Las notas se guardan en student_events con event_type="support_note" y son visibles en el CRM.'),
  numbered('User Moderation: Tres acciones de moderación disponibles: warn (advertencia registrada), suspend (desactiva acceso bloqueando la suscripción) y reactivate (restaura el acceso). Cada acción queda registrada con fecha y motivo.'),
  numbered('Beta Tester System: Activa acceso completo a cualquier estudiante marcado como beta tester, independientemente de su plan. Permite probar el sistema con usuarios reales antes de lanzamiento oficial.'),
  numbered('Feature Flags: Sistema de activación/desactivación de funcionalidades sin deploy. Flags actuales: quarterly_exam_voice (off), whatsapp_notifications (off), email_notifications (off), portuguese_language (off), corporate_plans (on), referral_system (on), placement_test (on), daily_missions (on).'),
  numbered('Terms & Privacy: URLs configuradas para /terms y /privacy. Versión 1.0, actualizada junio 2026. Pendiente redacción legal final por abogado.'),
  numbered('Data Export System: Exportación completa de datos de un estudiante en formato JSON (GDPR-compliant). Incluye: perfil, historial de eventos, intentos de speaking. Disponible desde /api/ops con action="export_data".'),
  numbered('Backup System: Backups automáticos diarios de la base de datos a través de Supabase Pro. Retención de 7 días de backups. No requiere configuración adicional.'),
  numbered('Monitoring & Alerts: Health check en tiempo real desde /api/ops con action="health_check". Verifica: conexión a base de datos, disponibilidad de OpenAI API, Supabase configurado, Stripe configurado, Resend configurado.'),
  numbered('Error Logs: Todas las llamadas a la IA son registradas con modelo usado, tarea, tokens y costo. Los errores de API se registran silenciosamente sin afectar la experiencia del usuario.'),
  numbered('Production Monitoring: Estado actual: DB=operacional, OpenAI=operacional, Supabase=operacional. Stripe=pendiente keys. Zetly=pendiente configuración. Sistema clasificado como "operational" cuando los 3 críticos están activos.'),

  // BLOQUE 7
  h2('BLOQUE 7 — Premium Experience (Pasos 151-165)'),
  p('"WOW factor" — No es prioridad inicial pero sí diferenciación futura.'),
  numbered('Realtime Conversation Mode: Modo de conversación en tiempo real implementado en modo texto. La infraestructura para voz en tiempo real (OpenAI Realtime API) está lista para activar. Costo estimado: ~$0.06/minuto. Activación recomendada cuando lleguen los primeros estudiantes a B1.'),
  numbered('AI Roleplays: 7 escenarios de roleplay disponibles desde A1: Conocer a alguien nuevo (A1), En la tienda (A1), En el aeropuerto (A1), Check-in en hotel (A2), Hablando del fin de semana (A2), Entrevista de trabajo (B1), Reunión de negocios (B2), Negociación de contrato (C1). María entra en personaje y corrige errores con una nota entre corchetes sin salir del personaje.'),
  numbered('Business Simulations: Escenarios de negocios para B2+: reunión de negocios con cliente de California y negociación de contrato con empresa europea. María opera como cliente o contraparte, no como tutora.'),
  numbered('Travel Simulations: Escenarios de viaje para A1-A2: aeropuerto y hotel. Vocabulario específico de viaje y turismo con situaciones reales.'),
  numbered('Interview Simulations: Simulación de entrevista de trabajo para B1: puesto de customer service en empresa internacional. María opera como gerente de RRHH. Duración: 15 minutos. Vocabulario de entrevista en inglés.'),
  numbered('AI Pronunciation Coach: Drills fonéticos específicos para hispanohablantes en /src/lib/premium-features.ts: th_sound (minimal pairs: tree/three, sin/thin, dis/this), b_vs_v (berry/very, boat/vote, ban/van), schwa (about, banana, the). Incluye tip de posición articulatoria para cada sonido.'),
  numbered('Advanced Speaking Mode: Temas de conversación extendida por nivel con duración mínima obligatoria. B1: 2 minutos mínimo, temas sobre desafíos y personas influyentes. B2: 3 minutos, temas sobre trabajo remoto y liderazgo. C1: 5 minutos, temas sobre IA, globalización y política económica.'),
  numbered('Emotional Voice Synthesis: Configuración de ElevenLabs implementada en /src/lib/premium-features.ts con 4 estados emocionales (encouraging, correcting, celebrating, teaching) y sus parámetros de stability y style. Activar con ELEVENLABS_API_KEY. Costo estimado: ~$20/mes.'),
  numbered('Avatar System: Configuración de HeyGen implementada con 4 casos de uso: evaluación trimestral, examen de graduación, demo en eventos (ExpoPyme 2027) y video de felicitación por nivel. Costo estimado: $29/mes Plan Creator HeyGen.'),
  numbered('Voice Personality Selection: 4 personalidades de voz configuradas: María (neutral LATAM, activa), Sarah (acento americano, futura), Emily (acento británico, futura), James (acento australiano, futuro). El estudiante podrá elegir con qué acento practicar.'),
  numbered('Premium Mobile UX: PWA manifest activo en /public/manifest.json. La aplicación es instalable desde Chrome en Android o Safari en iOS. Aparece como app nativa con ícono en pantalla de inicio, sin barra del navegador. Título: "AcademIA — Aprende inglés con IA".'),
  numbered('Offline Mode: Estructura preparada. Requiere implementación de Service Worker que cachee los assets estáticos. Con offline mode, el estudiante puede acceder al contenido descargado sin conexión. Pendiente implementación.'),
  numbered('Push Notifications: API route /api/push-notifications implementada para registrar suscripciones del navegador y encolar notificaciones. Requiere VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en variables de entorno y el paquete web-push.'),
  numbered('Native App Wrapper: Plan para envolver la aplicación Next.js con Capacitor para publicarla en App Store y Google Play Store sin reescribir el código. La aplicación web funciona como base. Pendiente configuración y certificados de developer.'),
  numbered('Premium Onboarding Experience: Flujo de onboarding de 4 pasos implementado: placement test, primera práctica de voz, ver misión del día, configurar recordatorio. La secuencia de bienvenida de 6 mensajes (días 1-30) está implementada en /api/communications.'),
  p('EXÁMENES FINALES POR NIVEL (implementados en /api/realtime):'),
  makeTable(
    ['Nivel', 'Título', 'Duración', 'Score mínimo', 'Cómo inicia María'],
    [
      ['A1', 'Preséntate al mundo', '8 min', '65/100', '"Hey! I\'m so glad you made it. How are you doing today?"'],
      ['A2', 'Hablá de tu vida', '12 min', '65/100', '"It\'s great to see you again! What have you been up to lately?"'],
      ['B1', 'Conversación real', '18 min', '68/100', '"Let\'s have a real conversation. What\'s been on your mind?"'],
      ['B2', 'Hablás con fluidez', '24 min', '70/100', '"Do you think technology makes us better or worse at communicating?"'],
      ['C1', 'Dominio del idioma', '30 min', '75/100', '"It\'s been quite a journey. What\'s different about you now?"'],
    ],
    [700, 2000, 1000, 1200, 4060]
  ),

  // BLOQUE 8
  h2('BLOQUE 8 — Defensibility (Pasos 166-170)'),
  p('"Lo que hace imposible copiar" — La ventaja competitiva que crece con cada estudiante.'),
  numbered('Proprietary Speaking Score: El score de AcademIA NO es el número de GPT. Es el score de AcademIA, calibrado específicamente para hispanohablantes latinoamericanos. El algoritmo en /src/lib/proprietary-score.ts: (1) Identifica errores que otros evaluadores sobre-penalizan en hispanohablantes (word order, double negation, is/are confusion, b/v, th sound). (2) Aplica floor mínimo si la comunicación fue exitosa (si el mensaje se entiende, el score mínimo es 55 en A1). (3) Da bonus de 2 puntos si el estudiante mejoró consistentemente. (4) Calcula 5 dimensiones: grammar_latam, fluency_natural, pronunciation_clarity, vocabulary_range, communication_success. Versión actual: v1.0-latam.'),
  numbered('Proprietary Mastery System: Mastery no es "score alto una vez". Es un estado multidimensional calculado con: 60% promedio de los últimos 10 scores + 40% consistencia (basado en varianza inversa). Umbrales de mastery por nivel: A1=70, A2=72, B1=75, B2=78, C1=80. Además de superar el score, el estudiante debe completar el número mínimo de sesiones por nivel: A1=8, A2=10, B1=12, B2=15, C1=20. Y tener cero weak_topics activos.'),
  numbered('LATAM Learning Dataset: Cada sesión de speaking registra un punto de dato anónimo en la tabla student_events con event_type="latam_dataset". Los datos incluyen: hash anónimo del estudiante, nivel, scores GPT y AcademIA, tipos de error, minutos de sesión y palabras habladas. Con 50+ estudiantes, el análisis es estadísticamente significativo. Este dataset es el único en LATAM calibrado para hispanohablantes aprendiendo inglés con IA. No puede comprarse, solo acumularse.'),
  numbered('Behavioral Learning Engine: Aprende el perfil comportamental individual de cada estudiante: mejor hora del día para rendir (calculado del historial), velocidad de aprendizaje (puntos de mejora por sesión), triggers de engagement (qué lo mantiene activo), señales de desenganche (qué precede el abandono). El nivel de confianza del perfil (0-100) crece con cada sesión. Con personalization_confidence >= 50, el sistema adapta automáticamente la experiencia.'),
  numbered('Language Acquisition Intelligence Engine: El motor más importante del sistema. Define 5 etapas de adquisición específicamente calibradas para hispanohablantes: silent_period, early_production, speech_emergence, intermediate_fluency, advanced_fluency. Cada etapa tiene: descripción del estado, qué hace María en esa etapa, qué triggers indican la siguiente etapa y los insights LATAM únicos de esa fase. Ejemplo: en speech_emergence, el motor sabe que "este es el punto donde más estudiantes latinoamericanos se frustran" y María adapta su estrategia preventivamente.'),

  divider(),

  // ── 5. PROGRAMA ACADÉMICO ──
  h1('5. Estructura Académica del Programa'),
  h2('5.1 Niveles y Metas de Desempeño (Objetivos SMART)'),
  makeTable(
    ['Nivel', 'Conocimiento', 'Meta de Conversación', 'Intensivo', 'Estándar'],
    [
      ['A1 — Your First Steps', '0% a 15%', '6 minutos con angloparlante', '3 meses', '3 meses'],
      ['A2 — Finding Your Voice', '15% a 30%', '12 minutos sin traducir mentalmente', '3 meses', '6 meses'],
      ['B1 — Building Confidence', '30% a 50%', '18 minutos sobre problemas y opiniones', '3 meses', '6 meses'],
      ['B2 — Speaking Without Limits', '50% a 70%', '24 minutos fluido y natural', '3 meses', '6 meses'],
      ['C1 — Owning the Language', '70% a 90%', '30 minutos profesional técnico', '3 meses', '6 meses'],
    ],
    [2400, 1400, 2500, 1300, 1360]
  ),

  h2('5.2 Estructura Diaria del Programa Intensivo'),
  makeTable(
    ['Actividad', 'Tiempo', 'Responsable', 'Estado'],
    [
      ['Videos de lección (5 videos × 8 min)', '40 min', 'Randall (grabación 7 jun 2026)', 'Pendiente'],
      ['Ejercicios interactivos (slides)', '55 min', 'Sistema AcademIA', 'En desarrollo'],
      ['Speaking con María (guiado)', '45 min', 'María IA + estudiante', 'Activo'],
      ['Chat de dudas con María', '20 min', 'María IA + estudiante', 'Activo'],
      ['English Party (sábados)', '60-90 min', 'Randall + María', 'En diseño'],
    ],
    [3000, 1000, 2500, 2460]
  ),
  p('Total diario lunes-viernes: ~2.5-3 horas. Total semanal con English Party: ~16-17 horas.'),
  p('Horas totales para completar A1→C1 en programa intensivo: ~900 horas (estándar CEFR para hispanohablantes).'),

  divider(),

  // ── 6. MODELO DE NEGOCIO ──
  h1('6. Modelo de Negocio y Rentabilidad'),
  h2('6.1 Estructura de Precios'),
  makeTable(
    ['Plan', 'Precio/mes', 'Por persona', 'Usuarios', 'Descuento'],
    [
      ['Intensivo (Individual)', '$49 USD', '$49', '1', '—'],
      ['Familiar', '$120 USD', '$30', 'Hasta 4', '39% vs individual'],
      ['Corporativo', '$350 USD', '$35', 'Hasta 10', '29% vs individual'],
    ],
    [2200, 1500, 1500, 1500, 2260]
  ),

  h2('6.2 Análisis de Costos de IA por Estudiante (45 min speaking/día)'),
  makeTable(
    ['Componente', 'Cálculo', 'Costo/mes'],
    [
      ['Whisper (transcripción)', '45 min × 22 días = 990 min × $0.006/min', '$5.94'],
      ['GPT-4.1-mini (feedback)', '330 intentos × ~800 tokens × $0.0004/1K', '$0.70'],
      ['GPT-4.1-mini (chat)', '220 mensajes × ~800 tokens', '$0.30'],
      ['Storage y bandwidth', 'Estimado', '$0.10'],
      ['TOTAL COSTO IA/ESTUDIANTE', '', '$7.04'],
    ],
    [2800, 4000, 2160]
  ),

  h2('6.3 Proyección de Rentabilidad'),
  makeTable(
    ['Estudiantes', 'Ingreso bruto', 'Costos fijos', 'Costo IA total', 'Utilidad neta', 'Margen'],
    [
      ['10', '$490', '$50', '$70', '$370', '75.5%'],
      ['25', '$1,225', '$50', '$176', '$999', '81.5%'],
      ['50', '$2,450', '$50', '$352', '$2,048', '83.6%'],
      ['100', '$4,900', '$50', '$704', '$4,146', '84.6%'],
      ['200', '$9,800', '$75', '$1,408', '$8,317', '84.9%'],
    ],
    [1500, 1500, 1500, 1500, 1500, 1460]
  ),
  p('Costos fijos: Supabase Pro $25/mes + Vercel $20/mes + dominio y extras $5/mes. Los costos fijos crecen muy lentamente (escalan bien).'),

  h2('6.4 Sistema de Referidos y Afiliados'),
  bullet('Referidos entre estudiantes: código único REF-XXXXXXXX. Referidor gana 100 Chokis + 200 XP. Referido tiene 10% de descuento en el primer mes.'),
  bullet('Afiliados externos: vendedores independientes ganan 10% de comisión del primer pago del estudiante referido.'),
  bullet('Canales de comunicación futuros (pendiente activación): Zetly Mail para emails automáticos. Zetly Mensajero para recordatorios WhatsApp. Zetly Bot para captación de leads en redes sociales.'),

  divider(),

  // ── 7. STACK TECNOLÓGICO ──
  h1('7. Stack Tecnológico Completo'),
  makeTable(
    ['Categoría', 'Tecnología', 'Propósito', 'Costo aprox.'],
    [
      ['Frontend', 'Next.js 14 + React 18', 'Aplicación web completa con SSR y API routes', 'Incluido en Vercel'],
      ['Estilos', 'Tailwind CSS 3', 'Sistema de diseño responsive y mobile-first', 'Gratis'],
      ['Base de datos', 'Supabase PostgreSQL', 'Datos de estudiantes, eventos, progreso', '$25/mes (Pro)'],
      ['Autenticación', 'Supabase Auth', 'Login, registro, sesiones JWT, recovery', 'Incluido en Supabase'],
      ['AI — Chat', 'OpenAI GPT-4.1-mini', 'María Chat, evaluaciones, generación de contenido', '~$7/estudiante/mes'],
      ['AI — Voz', 'OpenAI Whisper-1', 'Transcripción de audio para speaking evaluation', 'Incluido en OpenAI'],
      ['AI — Simple', 'OpenAI GPT-4.1-nano', 'Clasificaciones y tareas simples (model routing)', 'Mínimo'],
      ['Hosting', 'Vercel', 'Deploy automático, CDN global, HTTPS', '$20/mes (Pro)'],
      ['Control de versiones', 'GitHub', 'Repositorio de código, historial de cambios', 'Gratis'],
      ['Pagos', 'Stripe', 'Suscripciones recurrentes, recuperación de pagos', 'Pendiente + 2.9% + $0.30/tx'],
      ['Email', 'Zetly Mail', 'Emails automáticos con correo institucional', 'Incluido en Zetly'],
      ['WhatsApp', 'Zetly Mensajero', 'Recordatorios y nudges por WhatsApp', 'Incluido en Zetly'],
      ['Voz premium', 'ElevenLabs', 'Voz consistente de María (futura)', '~$20/mes'],
      ['Avatar video', 'HeyGen', 'Avatar de María para eventos (2027)', '$29/mes'],
    ],
    [1500, 2200, 3500, 1760]
  ),

  divider(),

  // ── 8. PENDIENTES Y ROADMAP ──
  h1('8. Pendientes y Roadmap'),
  h2('8.1 Pendientes Inmediatos (Junio 2026)'),
  makeTable(
    ['Item', 'Responsable', 'Fecha', 'Impacto'],
    [
      ['Grabación de videos A1 (7 temas × 5 videos)', 'Randall', '7 jun 2026', 'Crítico — sin videos no hay lección completa'],
      ['UI de ejercicios interactivos (carrusel)', 'Desarrollo', '15 jun 2026', 'Crítico — completa el flujo de lección'],
      ['Constitución de sociedad (SRL)', 'Legal', 'Jun 2026', 'Crítico — necesario para facturar'],
      ['Cuenta bancaria empresarial', 'Administración', 'Jun 2026', 'Crítico — necesario para cobrar'],
      ['Activar Stripe con keys reales', 'Desarrollo', 'Post-sociedad', 'Alto — activa cobros automáticos'],
      ['Configurar Zetly Mail con correo empresarial', 'Administración', 'Jun 2026', 'Medio — activa emails automáticos'],
    ],
    [3000, 1500, 1500, 3960]
  ),

  h2('8.2 Roadmap Tecnológico (Q3-Q4 2026)'),
  makeTable(
    ['Feature', 'Descripción', 'Trigger de activación'],
    [
      ['OpenAI Realtime API (voz en tiempo real)', 'María habla y escucha en tiempo real con latencia <800ms', 'Primeros estudiantes en B1'],
      ['Zetly WhatsApp reminders', 'Recordatorios personalizados por WhatsApp', 'Línea WhatsApp Business activa'],
      ['Push notifications (web)', 'Notificaciones en el navegador/celular sin abrir la app', 'VAPID keys configuradas'],
      ['Portugués (2do idioma)', 'Ana — tutora IA de portugués', '100 estudiantes activos o primer B1'],
      ['App nativa (Capacitor)', 'AcademIA en App Store y Google Play', 'Revenue justifica el costo de developer account'],
      ['ElevenLabs voz María', 'Voz consistente y reconocible para María', '50 estudiantes de pago'],
      ['HeyGen avatar video', 'María visible en video para evaluaciones premium', '2027 — ExpoPyme'],
    ],
    [2800, 3500, 2660]
  ),

  divider(),

  // ── 9. VENTAJA COMPETITIVA ──
  h1('9. Ventaja Competitiva — El Moat de AcademIA'),
  p('Los siguientes 5 elementos constituyen la ventaja competitiva estructural de AcademIA. Son imposibles de copiar de la noche a la mañana porque requieren tiempo, datos reales y usuarios reales para desarrollarse.'),

  h2('9.1 Dataset LATAM Propietario'),
  p('Cada sesión de speaking de cada estudiante contribuye al único dataset de aprendizaje de inglés calibrado para hispanohablantes latinoamericanos. Este dataset incluye: errores fonéticos específicos, patrones de interferencia del español, velocidad de adquisición por tipo de error y efectividad de diferentes estrategias de corrección. Con 1,000 estudiantes, este dataset es más valioso que el código mismo.'),

  h2('9.2 Score Propietario AcademIA'),
  p('El score de AcademIA no es el score de GPT. Es un algoritmo calibrado específicamente para hispanohablantes que: (1) no penaliza en exceso errores típicos del español, (2) premia la comunicación exitosa sobre la perfección gramatical, (3) adapta los umbrales al nivel del estudiante y (4) considera la progresión histórica. Ningún competidor tiene esto calibrado para LATAM.'),

  h2('9.3 Sistema de Mastery Multidimensional'),
  p('El sistema de mastery de AcademIA no mide solo si el estudiante sacó buen score una vez. Mide: consistencia del score (no solo promedio), número mínimo de sesiones requeridas por nivel, ausencia de weak_topics confirmados y combinación de todos los factores anteriores. Esto garantiza que el avance de nivel refleje dominio real, no suerte.'),

  h2('9.4 Motor de Adquisición Calibrado para LATAM'),
  p('Las 5 etapas de adquisición del idioma están calibradas con insights específicos de hispanohablantes: por qué se frustran en la etapa de speech_emergence, cómo aprovechar los cognados en early_production, por qué el silencio inicial no es falla sino procesamiento. Esta calibración toma años de observación con estudiantes reales y no puede comprarse.'),

  h2('9.5 Retención Inteligente con Anti-Guilt'),
  p('El motor de retención de AcademIA es el único en el mercado LATAM que: detecta frustración antes de que el estudiante la exprese, adapta automáticamente la dificultad, ajusta el tono de María según el estado emocional y celebra el regreso del estudiante sin culpa. La tasa de retención es el indicador más importante del negocio y este sistema está diseñado específicamente para maximizarla en el contexto cultural latinoamericano.'),

  divider(),

  // ── 10. CONCLUSIÓN ──
  h1('10. Conclusión y Visión'),
  p('AcademIA nació con una pregunta simple: ¿por qué aprender inglés tiene que ser costoso, aburrido y sin garantías de resultado? La respuesta es María.'),
  spacer(),
  p('María es la primera tutora de IA del mercado latinoamericano que combina: la gamificación adictiva de Duolingo, la tutoría personalizada de Open English y la progresión formal certificada de una academia tradicional. Y lo hace a un precio al que cualquier latinoamericano con acceso a internet puede aspirar.'),
  spacer(),
  p('El sistema está construido sobre una premisa pedagógica clara: el core del negocio es el hablar. No la gramática perfecta, no el vocabulario memorizado. Hablar. María escucha, evalúa, corrige y guía a cada estudiante para que llegue al día en que piense en inglés sin esfuerzo.'),
  spacer(),
  p('Los 170 pasos documentados en este manual no son solo código. Son la arquitectura de una plataforma diseñada para ser la academia de idiomas de referencia en Latinoamérica: escalable a múltiples idiomas, imposible de copiar sin tiempo y datos propios, y construida desde el primer día con la mentalidad de una empresa que quiere perdurar.'),
  spacer(),
  p('AcademIA no es un proyecto. Es una empresa con tecnología propia, un modelo de negocio viable, márgenes saludables y una visión clara. El primer estudiante que llegue a C1 con AcademIA no solo habrá aprendido inglés. Habrá demostrado que el modelo funciona.'),
  spacer(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: 'AcademIA — Aprendés inglés de verdad, con una IA que te corrige, te escucha y te entiende.', bold: true, italics: true, size: 26, color: BRAND, font: 'Arial' })]
  }),
  spacer(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Documento confidencial — Versión 1.0 — Junio 2026', size: 20, color: '888888', font: 'Arial' })]
  }),
];

const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: '1B4F72' },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '1B4F72' },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '2C3E50' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'CONFIDENCIAL — Manual Técnico y de Negocio — María AcademIA — Versión 1.0', size: 16, color: '999999', font: 'Arial' })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'AcademIA  |  Página ', size: 18, color: '999999', font: 'Arial' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '999999', font: 'Arial' }),
          new TextRun({ text: ' de ', size: 18, color: '999999', font: 'Arial' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '999999', font: 'Arial' }),
        ]
      })] })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('C:/Users/ruben/Downloads/Manual-Maria-AcademIA-v1.0.docx', buffer);
  console.log('DONE: Manual-Maria-AcademIA-v1.0.docx guardado en Downloads');
}).catch(err => {
  console.error('ERROR:', err.message);
});
