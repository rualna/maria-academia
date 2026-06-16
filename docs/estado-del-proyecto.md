# AcademIA / maria-backend — Estado del proyecto (mapa de retorno)

> **Pausa:** junio 2026 · **Retomo previsto:** enero 2027
> Documento para volver sin reconstruir de memoria. Honesto: distingue lo que **funciona de verdad** de lo que está **escrito pero no cableado**.

---

## ⚡ TL;DR — lo primero al volver
1. **🔴 Restaurar Supabase.** Es free tier; tras meses de inactividad el proyecto queda **PAUSADO**. Entrá al dashboard de Supabase y **restaurá el proyecto** ANTES que nada, o la app no levanta (todos los endpoints fallan).
2. **🔴 Revisar OpenAI** (API key válida + cargos del período). Es el único costo corriendo de verdad.
3. `git pull`, `npm install` (node_modules no está en git), `npm run build` para validar que sigue compilando.
4. Confirmar que la prod sigue viva: https://maria-academia-dun.vercel.app

---

## 1. Estado del repo
- **Repo:** GitHub `rualna/maria-academia`
- **Rama:** `main` · **Último commit:** `4799584` — *Wire XP/Chokis awarding on chat and speaking activity*
- **Todo pusheado** (working tree limpio al pausar).
- **Producción (Vercel):** proyecto `academ-ia-s-projects/maria-academia`, plan **Hobby (gratis)**, Node **24.x**, auto-deploy desde `main`.
  - URL: **https://maria-academia-dun.vercel.app**
  - ⚠️ `maria-academia.vercel.app` (sin `-dun`) es **otra app vieja en francés, ajena** — ignorar.
- Commits clave (de viejo a nuevo): primer commit → app completa (`dc275d5`) → fix build (`1a7122b`) → RLS+docs (`846b2dd`) → hardening JWT (`6dd551e`) → dashboard (`87d6779`) → XP/Chokis (`4799584`).

---

## 2. Arquitectura
- **Stack:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind 4 · Supabase (Postgres + Auth) · OpenAI (chat + Whisper).
- **Auth:** Supabase Auth (email/password). El front usa el cliente JS (JWT en el browser). Los endpoints del camino vivo validan ese JWT (`src/lib/auth.ts`).
- **Carpetas clave:**
  - `src/app/` — páginas: `/` (dashboard), `/chat` (María), `/speaking`, `/login`, `/forgot-password`, `/update-password`.
  - `src/app/api/` — 33 endpoints (pocos vivos, ver abajo).
  - `src/lib/` — motores: `auth.ts`, `dashboard.ts`, `rewards.ts`, `economy.ts`, `maria-context.ts`, `maria-knowledge.ts`, `ai-orchestrator.ts`, `retention-engine.ts`, `language-config.ts`, etc.
  - `supabase/` — `schema.sql` (estructura real) + `rls-policies.sql` (RLS idempotente).
  - `docs/` — este doc + `variables-de-entorno.md` + `auth-confirmacion-email.md`.

### Endpoints VIVOS (los llama el front, validan JWT, operan sobre el dueño del token)
| Endpoint | Qué hace |
|---|---|
| `POST /api/create-student` | Alta del perfil en `students` (id/email del JWT). Idempotente. |
| `GET /api/dashboard` | Datos del dashboard: XP, Chokis, racha, cursos por nivel, idiomas. |
| `GET /api/missions` | Misión de speaking (frases reales A1, viven en `maria-context.ts`). |
| `GET /api/chat-history` | Historial de chat (de `student_events`). |
| `GET /api/speaking-progress` | Stats de speaking (prácticas, promedio, mejor, racha). |
| `POST /api/transcribe` | Whisper-1 (audio→texto, **forzado a inglés** `language:'en'`). |
| `POST /api/speaking-feedback` | Evalúa speaking (gpt-4.1-mini) + **otorga XP/Chokis**. |
| `POST /api/maria` | Chat con María (OpenAI) + **otorga XP** + tono por retención. |

### Modelos de IA (reales, en el código)
- Chat / evaluación: `gpt-4.1-mini` · simple: `gpt-4.1-nano` · complejo: `gpt-4.1` (familia GPT-4.1, NO gpt-4o).
- Transcripción: `whisper-1`.
- TTS de María: `SpeechSynthesis` del navegador (gratis). ElevenLabs/HeyGen = solo config, sin cablear.
- Nota: solo `/api/maria` pasa por el orchestrator (`ai-orchestrator.ts`); el resto instancia OpenAI directo.

---

## 3. Base de datos (Supabase, proyecto cloud)
- **18 tablas reales**, **RLS activo en las 18** (lectura "solo lo mío" en las personales; escrituras vía service_role en el backend). Policies en `supabase/rls-policies.sql`.
- **Estructura fiel:** `supabase/schema.sql` (capturado por introspección — es la fuente reproducible si se pierde Supabase).
- **Conteo real al pausar** (jun 2026):

| Tabla | Filas | |
|---|---|---|
| `students` | 1 | la cuenta del fundador |
| `student_events` | 53 | chat + speaking + rewards (fuente de verdad de actividad) |
| `student_speaking_attempts` | 33 | intentos de speaking con score |
| `lessons_catalog` | 20 | currículo A1 mes 1 (semilla) |
| `speaking_missions` | 3 | headers de misión (semilla) |
| `student_behavioral_profile` | 1 | |
| resto (lesson_progress, exercise_attempts, monthly_exams, badges, notifications_queue, learning_profile, y las "fantasma") | 0 | features escritas pero nunca ejercitadas |

### ⚠️ Drifts conocidos (importante)
- **`students` NO tiene la columna `current_language`** (ni `completed_languages`), aunque el manual/migraciones las mencionan. → rompe `/api/language-settings` y hay que **agregarla antes de activar portugués**. (El dashboard ya lo esquiva: defaultea a `'en'`.)
- **7 tablas "fantasma"** vacías por drift histórico: `lessons` (vs `lessons_catalog`), `student_missions` (vs `speaking_missions`), `student_progress`, `student_sessions`, `student_skill_profile`, `student_learning_profile`, `student_video_events`. Candidatas a auditar/limpiar.
- **Migraciones duplicadas** en la raíz: `supabase-migration-v2.sql` y `supabase-migration-motor-pedagogico.sql` crean tablas iguales (correr ambas falla). La fuente buena es `supabase/schema.sql`.
- **`language-config.ts`** lista Japonés (`ja`) como 5º idioma, pero el orden de negocio era inglés→portugués→francés→italiano→**alemán**. Alinear cuando se revele el resto.

---

## 4. Qué FUNCIONA hoy de verdad vs. qué está escrito pero NO cableado

### ✅ Funciona y verificado en producción
- **Registro/login** (confirmación de email OFF → entra directo).
- **Dashboard** con datos reales del estudiante (XP, Chokis, racha, cursos, idiomas).
- **Chat con María** (OpenAI) — responde, adapta tono por retención.
- **Speaking**: graba → Whisper transcribe (inglés) → gpt-4.1-mini evalúa (score, gramática, fluidez, pronunciación, versión corregida).
- **XP/Chokis suman con la actividad real** (chat +2 XP; speaking +10 XP +1 Choki Hábito, +bonus XP/Chokis Logro si score alto), con **topes diarios anti-farm**. Config en `src/lib/economy.ts` (números provisionales, calibrar en piloto).
- **RLS + endpoints endurecidos**: un usuario solo ve/opera sobre SUS datos; sin token → 401.
- **Racha** del dashboard = días consecutivos con práctica de speaking (real).

### ⚠️ Escrito pero NO cableado / nunca ejercitado
- **Gamificación vieja** (`/api/gamification`, badges, `students.streak_days`): legacy, no la llama nadie. `economy.ts` es el canónico ahora. `student_badges` vacío.
- **Exámenes** mensual/trimestral/final (`monthly-exam`, `quarterly-exam`, `graduation-exam`): endpoints existen, **sin UI**, tablas vacías. La voz en tiempo real (`/api/realtime`) es solo texto.
- **Misiones adaptativas** (`daily-mission`, `weekly-mission`): GPT, no cableadas.
- **Flujo de lección** (video→ejercicio→speaking): **no existe player de video ni UI de ejercicios**; `student_lesson_progress` vacío → progreso de cursos siempre 0%.
- **Nudges/notificaciones** (`notifications`, `communications`): sin scheduler, cola vacía.
- **Referidos / Chokis "Negocio"** (`referrals`): sin cablear (los Chokis que más pagan, a futuro).
- **Pagos** (`subscriptions`, Stripe): stub. **ElevenLabs/HeyGen**: stub.
- **~15 endpoints no-cableados** (exámenes, misiones, study-plan, etc.) **todavía confían en el `student_id` del body** (no endurecidos). No están expuestos en el front, pero hay que endurecerlos antes de exponerlos.
- **Endpoints admin** (`/api/ops`, `/api/admin-dashboard`): **abiertos**, necesitan auth de admin.

---

## 5. Config sensible (variables, dónde, costos)

### Variables de entorno (SIN valores acá; los valores viven en `.env.local` local y en Vercel)
**Obligatorias (la app no anda sin estas):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_SITE_URL`

**Opcionales / no usadas hoy:** `STRIPE_SECRET_KEY`, `RESEND_API_KEY`
**Solo local (no van a Vercel):** `DATABASE_URL` (scripts de schema/RLS), `VERCEL_TOKEN` (deploy por CLI — **revocar si no se hizo**)

**Dónde están seteadas:**
- **Vercel (Production):** las 5 obligatorias ✓. Quedaron además 2 viejas mal nombradas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) **inútiles** — se pueden borrar.
- **Supabase dashboard:** confirmación de email **OFF** (piloto — revertir a ON para lanzamiento, ver `docs/auth-confirmacion-email.md`); RLS ON; **verificar** que el Site URL + Redirect URLs (allowlist para reset de contraseña) estén cargados con la URL de prod.
- **Local:** `.env.local` (gitignoreado — nunca se subió; contiene las claves + `DATABASE_URL` + quizá `VERCEL_TOKEN`).

### Servicios con costo (revisar cargos al volver)
- **OpenAI** — único costo corriendo: pay-per-use (gpt-4.1-mini chat+eval + Whisper). **Whisper es el dominante** (~$0.006/min). Revisar billing del período de pausa.
- **Supabase** — free tier ($0). **Se pausa por inactividad** (ver TL;DR).
- **Vercel** — Hobby ($0).
- Stripe / Resend / ElevenLabs / HeyGen — **no activos**, sin cargo.

---

## 6. Lo que estaba a medio hacer / pendiente inmediato al pausar
1. 🎨 **Look del dashboard** con el diseño de WordPress (estaba diferido para "un paso aparte"). Pasar el diseño y ajustarlo.
2. 💼 **Referidos + Chokis Negocio** (sin cablear).
3. 📹 **Flujo de lección** (video player + ejercicios de grammar/listening) y su XP/progreso → es lo que destraba `student_lesson_progress` y los cursos.
4. 🔒 **Endurecer los ~15 endpoints no-cableados** + **auth de admin** (`ops`, `admin-dashboard` abiertos). El helper `getAuthUser` ya existe → es mecánico.
5. 🗃️ **Agregar `current_language` a `students`** (para portugués + arreglar `language-settings`).
6. 🧹 Reconciliar `gamification` legacy vs `economy.ts`; auditar tablas fantasma; limpiar migraciones duplicadas.
7. 🔑 **Revocar el `VERCEL_TOKEN`** (vercel.com/account/tokens) si no se hizo.
8. ✉️ Verificar allowlist de Supabase para el reset de contraseña.

---

## 7. Riesgos / cuidados al retomar
- **🔴 Supabase pausado** (free tier, inactividad) → la app falla hasta restaurar el proyecto. **Es lo primero a revisar.**
- **🔴 OpenAI** → la API key podría haber rotado/expirado o tener límites; revisar validez y cargos antes de probar.
- **🟡 Confirmación de email OFF** → recordar volverla ON (con SMTP real) antes de cualquier lanzamiento público, o cualquiera se registra con emails ajenos.
- **🟡 Dependencias:** `node_modules` no está en git → `npm install`. `pg` se instaló con `--no-save` para los scripts de schema → reinstalar si hace falta (`npm i pg --no-save`). Next 16 / paquetes pueden tener updates; correr `npm run build` para detectar roturas.
- **🟡 Vercel:** el deploy sigue publicado, pero si Supabase está pausado dará errores. Tras restaurar, un redeploy no es necesario (las env vars persisten) salvo que cambies `NEXT_PUBLIC_SITE_URL` (es build-time).
- **🟡 Secretos locales:** `.env.local` tiene la `DATABASE_URL` con la password de Postgres y (quizá) el `VERCEL_TOKEN`. Está gitignoreado, pero rotá lo que convenga.
- **🟢 Reproducibilidad:** si Supabase se perdiera, `supabase/schema.sql` + `supabase/rls-policies.sql` recrean estructura + RLS (faltaría el contenido semilla de `lessons_catalog`/`speaking_missions`).
- **🟢 Números de economía** (`economy.ts`) son provisionales — recalibrar con datos del piloto.

---

*Generado al pausar el proyecto (jun 2026). Mantener actualizado si algo cambia antes de enero 2027.*
