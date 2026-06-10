-- MIGRACIÓN: Bloque 4 — Language OS
alter table students
  add column if not exists current_language text default 'en',
  add column if not exists completed_languages text[] default '{}';
