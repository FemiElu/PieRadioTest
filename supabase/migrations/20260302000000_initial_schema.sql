


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."request_status" AS ENUM (
    'pending',
    'approved',
    'declined',
    'played',
    'rejected',
    'expired'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'listener',
    'presenter',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role::TEXT INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_music_request_update_rules"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Block expired requests (>24h)
  IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Cannot modify expired request (older than 24 hours)';
  END IF;

  -- Immutable columns check
  IF NEW.artist_name IS DISTINCT FROM OLD.artist_name THEN
    RAISE EXCEPTION 'Cannot modify immutable field: artist_name';
  END IF;
  IF NEW.song_title IS DISTINCT FROM OLD.song_title THEN
    RAISE EXCEPTION 'Cannot modify immutable field: song_title';
  END IF;
  IF NEW.requested_by_user_id IS DISTINCT FROM OLD.requested_by_user_id THEN
    RAISE EXCEPTION 'Cannot modify immutable field: requested_by_user_id';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify immutable field: user_id';
  END IF;
  IF NEW.station_id IS DISTINCT FROM OLD.station_id THEN
    RAISE EXCEPTION 'Cannot modify immutable field: station_id';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify immutable field: created_at';
  END IF;
  IF NEW.show_id IS DISTINCT FROM OLD.show_id THEN
    RAISE EXCEPTION 'Cannot modify immutable field: show_id';
  END IF;
  IF NEW.listener_note IS DISTINCT FROM OLD.listener_note THEN
    RAISE EXCEPTION 'Cannot modify immutable field: listener_note';
  END IF;

  -- Status transitions: pending → approved/rejected only
  IF OLD.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed - cannot modify status again';
  END IF;

  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status transition: must be approved or rejected';
  END IF;

  -- Auto-set updated_at
  NEW.updated_at = NOW();

  -- Set timestamps based on status
  IF NEW.status = 'approved' THEN
    NEW.approved_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_music_request_update_rules"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$SELECT role FROM public.profiles WHERE id = auth.uid();$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_avatar := NEW.raw_user_meta_data->>'avatar_url';
  INSERT INTO public.profiles (id, email, full_name, username, avatar_url, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_name, LOWER(REPLACE(user_name, ' ', '_')) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4), user_avatar, 'listener', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_presenter_promotion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only act if the role is being changed to 'presenter'
    IF NEW.role = 'presenter' THEN
        -- A. Ensure slug exists
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := LOWER(REPLACE(COALESCE(NEW.username, NEW.full_name, NEW.id::text), ' ', '-'));
            
            -- Ensure slug is unique by appending short ID if necessary
            -- (Simple version: just ensure it's not empty)
        END IF;
        -- B. Ensure presenter_meta record exists
        -- Note: We use a separate block or check because we can't insert into another table 
        -- easily within a BEFORE trigger that modifies the same row's NEW record.
        -- We'll handle the insertion in an AFTER trigger or a combined approach.
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_presenter_promotion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_any_role"("required_roles" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role::TEXT = ANY(required_roles)
  );
END;
$$;


ALTER FUNCTION "public"."has_any_role"("required_roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("required_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::TEXT = required_role); END; $$;


ALTER FUNCTION "public"."has_role"("required_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_presenter_meta"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.role = 'presenter' THEN
        INSERT INTO public.presenter_meta (user_id, category)
        VALUES (NEW.id, 'Main Station')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_presenter_meta"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN public.has_role('admin');
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_presenter"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN public.has_role('presenter');
END;
$$;


ALTER FUNCTION "public"."is_presenter"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_presenter_or_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN public.has_any_role(ARRAY['presenter', 'admin']);
END;
$$;


ALTER FUNCTION "public"."is_presenter_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_role_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_audit (
      user_id,
      old_role,
      new_role,
      changed_by,
      changed_at
    )
    VALUES (
      NEW.id,
      OLD.role::TEXT,
      NEW.role::TEXT,
      auth.uid(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_role_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_role_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- 1. Allow if executed by a Superuser (likely the Supabase Audit/Dashboard user)
    --    Checking for 'postgres' or if the session role is 'service_role'
    IF (current_user IN ('postgres', 'supabase_admin')) OR 
       (current_setting('request.jwt.claim.role', true) = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- 2. Allow if the authenticated user is an admin
    IF (auth.uid() IS NOT NULL) AND ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Unauthorized: You cannot change your own role or the role of others.';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_role_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_music_request_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- 1. Enforce Immutable Columns
    IF (OLD.artist_name IS DISTINCT FROM NEW.artist_name) OR
       (OLD.song_title IS DISTINCT FROM NEW.song_title) OR
       (OLD.requested_by_user_id IS DISTINCT FROM NEW.requested_by_user_id) OR
       (OLD.station_id IS DISTINCT FROM NEW.station_id) OR
       (OLD.device_id IS DISTINCT FROM NEW.device_id) THEN
        RAISE EXCEPTION 'Cannot modify immutable fields (artist, song, user, station, device)';
    END IF;

    -- 2. Enforce Expiry (24 Hours)
    -- Allow updates only within 24 hours of creation
    IF (OLD.created_at < now() - interval '24 hours') THEN
        RAISE EXCEPTION 'Cannot modify expired requests (older than 24 hours)';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_music_request_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artist_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid",
    "title" "text" NOT NULL,
    "genre" "text",
    "audio_url" "text" NOT NULL,
    "status" "public"."request_status" DEFAULT 'pending'::"public"."request_status",
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."artist_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "room_id" "text" DEFAULT 'global'::"text",
    "content" "text" NOT NULL,
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."episodes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "show_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "duration_seconds" integer,
    "file_key" "text",
    "vod_hls_url" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."episodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "cover_image_url" "text",
    "price_amount" integer DEFAULT 0,
    "currency" "text" DEFAULT 'GBP'::"text",
    "capacity" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."music_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "artist_name" "text" NOT NULL,
    "song_title" "text" NOT NULL,
    "preferred_play_date" "date",
    "status" "public"."request_status" DEFAULT 'pending'::"public"."request_status",
    "dedicated_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "requested_by_user_id" "uuid",
    "station_id" bigint,
    "show_id" "uuid",
    "listener_note" "text",
    "device_id" "text",
    "rejection_reason" "text",
    "approved_at" timestamp with time zone,
    "played_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."music_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."music_requests" IS 'Music request queue. MVP: Single centralized station, admin-only management.';



CREATE TABLE IF NOT EXISTS "public"."news_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text" NOT NULL,
    "cover_image_url" "text",
    "author_id" "uuid",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."news_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playback_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "station_id" "uuid",
    "episode_id" "uuid",
    "position_seconds" integer,
    "duration_seconds" integer,
    "client" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."playback_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presenter_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "presenter_id" "uuid" NOT NULL,
    "sender_name" "text" NOT NULL,
    "sender_email" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."presenter_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presenter_meta" (
    "user_id" "uuid" NOT NULL,
    "twitter_handle" "text",
    "instagram_handle" "text",
    "website_url" "text",
    "joined_date" "date",
    "category" "text" DEFAULT 'Main Station'::"text"
);


ALTER TABLE "public"."presenter_meta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presenter_shows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "presenter_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "schedule" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."presenter_shows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'listener'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" "text",
    "slug" "text",
    "bio" "text",
    "is_live" boolean DEFAULT false
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_change_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "old_role" "text",
    "new_role" "text" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reason" "text",
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."role_change_audit" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."role_change_audit_view" AS
 SELECT "a"."id",
    "a"."user_id",
    "u"."email" AS "user_email",
    "u"."full_name" AS "user_full_name",
    "a"."old_role",
    "a"."new_role",
    "a"."changed_by",
    "c"."full_name" AS "changed_by_name",
    "a"."changed_at",
    "a"."reason"
   FROM (("public"."role_change_audit" "a"
     JOIN "public"."profiles" "u" ON (("a"."user_id" = "u"."id")))
     LEFT JOIN "public"."profiles" "c" ON (("a"."changed_by" = "c"."id")));


ALTER VIEW "public"."role_change_audit_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "show_id" "uuid",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "title" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schedule_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "show_id" "uuid",
    "day_of_week" integer,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_recurring" boolean DEFAULT true,
    "override_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schedule_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "presenter_id" "uuid",
    "image_url" "text",
    "is_live" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "schedules_dates_check" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "artwork_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "genre" "text",
    "is_featured" boolean DEFAULT false,
    "host_id" "uuid"
);


ALTER TABLE "public"."shows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."station" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "stream_hls_url" "text",
    "stream_icy_url" "text",
    "timezone" "text" DEFAULT 'Africa/Lagos'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."station" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."station_metadata" (
    "id" bigint NOT NULL,
    "title" "text",
    "artist" "text",
    "cover_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."station_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."station_metadata_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metadata_id" bigint,
    "title" "text",
    "artist" "text",
    "cover_url" "text",
    "played_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."station_metadata_history" OWNER TO "postgres";


ALTER TABLE "public"."station_metadata" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."station_metadata_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_id" "uuid",
    "status" "text" DEFAULT 'paid'::"text",
    "stripe_session_id" "text",
    "qr_code" "text",
    "purchased_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."uploads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uploaded_by" "uuid",
    "file_key" "text",
    "purpose" "text",
    "original_filename" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "item_type" "text",
    "item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_favorites_item_type_check" CHECK (("item_type" = ANY (ARRAY['show'::"text", 'presenter'::"text", 'song'::"text"])))
);


ALTER TABLE "public"."user_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'partnership_page'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


COMMENT ON TABLE "public"."waitlist" IS 'Waitlist for partnership and early access.';



ALTER TABLE ONLY "public"."artist_uploads"
    ADD CONSTRAINT "artist_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."episodes"
    ADD CONSTRAINT "episodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."music_requests"
    ADD CONSTRAINT "music_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_articles"
    ADD CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_articles"
    ADD CONSTRAINT "news_articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."playback_events"
    ADD CONSTRAINT "playback_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presenter_messages"
    ADD CONSTRAINT "presenter_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presenter_meta"
    ADD CONSTRAINT "presenter_meta_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."presenter_shows"
    ADD CONSTRAINT "presenter_shows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."role_change_audit"
    ADD CONSTRAINT "role_change_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_entries"
    ADD CONSTRAINT "schedule_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_slots"
    ADD CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shows"
    ADD CONSTRAINT "shows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."station_metadata_history"
    ADD CONSTRAINT "station_metadata_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."station_metadata"
    ADD CONSTRAINT "station_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."station"
    ADD CONSTRAINT "station_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."station"
    ADD CONSTRAINT "station_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."uploads"
    ADD CONSTRAINT "uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_item_type_item_id_key" UNIQUE ("user_id", "item_type", "item_id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_episodes_show" ON "public"."episodes" USING "btree" ("show_id");



CREATE INDEX "idx_music_requests_created_at" ON "public"."music_requests" USING "btree" ("created_at");



CREATE INDEX "idx_music_requests_requested_by" ON "public"."music_requests" USING "btree" ("requested_by_user_id");



CREATE INDEX "idx_music_requests_station_id" ON "public"."music_requests" USING "btree" ("station_id");



CREATE INDEX "idx_music_requests_status" ON "public"."music_requests" USING "btree" ("status");



CREATE INDEX "idx_playback_station" ON "public"."playback_events" USING "btree" ("station_id");



CREATE INDEX "idx_playback_user" ON "public"."playback_events" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_slug" ON "public"."profiles" USING "btree" ("slug");



CREATE INDEX "idx_role_change_audit_changed_at" ON "public"."role_change_audit" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_role_change_audit_changed_by" ON "public"."role_change_audit" USING "btree" ("changed_by");



CREATE INDEX "idx_role_change_audit_user_id" ON "public"."role_change_audit" USING "btree" ("user_id");



CREATE INDEX "idx_schedule_start" ON "public"."schedule_entries" USING "btree" ("start_time");



CREATE INDEX "idx_schedules_end_time" ON "public"."schedules" USING "btree" ("end_time");



CREATE INDEX "idx_schedules_presenter_id" ON "public"."schedules" USING "btree" ("presenter_id");



CREATE INDEX "idx_schedules_start_time" ON "public"."schedules" USING "btree" ("start_time");



CREATE INDEX "idx_uploads_user" ON "public"."uploads" USING "btree" ("uploaded_by");



CREATE INDEX "presenter_shows_presenter_id_idx" ON "public"."presenter_shows" USING "btree" ("presenter_id", "display_order");



CREATE OR REPLACE TRIGGER "check_role_update" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_role_change"();



CREATE OR REPLACE TRIGGER "music_request_update_rules" BEFORE UPDATE ON "public"."music_requests" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_music_request_update_rules"();



CREATE OR REPLACE TRIGGER "on_role_changed" AFTER UPDATE ON "public"."profiles" FOR EACH ROW WHEN (("old"."role" IS DISTINCT FROM "new"."role")) EXECUTE FUNCTION "public"."log_role_change"();



CREATE OR REPLACE TRIGGER "presenter_shows_updated_at" BEFORE UPDATE ON "public"."presenter_shows" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_on_presenter_meta_needed" AFTER INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_presenter_meta"();



CREATE OR REPLACE TRIGGER "tr_on_presenter_slug_needed" BEFORE INSERT OR UPDATE OF "role", "username", "full_name" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_presenter_promotion"();



CREATE OR REPLACE TRIGGER "trigger_protect_music_request_mutation" BEFORE UPDATE ON "public"."music_requests" FOR EACH ROW EXECUTE FUNCTION "public"."protect_music_request_mutation"();



CREATE OR REPLACE TRIGGER "update_schedules_updated_at" BEFORE UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."artist_uploads"
    ADD CONSTRAINT "artist_uploads_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artist_uploads"
    ADD CONSTRAINT "artist_uploads_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."episodes"
    ADD CONSTRAINT "episodes_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."music_requests"
    ADD CONSTRAINT "music_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."music_requests"
    ADD CONSTRAINT "music_requests_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id");



ALTER TABLE ONLY "public"."music_requests"
    ADD CONSTRAINT "music_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."news_articles"
    ADD CONSTRAINT "news_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."playback_events"
    ADD CONSTRAINT "playback_events_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id");



ALTER TABLE ONLY "public"."presenter_messages"
    ADD CONSTRAINT "presenter_messages_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presenter_meta"
    ADD CONSTRAINT "presenter_meta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presenter_shows"
    ADD CONSTRAINT "presenter_shows_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_change_audit"
    ADD CONSTRAINT "role_change_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."role_change_audit"
    ADD CONSTRAINT "role_change_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_entries"
    ADD CONSTRAINT "schedule_entries_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."schedule_slots"
    ADD CONSTRAINT "schedule_slots_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shows"
    ADD CONSTRAINT "shows_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."station_metadata_history"
    ADD CONSTRAINT "station_metadata_history_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "public"."station_metadata"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."uploads"
    ADD CONSTRAINT "uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin Manage Events" ON "public"."events" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admin Manage Schedule" ON "public"."schedule_slots" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admin Manage Shows" ON "public"."shows" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admin only read" ON "public"."waitlist" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin/Presenter Manage News" ON "public"."news_articles" USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'presenter'::"text"])));



CREATE POLICY "Admins and owners can insert meta" ON "public"."presenter_meta" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Admins and owners can update meta" ON "public"."presenter_meta" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Admins can delete meta" ON "public"."presenter_meta" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can delete old audit logs" ON "public"."role_change_audit" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))) AND ("changed_at" < ("now"() - '1 year'::interval))));



CREATE POLICY "Admins can delete profiles" ON "public"."profiles" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage presenter shows" ON "public"."presenter_shows" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage schedules" ON "public"."schedules" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update any profile" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all presenter messages" ON "public"."presenter_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view audit logs" ON "public"."role_change_audit" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins update history" ON "public"."station_metadata_history" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins update metadata" ON "public"."station_metadata" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins update requests" ON "public"."music_requests" FOR UPDATE TO "authenticated" USING ((("public"."get_user_role"() = 'admin'::"text") AND ("created_at" > ("now"() - '24:00:00'::interval)))) WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admins view all requests" ON "public"."music_requests" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'admin'::"text") AND ("created_at" > ("now"() - '24:00:00'::interval))));



CREATE POLICY "Admins view all tickets" ON "public"."tickets" FOR SELECT USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Allow all submissions" ON "public"."waitlist" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow public read access" ON "public"."episodes" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."schedule_entries" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."shows" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."station" FOR SELECT USING (true);



CREATE POLICY "Anyone can send messages to presenters" ON "public"."presenter_messages" FOR INSERT WITH CHECK (true);



CREATE POLICY "Artists upload music" ON "public"."artist_uploads" FOR INSERT WITH CHECK (("auth"."uid"() = "artist_id"));



CREATE POLICY "Artists view own uploads" ON "public"."artist_uploads" FOR SELECT USING (("auth"."uid"() = "artist_id"));



CREATE POLICY "Authenticated users can post chat" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Everyone can read chat" ON "public"."chat_messages" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Listeners insert own requests" ON "public"."music_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "requested_by_user_id"));



CREATE POLICY "Listeners view own requests" ON "public"."music_requests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "requested_by_user_id"));



CREATE POLICY "Moderators delete chat" ON "public"."chat_messages" FOR DELETE USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'presenter'::"text"])));



CREATE POLICY "Presenters can view their own messages" ON "public"."presenter_messages" FOR SELECT USING (("auth"."uid"() = "presenter_id"));



CREATE POLICY "Presenters view all uploads" ON "public"."artist_uploads" FOR SELECT USING (("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'presenter'::"text"])));



CREATE POLICY "Public Read Chat" ON "public"."chat_messages" FOR SELECT USING (true);



CREATE POLICY "Public Read Events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Public Read News" ON "public"."news_articles" FOR SELECT USING (true);



CREATE POLICY "Public Read Schedule" ON "public"."schedule_slots" FOR SELECT USING (true);



CREATE POLICY "Public Read Shows" ON "public"."shows" FOR SELECT USING (true);



CREATE POLICY "Public can view presenter meta" ON "public"."presenter_meta" FOR SELECT USING (true);



CREATE POLICY "Public can view presenter shows" ON "public"."presenter_shows" FOR SELECT USING (true);



CREATE POLICY "Public can view schedules" ON "public"."schedules" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public read history" ON "public"."station_metadata_history" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public read metadata" ON "public"."station_metadata" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "System can insert audit logs" ON "public"."role_change_audit" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Uploads are viewable by everyone" ON "public"."uploads" FOR SELECT USING (true);



CREATE POLICY "Users can add their own favorites" ON "public"."favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own uploads" ON "public"."uploads" FOR DELETE USING (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can log their own playback events" ON "public"."playback_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove their own favorites" ON "public"."favorites" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))) OR ("role" = ( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own uploads" ON "public"."uploads" FOR UPDATE USING (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can upload their own files" ON "public"."uploads" FOR INSERT WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can view their own favorites" ON "public"."favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own history" ON "public"."playback_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage favorites" ON "public"."user_favorites" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users post chat" ON "public"."chat_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own favorites" ON "public"."user_favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own tickets" ON "public"."tickets" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."artist_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."episodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."music_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playback_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presenter_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presenter_meta" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presenter_shows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_change_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."station" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."station_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."station_metadata_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_music_request_update_rules"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_music_request_update_rules"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_music_request_update_rules"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_presenter_promotion"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_presenter_promotion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_presenter_promotion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_any_role"("required_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_any_role"("required_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_any_role"("required_roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("required_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("required_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("required_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_presenter_meta"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_presenter_meta"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_presenter_meta"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_presenter"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_presenter"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_presenter"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_presenter_or_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_presenter_or_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_presenter_or_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_role_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_role_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_role_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_role_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_role_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_role_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_music_request_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_music_request_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_music_request_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."artist_uploads" TO "anon";
GRANT ALL ON TABLE "public"."artist_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."episodes" TO "anon";
GRANT ALL ON TABLE "public"."episodes" TO "authenticated";
GRANT ALL ON TABLE "public"."episodes" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."music_requests" TO "anon";
GRANT ALL ON TABLE "public"."music_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."music_requests" TO "service_role";



GRANT ALL ON TABLE "public"."news_articles" TO "anon";
GRANT ALL ON TABLE "public"."news_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."news_articles" TO "service_role";



GRANT ALL ON TABLE "public"."playback_events" TO "anon";
GRANT ALL ON TABLE "public"."playback_events" TO "authenticated";
GRANT ALL ON TABLE "public"."playback_events" TO "service_role";



GRANT ALL ON TABLE "public"."presenter_messages" TO "anon";
GRANT ALL ON TABLE "public"."presenter_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."presenter_messages" TO "service_role";



GRANT ALL ON TABLE "public"."presenter_meta" TO "anon";
GRANT ALL ON TABLE "public"."presenter_meta" TO "authenticated";
GRANT ALL ON TABLE "public"."presenter_meta" TO "service_role";



GRANT ALL ON TABLE "public"."presenter_shows" TO "anon";
GRANT ALL ON TABLE "public"."presenter_shows" TO "authenticated";
GRANT ALL ON TABLE "public"."presenter_shows" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."role_change_audit" TO "anon";
GRANT ALL ON TABLE "public"."role_change_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."role_change_audit" TO "service_role";



GRANT ALL ON TABLE "public"."role_change_audit_view" TO "anon";
GRANT ALL ON TABLE "public"."role_change_audit_view" TO "authenticated";
GRANT ALL ON TABLE "public"."role_change_audit_view" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_entries" TO "anon";
GRANT ALL ON TABLE "public"."schedule_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_entries" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_slots" TO "anon";
GRANT ALL ON TABLE "public"."schedule_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_slots" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON TABLE "public"."shows" TO "anon";
GRANT ALL ON TABLE "public"."shows" TO "authenticated";
GRANT ALL ON TABLE "public"."shows" TO "service_role";



GRANT ALL ON TABLE "public"."station" TO "anon";
GRANT ALL ON TABLE "public"."station" TO "authenticated";
GRANT ALL ON TABLE "public"."station" TO "service_role";



GRANT ALL ON TABLE "public"."station_metadata" TO "anon";
GRANT ALL ON TABLE "public"."station_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."station_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."station_metadata_history" TO "anon";
GRANT ALL ON TABLE "public"."station_metadata_history" TO "authenticated";
GRANT ALL ON TABLE "public"."station_metadata_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."station_metadata_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."station_metadata_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."station_metadata_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."uploads" TO "anon";
GRANT ALL ON TABLE "public"."uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."uploads" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorites" TO "anon";
GRANT ALL ON TABLE "public"."user_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







