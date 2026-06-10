-- ============================================================
-- AcademIA / maria-backend — Schema de Supabase (estructura)
-- Captura FIEL del estado real del schema "public" (drift incluido).
-- SOLO ESTRUCTURA — no contiene datos de estudiantes.
-- Generado por introspección directa del catálogo de Postgres.
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE "public"."lessons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "level" text NOT NULL,
  "module_name" text,
  "lesson_order" bigint,
  "lesson_title" text,
  "allowed_topics" text,
  "allowed_grammar" text,
  "allowed_vocab" text,
  "blocked_topics" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."lessons_catalog" (
  "id" text NOT NULL,
  "level" text NOT NULL,
  "month" integer NOT NULL,
  "week" integer NOT NULL,
  "lesson_order" integer NOT NULL,
  "title" text NOT NULL,
  "grammar" text[],
  "vocabulary" text[],
  "speaking_goal" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."notifications_queue" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "type" text NOT NULL,
  "channel" text NOT NULL,
  "subject" text,
  "message" text NOT NULL,
  "scheduled_for" timestamp with time zone DEFAULT now(),
  "sent" boolean DEFAULT false,
  "sent_at" timestamp with time zone,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."speaking_missions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text,
  "description" text,
  "target_level" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_badges" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "badge_id" text NOT NULL,
  "badge_name" text NOT NULL,
  "badge_emoji" text DEFAULT '🏆'::text,
  "earned_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_behavioral_profile" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "personality_type" text DEFAULT 'explorer'::text,
  "motivation_score" integer DEFAULT 50,
  "frustration_level" integer DEFAULT 0,
  "burnout_risk" integer DEFAULT 0,
  "dropout_risk" integer DEFAULT 0,
  "best_study_hour" integer,
  "avg_session_gap_days" double precision DEFAULT 1,
  "last_analyzed" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "event_type" text,
  "level" text,
  "module_name" text,
  "lesson_id" uuid,
  "skill" text,
  "score" bigint,
  "event_data" jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_exercise_attempts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "exercise_id" text,
  "lesson_id" text,
  "week" integer,
  "time_spent_seconds" integer DEFAULT 0,
  "attempts_count" integer DEFAULT 1,
  "final_score" integer DEFAULT 0,
  "abandoned" boolean DEFAULT false,
  "stuck_flag" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_learning_profile" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "reading_support_mode" boolean DEFAULT false,
  "short_session_mode" boolean DEFAULT false,
  "audio_support_mode" boolean DEFAULT false,
  "low_stakes_speaking_mode" boolean DEFAULT false,
  "time_multiplier" numeric DEFAULT 1.0,
  "default_audio_speed" numeric DEFAULT 1.0,
  "show_transcript_option" boolean DEFAULT false,
  "max_exercise_length" integer DEFAULT 5,
  "reminder_frequency" integer DEFAULT 1,
  "first_attempt_no_score" boolean DEFAULT false,
  "show_numeric_score" boolean DEFAULT true,
  "preferred_modality" text,
  "avg_session_duration_7d" numeric,
  "writing_avg_score_7d" numeric,
  "speaking_avg_score_7d" numeric,
  "grammar_avg_score_7d" numeric,
  "listening_avg_score_7d" numeric,
  "avg_audio_rewatch_count_7d" numeric,
  "mid_session_abandoned_rate_7d" numeric,
  "speaking_attempts_per_day_7d" numeric,
  "session_ends_before_speaking_7d" numeric,
  "profile_confidence" integer DEFAULT 0,
  "last_evaluated_at" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_lesson_progress" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "lesson_id" text NOT NULL,
  "week" integer NOT NULL,
  "month" integer DEFAULT 1,
  "video_completion_pct" integer DEFAULT 0,
  "exercise_score" integer DEFAULT 0,
  "completed" boolean DEFAULT false,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_missions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "mission_id" uuid,
  "completed" boolean DEFAULT false,
  "score" integer,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_monthly_exams" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "month" integer NOT NULL,
  "attempt_number" integer DEFAULT 1,
  "speaking_score" integer DEFAULT 0,
  "grammar_score" integer DEFAULT 0,
  "listening_score" integer DEFAULT 0,
  "writing_score" integer DEFAULT 0,
  "global_score" integer DEFAULT 0,
  "passed" boolean DEFAULT false,
  "mode" text DEFAULT 'normal'::text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_progress" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "lesson_id" uuid,
  "completed" boolean,
  "speaking_score" bigint,
  "writing_score" bigint,
  "listening_score" bigint,
  "fluency_minutes" integer,
  "xp_earned" bigint,
  "completed_at" timestamp with time zone DEFAULT now(),
  "current_week" integer DEFAULT 1,
  "current_month" integer DEFAULT 1,
  "month_exam_passed" boolean DEFAULT false,
  "weak_topics" text[] DEFAULT '{}'::text[],
  "avg_session_minutes" integer DEFAULT 0,
  "last_session_at" timestamp with time zone
);

CREATE TABLE "public"."student_sessions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "session_start" timestamp with time zone,
  "session_end" timestamp with time zone,
  "duration_seconds" bigint,
  "device_type" text,
  "page_started" text,
  "page_ended" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_skill_profile" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "target_language" text,
  "level" text,
  "speaking_score" bigint,
  "listening_score" bigint,
  "writing_score" bigint,
  "reading_score" bigint,
  "pronunciation_score" bigint,
  "retention_score" bigint,
  "mastery_score" bigint,
  "weak_topics" jsonb,
  "strong_topics" jsonb,
  "repeated_errors" jsonb,
  "pronunciation_issues" jsonb,
  "last_updated" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_speaking_attempts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "mission_id" uuid,
  "transcript" text,
  "score" integer,
  "feedback" jsonb,
  "audio_url" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."student_video_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid,
  "lesson_id" text,
  "video_second_paused" integer,
  "video_second_exited" integer,
  "rewatch_count" integer DEFAULT 0,
  "completion_pct" integer DEFAULT 0,
  "total_watch_minutes" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "public"."students" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "full_name" text NOT NULL,
  "email" text,
  "current_level" text,
  "current_module" text,
  "xp" bigint,
  "chokis" bigint,
  "streak_days" bigint,
  "fluency_score" bigint,
  "created_at" timestamp with time zone DEFAULT now(),
  "level_title" text DEFAULT 'Beginner'::text,
  "streak_freeze_available" integer DEFAULT 1,
  "longest_streak" integer DEFAULT 0,
  "total_study_minutes" integer DEFAULT 0,
  "last_active_at" timestamp with time zone DEFAULT now(),
  "subscription_plan" text DEFAULT 'free'::text,
  "subscription_status" text DEFAULT 'inactive'::text,
  "subscription_expires_at" timestamp with time zone,
  "team_id" text
);

-- ============================================================
-- CONSTRAINTS (PK / UNIQUE / FK / CHECK)
-- ============================================================

ALTER TABLE "public"."lessons" ADD CONSTRAINT "lessons_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."lessons_catalog" ADD CONSTRAINT "lessons_catalog_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."notifications_queue" ADD CONSTRAINT "notifications_queue_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."notifications_queue" ADD CONSTRAINT "notifications_queue_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE "public"."speaking_missions" ADD CONSTRAINT "speaking_missions_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_badges" ADD CONSTRAINT "student_badges_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_badges" ADD CONSTRAINT "student_badges_student_id_badge_id_key" UNIQUE (student_id, badge_id);
ALTER TABLE "public"."student_badges" ADD CONSTRAINT "student_badges_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE "public"."student_behavioral_profile" ADD CONSTRAINT "student_behavioral_profile_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_behavioral_profile" ADD CONSTRAINT "student_behavioral_profile_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE "public"."student_behavioral_profile" ADD CONSTRAINT "student_behavioral_profile_student_id_key" UNIQUE (student_id);
ALTER TABLE "public"."student_events" ADD CONSTRAINT "student_events_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_exercise_attempts" ADD CONSTRAINT "student_exercise_attempts_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_exercise_attempts" ADD CONSTRAINT "student_exercise_attempts_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE "public"."student_learning_profile" ADD CONSTRAINT "student_learning_profile_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_learning_profile" ADD CONSTRAINT "student_learning_profile_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE "public"."student_learning_profile" ADD CONSTRAINT "student_learning_profile_student_id_key" UNIQUE (student_id);
ALTER TABLE "public"."student_lesson_progress" ADD CONSTRAINT "student_lesson_progress_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_lesson_progress" ADD CONSTRAINT "student_lesson_progress_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE "public"."student_lesson_progress" ADD CONSTRAINT "student_lesson_progress_student_id_lesson_id_key" UNIQUE (student_id, lesson_id);
ALTER TABLE "public"."student_missions" ADD CONSTRAINT "student_missions_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_missions" ADD CONSTRAINT "student_missions_mission_id_fkey" FOREIGN KEY (mission_id) REFERENCES speaking_missions(id);
ALTER TABLE "public"."student_monthly_exams" ADD CONSTRAINT "student_monthly_exams_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_monthly_exams" ADD CONSTRAINT "student_monthly_exams_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE "public"."student_progress" ADD CONSTRAINT "student_progress_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_sessions" ADD CONSTRAINT "student_sessions_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_skill_profile" ADD CONSTRAINT "student_skill_profile_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_speaking_attempts" ADD CONSTRAINT "student_speaking_attempts_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_speaking_attempts" ADD CONSTRAINT "student_speaking_attempts_mission_id_fkey" FOREIGN KEY (mission_id) REFERENCES speaking_missions(id);
ALTER TABLE "public"."student_video_events" ADD CONSTRAINT "student_video_events_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."student_video_events" ADD CONSTRAINT "student_video_events_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE "public"."students" ADD CONSTRAINT "students_pkey" PRIMARY KEY (id);

-- ============================================================
-- ROW LEVEL SECURITY + POLICIES
-- ============================================================

ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lessons_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."speaking_missions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_behavioral_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_exercise_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_learning_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_missions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_monthly_exams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_skill_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_speaking_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_video_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCIONES
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_student_rewards(p_student_id uuid, p_xp integer DEFAULT 0, p_chokis integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update students
  set
    xp = coalesce(xp, 0) + p_xp,
    chokis = coalesce(chokis, 0) + p_chokis
  where id = p_student_id;
end;
$function$
;
