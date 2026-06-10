-- MIGRACIÓN: Bloque 6 — Business System
alter table students
  add column if not exists subscription_plan text default 'free',
  add column if not exists subscription_status text default 'inactive',
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists team_id text;
