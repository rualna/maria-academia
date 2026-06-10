-- ============================================================
-- MIGRACIÓN: Motor Pedagógico AcademIA — Mes 1
-- Correr en Supabase SQL Editor
-- ============================================================

-- 1. Tabla: student_video_events
create table if not exists student_video_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  lesson_id text,
  video_second_paused int,
  video_second_exited int,
  rewatch_count int default 0,
  completion_pct int default 0,
  total_watch_minutes int default 0,
  created_at timestamptz default now()
);

-- 2. Tabla: student_exercise_attempts
create table if not exists student_exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  exercise_id text,
  lesson_id text,
  week int,
  time_spent_seconds int default 0,
  attempts_count int default 1,
  final_score int default 0,
  abandoned boolean default false,
  stuck_flag boolean default false,
  created_at timestamptz default now()
);

-- 3. Tabla: student_lesson_progress (control de avance por lección)
create table if not exists student_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  lesson_id text not null,
  week int not null,
  month int default 1,
  video_completion_pct int default 0,
  exercise_score int default 0,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(student_id, lesson_id)
);

-- 4. Tabla: student_monthly_exams
create table if not exists student_monthly_exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  month int not null,
  attempt_number int default 1,
  speaking_score int default 0,
  grammar_score int default 0,
  listening_score int default 0,
  writing_score int default 0,
  global_score int default 0,
  passed boolean default false,
  mode text default 'normal', -- 'normal', 'review_mode', 'rescue_plan'
  created_at timestamptz default now()
);

-- 5. Agregar columnas a student_progress (si existe)
alter table student_progress
  add column if not exists current_week int default 1,
  add column if not exists current_month int default 1,
  add column if not exists month_exam_passed boolean default false,
  add column if not exists weak_topics text[] default '{}',
  add column if not exists avg_session_minutes int default 0,
  add column if not exists last_session_at timestamptz;

-- 6. Agregar columnas a students (XP y Chokis si no existen)
alter table students
  add column if not exists xp int default 0,
  add column if not exists chokis int default 0,
  add column if not exists streak_days int default 0;

-- ============================================================
-- DATOS INICIALES: Lecciones del Mes 1 A1
-- ============================================================

create table if not exists lessons_catalog (
  id text primary key,
  level text not null,
  month int not null,
  week int not null,
  lesson_order int not null,
  title text not null,
  grammar text[],
  vocabulary text[],
  speaking_goal text,
  created_at timestamptz default now()
);

insert into lessons_catalog (id, level, month, week, lesson_order, title, grammar, vocabulary, speaking_goal) values
-- Semana 1
('a1-m1-w1-l1','A1',1,1,1,'What''s your name?',ARRAY['Verb BE (I am)','Possessives: my, your'],ARRAY['Hello, Hi, Good morning','What''s your name?','My name is...'],'Presentarse con nombre completo'),
('a1-m1-w1-l2','A1',1,1,2,'Greetings & goodbyes',ARRAY['Verb BE informal','Contractions: I''m, you''re'],ARRAY['Hi, Bye, See you','Nice to meet you','Good night'],'Saludar y despedirse natural'),
('a1-m1-w1-l3','A1',1,1,3,'Alphabet & spelling',ARRAY['Subject pronouns: I, you, he, she'],ARRAY['Alphabet A-Z','Spell your name','Letters and sounds'],'Deletrear nombre y apellido'),
('a1-m1-w1-l4','A1',1,1,4,'Numbers 0–10',ARRAY['Verb BE: numbers context'],ARRAY['Zero to ten','Phone numbers','How many?'],'Decir número de teléfono'),
-- Semana 2
('a1-m1-w2-l5','A1',1,2,5,'Classroom objects',ARRAY['Articles: a, an, the','Plurals regulares'],ARRAY['Pen, book, bag, chair, desk, phone, board'],'Identificar 5 objetos del cuarto'),
('a1-m1-w2-l6','A1',1,2,6,'This / That / These / Those',ARRAY['Demonstratives','Verb BE: affirmative/negative'],ARRAY['This, that, these, those','Near, far'],'Describir objetos cercanos y lejanos'),
('a1-m1-w2-l7','A1',1,2,7,'Plurals',ARRAY['Plural rules: -s, -es, -ies','Irregular plurals'],ARRAY['Books, boxes, children, people'],'Pluralizar 10 palabras correctamente'),
('a1-m1-w2-l8','A1',1,2,8,'Countries & nationalities',ARRAY['Verb BE: questions yes/no','Wh-questions: Where, Who'],ARRAY['Costa Rican, American, Mexican, Spanish, French'],'Decir país y nacionalidad, preguntar la del otro'),
('a1-m1-w2-l9','A1',1,2,9,'Ages',ARRAY['Verb BE: How old','Numbers 11-30'],ARRAY['Years old, young, old, teenager, adult'],'Decir y preguntar edades'),
-- Semana 3
('a1-m1-w3-l10','A1',1,3,10,'Time & clock',ARRAY['Simple Present: time','Prepositions: at, in, around'],ARRAY['O''clock, half past, quarter to','Morning, afternoon, evening'],'Decir la hora actual y rutina'),
('a1-m1-w3-l11','A1',1,3,11,'Daily routines',ARRAY['Simple Present: I/she/he','Adverbs: always, usually, sometimes, never'],ARRAY['Wake up, eat breakfast, go to work, come home, sleep'],'Describir rutina diaria en 5 oraciones'),
('a1-m1-w3-l12','A1',1,3,12,'Transportation',ARRAY['Go by + transport','How long does it take?'],ARRAY['Bus, car, train, walk, taxi, bike'],'Decir cómo llega al trabajo/escuela'),
('a1-m1-w3-l13','A1',1,3,13,'Jobs & occupations',ARRAY['Verb BE: I am a...','Simple Present: work at'],ARRAY['Doctor, teacher, student, cook, driver, nurse'],'Presentar profesión y lugar de trabajo'),
('a1-m1-w3-l14','A1',1,3,14,'Food basics',ARRAY['Simple Present: eat, drink, like','Frequency: for breakfast, for lunch'],ARRAY['Rice, beans, chicken, water, coffee, fruit, bread'],'Describir lo que come en el día'),
('a1-m1-w3-l15','A1',1,3,15,'Sports & abilities (can)',ARRAY['Can / Can''t','Yes I can / No I can''t'],ARRAY['Play soccer, swim, run, dance, sing, read'],'Decir 3 cosas que puede y 3 que no puede hacer'),
-- Semana 4
('a1-m1-w4-l16','A1',1,4,16,'Going to (future plans)',ARRAY['Be going to + infinitive','This weekend, tomorrow, next week'],ARRAY['Visit, travel, study, rest, go out, cook'],'Hablar de 3 planes para el fin de semana'),
('a1-m1-w4-l17','A1',1,4,17,'Invitations',ARRAY['Would you like to...?','Let''s... / How about...?'],ARRAY['Join, together, maybe, sure, sorry I can''t'],'Invitar a alguien y aceptar/rechazar'),
('a1-m1-w4-l18','A1',1,4,18,'Body & health',ARRAY['I have a... ache','I need to + verb'],ARRAY['Head, arm, leg, stomach, back, fever, cold, pharmacy'],'Describir un síntoma y qué necesita'),
('a1-m1-w4-l19','A1',1,4,19,'Places & prepositions',ARRAY['There is / There are','Prepositions: next to, between, behind, in front of'],ARRAY['Hospital, school, park, store, bank, restaurant'],'Describir dónde están 3 lugares de su barrio'),
('a1-m1-w4-l20','A1',1,4,20,'Directions básicas',ARRAY['Imperatives: Go straight, Turn left/right','How do I get to...?'],ARRAY['Left, right, straight, corner, block, traffic light'],'Dar instrucciones para llegar a un lugar cercano')
on conflict (id) do nothing;
