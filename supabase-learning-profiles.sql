-- ============================================================
-- MIGRACIÓN: Sistema de Detección de Perfiles de Aprendizaje
-- AcademIA — Junio 2026
-- ============================================================

create table if not exists student_learning_profile (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade unique,

  -- ── ACTIVACIONES DE PERFIL ──
  reading_support_mode      boolean default false,  -- Perfil 1: dislexia
  short_session_mode        boolean default false,  -- Perfil 2: TDAH
  audio_support_mode        boolean default false,  -- Perfil 3: auditivo
  low_stakes_speaking_mode  boolean default false,  -- Perfil 4: ansiedad speaking

  -- ── ADAPTACIONES ACTIVAS ──
  time_multiplier           numeric default 1.0,
  default_audio_speed       numeric default 1.0,
  show_transcript_option    boolean default false,
  max_exercise_length       int default 5,
  reminder_frequency        int default 1,
  first_attempt_no_score    boolean default false,
  show_numeric_score        boolean default true,
  preferred_modality        text,

  -- ── MÉTRICAS 7 DÍAS (calculadas por evaluateLearningProfile) ──
  avg_session_duration_7d       numeric,
  writing_avg_score_7d          numeric,
  speaking_avg_score_7d         numeric,
  grammar_avg_score_7d          numeric,
  listening_avg_score_7d        numeric,
  avg_audio_rewatch_count_7d    numeric,
  mid_session_abandoned_rate_7d numeric,
  speaking_attempts_per_day_7d  numeric,
  session_ends_before_speaking_7d numeric,

  -- ── CONFIANZA Y CONTROL ──
  profile_confidence  int default 0,
  last_evaluated_at   timestamptz default now(),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
