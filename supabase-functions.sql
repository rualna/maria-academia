-- Función para sumar XP y Chokis al estudiante
create or replace function add_student_rewards(
  p_student_id uuid,
  p_xp int default 0,
  p_chokis int default 0
)
returns void
language plpgsql
as $$
begin
  update students
  set
    xp = coalesce(xp, 0) + p_xp,
    chokis = coalesce(chokis, 0) + p_chokis
  where id = p_student_id;
end;
$$;
