-- ============================================================
-- MIGRACIÓN: Bloque 3 — Retention Engine
-- ============================================================

-- Badges ganados por estudiante
create table if not exists student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  badge_id text not null,
  badge_name text not null,
  badge_emoji text default '🏆',
  earned_at timestamptz default now(),
  unique(student_id, badge_id)
);

-- Cola de notificaciones (reminders, nudges, emails)
create table if not exists notifications_queue (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  type text not null, -- 'reminder' | 'nudge' | 'email' | 'whatsapp' | 'celebration'
  channel text not null, -- 'email' | 'whatsapp' | 'in_app'
  subject text,
  message text not null,
  scheduled_for timestamptz default now(),
  sent boolean default false,
  sent_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Perfil de comportamiento del estudiante
create table if not exists student_behavioral_profile (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade unique,
  personality_type text default 'explorer', -- 'explorer'|'achiever'|'social'|'independent'
  motivation_score int default 50,          -- 0-100
  frustration_level int default 0,          -- 0-100
  burnout_risk int default 0,               -- 0-100
  dropout_risk int default 0,               -- 0-100
  best_study_hour int,                      -- hora del día con mejor performance
  avg_session_gap_days float default 1,     -- promedio de días entre sesiones
  last_analyzed timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agregar campos de gamificación a students si no existen
alter table students
  add column if not exists level_title text default 'Beginner',
  add column if not exists streak_freeze_available int default 1,
  add column if not exists longest_streak int default 0,
  add column if not exists total_study_minutes int default 0,
  add column if not exists last_active_at timestamptz default now();
