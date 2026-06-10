-- ============================================================
-- AcademIA — Row Level Security (RLS)
-- ------------------------------------------------------------
-- Idempotente: se puede correr múltiples veces sin romper nada.
-- Modelo:
--   * Tablas personales (15): cada estudiante LEE solo SUS filas.
--   * Contenido compartido (3): legible para cualquier autenticado.
--   * Sin policies de escritura desde el cliente: todas las escrituras
--     pasan por el backend con service_role, que IGNORA RLS.
-- ============================================================

-- =================== TABLAS PERSONALES ======================
-- Lectura "solo lo mío".

-- students: pertenencia por id (= auth.uid())
alter table public.students enable row level security;
drop policy if exists "read own profile" on public.students;
create policy "read own profile" on public.students
  for select to authenticated using (auth.uid() = id);

-- El resto: pertenencia por student_id (= auth.uid())
alter table public.student_events enable row level security;
drop policy if exists "read own rows" on public.student_events;
create policy "read own rows" on public.student_events
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_speaking_attempts enable row level security;
drop policy if exists "read own rows" on public.student_speaking_attempts;
create policy "read own rows" on public.student_speaking_attempts
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_lesson_progress enable row level security;
drop policy if exists "read own rows" on public.student_lesson_progress;
create policy "read own rows" on public.student_lesson_progress
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_exercise_attempts enable row level security;
drop policy if exists "read own rows" on public.student_exercise_attempts;
create policy "read own rows" on public.student_exercise_attempts
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_monthly_exams enable row level security;
drop policy if exists "read own rows" on public.student_monthly_exams;
create policy "read own rows" on public.student_monthly_exams
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_badges enable row level security;
drop policy if exists "read own rows" on public.student_badges;
create policy "read own rows" on public.student_badges
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_behavioral_profile enable row level security;
drop policy if exists "read own rows" on public.student_behavioral_profile;
create policy "read own rows" on public.student_behavioral_profile
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_learning_profile enable row level security;
drop policy if exists "read own rows" on public.student_learning_profile;
create policy "read own rows" on public.student_learning_profile
  for select to authenticated using (auth.uid() = student_id);

alter table public.notifications_queue enable row level security;
drop policy if exists "read own rows" on public.notifications_queue;
create policy "read own rows" on public.notifications_queue
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_missions enable row level security;
drop policy if exists "read own rows" on public.student_missions;
create policy "read own rows" on public.student_missions
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_progress enable row level security;
drop policy if exists "read own rows" on public.student_progress;
create policy "read own rows" on public.student_progress
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_sessions enable row level security;
drop policy if exists "read own rows" on public.student_sessions;
create policy "read own rows" on public.student_sessions
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_skill_profile enable row level security;
drop policy if exists "read own rows" on public.student_skill_profile;
create policy "read own rows" on public.student_skill_profile
  for select to authenticated using (auth.uid() = student_id);

alter table public.student_video_events enable row level security;
drop policy if exists "read own rows" on public.student_video_events;
create policy "read own rows" on public.student_video_events
  for select to authenticated using (auth.uid() = student_id);

-- =================== CONTENIDO COMPARTIDO ===================
-- Legible para cualquier autenticado. Sin escritura desde el cliente.

alter table public.lessons_catalog enable row level security;
drop policy if exists "read for authenticated" on public.lessons_catalog;
create policy "read for authenticated" on public.lessons_catalog
  for select to authenticated using (true);

alter table public.speaking_missions enable row level security;
drop policy if exists "read for authenticated" on public.speaking_missions;
create policy "read for authenticated" on public.speaking_missions
  for select to authenticated using (true);

alter table public.lessons enable row level security;
drop policy if exists "read for authenticated" on public.lessons;
create policy "read for authenticated" on public.lessons
  for select to authenticated using (true);
