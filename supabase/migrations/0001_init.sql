-- ════════════════════════════════════════════════════════════════════════════
-- Hyu — initial schema, RLS, helpers, and exercise seed
--
-- Conventions:
--   • Every table has RLS enabled. Per-user data is isolated by `user_id = auth.uid()`.
--   • Child tables (sets, template items, etc.) inherit ownership from their parent
--     via SECURITY DEFINER helper functions to avoid recursive-policy evaluation.
--   • Challenge data is *shared-read among participants* (leaderboards) but each user
--     writes only their own rows; only the creator edits challenge settings.
--   • Macro/exercise values are SNAPSHOTTED onto logs/sets so later edits to a custom
--     food or exercise never rewrite history.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- case-insensitive handles
create extension if not exists "pg_trgm";     -- fuzzy food-name search (gin trgm index)

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  handle         citext unique,
  display_name   text not null default 'Athlete',
  weight_unit    text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  height_cm      numeric,
  sex            text check (sex in ('male', 'female', 'other')),
  birthdate      date,
  activity_level text check (activity_level in ('sedentary','light','moderate','active','very_active')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.profiles is 'One row per user. display_name/handle are discoverable by other authenticated users for friend search.';

-- ─────────────────────────────────────────────────────────────────────────────
-- GOALS  (history kept via effective_from; latest row = current target)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.goals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  calorie_target    integer,
  protein_g_per_lb  numeric,           -- if set, protein_target_g is derived from bodyweight
  protein_target_g  integer,
  carb_target_g     integer,
  fat_target_g      integer,
  effective_from    date not null default current_date,
  created_at        timestamptz not null default now()
);
create index goals_user_idx on public.goals (user_id, effective_from desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- BODY METRICS
-- ─────────────────────────────────────────────────────────────────────────────
create table public.body_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null default current_date,
  weight      numeric not null,        -- stored in the user's profile weight_unit
  bodyfat_pct numeric,
  source      text not null default 'manual' check (source in ('manual','healthkit')),
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, date, source)
);
create index body_metrics_user_idx on public.body_metrics (user_id, date desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- FOODS  (owner_user_id null = shared/cached import from USDA/OFF)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.foods (
  id                  uuid primary key default gen_random_uuid(),
  source              text not null check (source in ('usda','off','custom')),
  source_ref          text,            -- FDC id, barcode, etc.
  name                text not null,
  brand               text,
  serving_size        numeric not null default 100,
  serving_unit        text not null default 'g',
  kcal_per_100g       numeric not null default 0,
  protein_per_100g    numeric not null default 0,
  carb_per_100g       numeric not null default 0,
  fat_per_100g        numeric not null default 0,
  fiber_per_100g      numeric,
  sugar_per_100g      numeric,
  sodium_mg_per_100g  numeric,
  owner_user_id       uuid references auth.users (id) on delete cascade,
  created_at          timestamptz not null default now()
);
create index foods_owner_idx on public.foods (owner_user_id);
create index foods_source_ref_idx on public.foods (source, source_ref);
create index foods_name_trgm_idx on public.foods using gin (name gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────────────────
-- FOOD FAVORITES  (per-user star; works for shared AND custom foods)
-- NOTE: favorites are modeled as a join table rather than a boolean on `foods`
-- because cached USDA/OFF foods are shared rows — a per-row flag couldn't be
-- per-user. This is the fast-logging "Favorites" surface.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.food_favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  food_id    uuid not null references public.foods (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- FOOD LOGS  (food_id null = quick-add; macros always snapshotted)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.food_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  date          date not null default current_date,
  meal          text not null default 'snacks' check (meal in ('breakfast','lunch','dinner','snacks')),
  food_id       uuid references public.foods (id) on delete set null,
  quantity      numeric not null default 1,
  unit          text not null default 'serving',
  -- snapshot of what was actually consumed (already scaled for quantity)
  kcal          numeric not null default 0,
  protein_g     numeric not null default 0,
  carb_g        numeric not null default 0,
  fat_g         numeric not null default 0,
  name_snapshot text,                   -- for quick-add / so history survives food deletion
  created_at    timestamptz not null default now()
);
create index food_logs_user_date_idx on public.food_logs (user_id, date);

-- ─────────────────────────────────────────────────────────────────────────────
-- MEAL TEMPLATES
-- ─────────────────────────────────────────────────────────────────────────────
create table public.meal_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  meal       text check (meal in ('breakfast','lunch','dinner','snacks')),
  created_at timestamptz not null default now()
);
create index meal_templates_user_idx on public.meal_templates (user_id);

create table public.meal_template_items (
  id               uuid primary key default gen_random_uuid(),
  meal_template_id uuid not null references public.meal_templates (id) on delete cascade,
  food_id          uuid references public.foods (id) on delete set null,
  quantity         numeric not null default 1,
  unit             text not null default 'serving',
  -- snapshot so the template is stable even if the underlying food changes
  name_snapshot    text,
  kcal             numeric not null default 0,
  protein_g        numeric not null default 0,
  carb_g           numeric not null default 0,
  fat_g            numeric not null default 0,
  sort_order       integer not null default 0
);
create index meal_template_items_parent_idx on public.meal_template_items (meal_template_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- EXERCISES  (owner_user_id null = seeded library)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.exercises (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  primary_muscle    text,
  secondary_muscles text[] not null default '{}',
  equipment         text,
  owner_user_id     uuid references auth.users (id) on delete cascade,
  created_at        timestamptz not null default now()
);
create index exercises_owner_idx on public.exercises (owner_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- WORKOUTS / EXERCISES / SETS
-- ─────────────────────────────────────────────────────────────────────────────
create table public.workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         date not null default current_date,
  name         text,
  notes        text,
  duration_min integer,
  created_at   timestamptz not null default now()
);
create index workouts_user_date_idx on public.workouts (user_id, date desc);

create table public.workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);
create index workout_exercises_parent_idx on public.workout_exercises (workout_id);

create table public.workout_sets (
  id                  uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_number          integer not null default 1,
  weight              numeric not null default 0,
  reps                integer not null default 0,
  rpe                 numeric,
  is_warmup           boolean not null default false,
  -- Estimated 1RM via Epley: weight * (1 + reps/30)
  e1rm                numeric generated always as (
    case when reps > 0 then round((weight * (1 + reps::numeric / 30.0))::numeric, 2) else weight end
  ) stored,
  created_at          timestamptz not null default now()
);
create index workout_sets_parent_idx on public.workout_sets (workout_exercise_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PERSONAL RECORDS
-- ─────────────────────────────────────────────────────────────────────────────
create table public.personal_records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  exercise_id    uuid not null references public.exercises (id) on delete cascade,
  record_type    text not null check (record_type in ('max_weight','best_e1rm','max_volume','max_reps')),
  value          numeric not null,
  reps           integer,
  achieved_at    timestamptz not null default now(),
  workout_set_id uuid references public.workout_sets (id) on delete set null,
  created_at     timestamptz not null default now()
);
create index personal_records_user_ex_idx on public.personal_records (user_id, exercise_id, record_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROUTINES
-- ─────────────────────────────────────────────────────────────────────────────
create table public.routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  notes      text,
  created_at timestamptz not null default now()
);
create index routines_user_idx on public.routines (user_id);

create table public.routine_exercises (
  id              uuid primary key default gen_random_uuid(),
  routine_id      uuid not null references public.routines (id) on delete cascade,
  exercise_id     uuid not null references public.exercises (id) on delete restrict,
  "order"         integer not null default 0,
  target_sets     integer,
  target_reps     integer,
  target_weight   numeric
);
create index routine_exercises_parent_idx on public.routine_exercises (routine_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- FRIENDSHIPS  (one canonical row per pair: user_id < friend_id)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  friend_id    uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted')),
  requested_by uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  check (user_id <> friend_id),
  check (user_id < friend_id),          -- canonical ordering enforces single row per pair
  unique (user_id, friend_id)
);
create index friendships_friend_idx on public.friendships (friend_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CHALLENGES
-- ─────────────────────────────────────────────────────────────────────────────
create table public.challenges (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  start_date    date not null,
  duration_days integer not null check (duration_days > 0),
  end_date      date generated always as (start_date + duration_days) stored,
  status        text not null default 'draft' check (status in ('draft','active','completed')),
  goal_types    text[] not null default '{}',
  scoring_rules jsonb not null default '{"points_per_goal": 1, "perfect_day_bonus": 2}'::jsonb,
  allow_late_join boolean not null default false,
  created_at    timestamptz not null default now()
);
create index challenges_creator_idx on public.challenges (creator_id);
create index challenges_status_idx on public.challenges (status, start_date);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'invited' check (status in ('invited','joined','declined')),
  joined_at    timestamptz,
  created_at   timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index challenge_participants_user_idx on public.challenge_participants (user_id);

create table public.challenge_goals (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  goal_type    text not null,
  target_value numeric,
  comparator   text not null default 'gte' check (comparator in ('gte','lte','bool')),
  locked_at    timestamptz,             -- set when the challenge start date arrives; freezes editing
  created_at   timestamptz not null default now(),
  unique (challenge_id, user_id, goal_type)
);
create index challenge_goals_user_idx on public.challenge_goals (challenge_id, user_id);

create table public.challenge_daily_scores (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.challenges (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  date          date not null,
  points_earned integer not null default 0,
  goals_hit     jsonb not null default '{}'::jsonb,
  perfect_day   boolean not null default false,
  updated_at    timestamptz not null default now(),
  unique (challenge_id, user_id, date)
);
create index challenge_daily_scores_board_idx on public.challenge_daily_scores (challenge_id, date);

-- ════════════════════════════════════════════════════════════════════════════
-- SECURITY DEFINER HELPERS  (bypass RLS so policies don't recurse)
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.owns_workout(_workout_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.workouts w where w.id = _workout_id and w.user_id = auth.uid());
$$;

create or replace function public.owns_workout_exercise(_we_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = _we_id and w.user_id = auth.uid()
  );
$$;

create or replace function public.owns_meal_template(_tpl_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.meal_templates t where t.id = _tpl_id and t.user_id = auth.uid());
$$;

create or replace function public.owns_routine(_routine_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.routines r where r.id = _routine_id and r.user_id = auth.uid());
$$;

create or replace function public.is_challenge_creator(_challenge_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.challenges c where c.id = _challenge_id and c.creator_id = auth.uid());
$$;

-- A member is anyone invited/joined (not declined) OR the creator. Used for shared-read.
create or replace function public.is_challenge_member(_challenge_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.challenge_participants p
    where p.challenge_id = _challenge_id and p.user_id = auth.uid() and p.status <> 'declined'
  ) or exists (
    select 1 from public.challenges c where c.id = _challenge_id and c.creator_id = auth.uid()
  );
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- NEW-USER BOOTSTRAP  (profile + default goals on signup)
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'Athlete')
  )
  on conflict (user_id) do nothing;

  insert into public.goals (user_id, calorie_target, protein_target_g, carb_target_g, fat_target_g)
  values (new.id, 2200, 160, 220, 70);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════
alter table public.profiles               enable row level security;
alter table public.goals                  enable row level security;
alter table public.body_metrics           enable row level security;
alter table public.foods                  enable row level security;
alter table public.food_favorites         enable row level security;
alter table public.food_logs              enable row level security;
alter table public.meal_templates         enable row level security;
alter table public.meal_template_items    enable row level security;
alter table public.exercises              enable row level security;
alter table public.workouts               enable row level security;
alter table public.workout_exercises      enable row level security;
alter table public.workout_sets           enable row level security;
alter table public.personal_records       enable row level security;
alter table public.routines               enable row level security;
alter table public.routine_exercises      enable row level security;
alter table public.friendships            enable row level security;
alter table public.challenges             enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_goals        enable row level security;
alter table public.challenge_daily_scores enable row level security;

-- PROFILES: discoverable by any authenticated user (friend search); writable by owner.
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Generic per-user owned tables (full CRUD restricted to owner).
create policy goals_all on public.goals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy body_metrics_all on public.body_metrics for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy food_logs_all on public.food_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy food_favorites_all on public.food_favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy meal_templates_all on public.meal_templates for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy workouts_all on public.workouts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy personal_records_all on public.personal_records for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy routines_all on public.routines for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- FOODS: read shared (owner null) or own; write only own; cached imports (owner null) allowed.
create policy foods_select on public.foods for select to authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());
create policy foods_insert on public.foods for insert to authenticated
  with check (owner_user_id = auth.uid() or owner_user_id is null);
create policy foods_update on public.foods for update to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy foods_delete on public.foods for delete to authenticated
  using (owner_user_id = auth.uid());

-- EXERCISES: read seeded (owner null) or own; write only own.
create policy exercises_select on public.exercises for select to authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());
create policy exercises_insert on public.exercises for insert to authenticated
  with check (owner_user_id = auth.uid());
create policy exercises_update on public.exercises for update to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy exercises_delete on public.exercises for delete to authenticated
  using (owner_user_id = auth.uid());

-- Child tables: ownership via parent helpers.
create policy meal_template_items_all on public.meal_template_items for all to authenticated
  using (public.owns_meal_template(meal_template_id))
  with check (public.owns_meal_template(meal_template_id));
create policy workout_exercises_all on public.workout_exercises for all to authenticated
  using (public.owns_workout(workout_id))
  with check (public.owns_workout(workout_id));
create policy workout_sets_all on public.workout_sets for all to authenticated
  using (public.owns_workout_exercise(workout_exercise_id))
  with check (public.owns_workout_exercise(workout_exercise_id));
create policy routine_exercises_all on public.routine_exercises for all to authenticated
  using (public.owns_routine(routine_id))
  with check (public.owns_routine(routine_id));

-- FRIENDSHIPS: visible to either party; created by the requester; updatable by either.
create policy friendships_select on public.friendships for select to authenticated
  using (auth.uid() in (user_id, friend_id));
create policy friendships_insert on public.friendships for insert to authenticated
  with check (requested_by = auth.uid() and auth.uid() in (user_id, friend_id));
create policy friendships_update on public.friendships for update to authenticated
  using (auth.uid() in (user_id, friend_id)) with check (auth.uid() in (user_id, friend_id));
create policy friendships_delete on public.friendships for delete to authenticated
  using (auth.uid() in (user_id, friend_id));

-- CHALLENGES: shared-read among members; only the creator writes settings.
create policy challenges_select on public.challenges for select to authenticated
  using (creator_id = auth.uid() or public.is_challenge_member(id));
create policy challenges_insert on public.challenges for insert to authenticated
  with check (creator_id = auth.uid());
create policy challenges_update on public.challenges for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy challenges_delete on public.challenges for delete to authenticated
  using (creator_id = auth.uid());

-- PARTICIPANTS: members read all rows; creator invites; users accept/decline own row.
create policy challenge_participants_select on public.challenge_participants for select to authenticated
  using (public.is_challenge_member(challenge_id));
create policy challenge_participants_insert on public.challenge_participants for insert to authenticated
  with check (public.is_challenge_creator(challenge_id) or user_id = auth.uid());
create policy challenge_participants_update on public.challenge_participants for update to authenticated
  using (user_id = auth.uid() or public.is_challenge_creator(challenge_id))
  with check (user_id = auth.uid() or public.is_challenge_creator(challenge_id));
create policy challenge_participants_delete on public.challenge_participants for delete to authenticated
  using (user_id = auth.uid() or public.is_challenge_creator(challenge_id));

-- GOALS: members read all (leaderboard transparency); each user writes only their own,
-- and only while not yet locked (freeze at start date enforced at the DB level).
create policy challenge_goals_select on public.challenge_goals for select to authenticated
  using (public.is_challenge_member(challenge_id));
create policy challenge_goals_insert on public.challenge_goals for insert to authenticated
  with check (user_id = auth.uid() and locked_at is null);
create policy challenge_goals_update on public.challenge_goals for update to authenticated
  using (user_id = auth.uid() and locked_at is null)
  with check (user_id = auth.uid() and locked_at is null);
create policy challenge_goals_delete on public.challenge_goals for delete to authenticated
  using (user_id = auth.uid() and locked_at is null);

-- DAILY SCORES: members read all (leaderboard); users upsert only their own (on-log
-- recompute). The scheduled finalizer runs as service_role and bypasses RLS.
create policy challenge_daily_scores_select on public.challenge_daily_scores for select to authenticated
  using (public.is_challenge_member(challenge_id));
create policy challenge_daily_scores_insert on public.challenge_daily_scores for insert to authenticated
  with check (user_id = auth.uid());
create policy challenge_daily_scores_update on public.challenge_daily_scores for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- EXERCISE LIBRARY SEED  (owner_user_id null = available to everyone)
-- ════════════════════════════════════════════════════════════════════════════
insert into public.exercises (name, primary_muscle, secondary_muscles, equipment) values
  ('Back Squat', 'quads', '{glutes,hamstrings,core}', 'barbell'),
  ('Front Squat', 'quads', '{glutes,core}', 'barbell'),
  ('Goblet Squat', 'quads', '{glutes,core}', 'dumbbell'),
  ('Leg Press', 'quads', '{glutes,hamstrings}', 'machine'),
  ('Hack Squat', 'quads', '{glutes}', 'machine'),
  ('Bulgarian Split Squat', 'quads', '{glutes,hamstrings}', 'dumbbell'),
  ('Walking Lunge', 'quads', '{glutes,hamstrings}', 'dumbbell'),
  ('Leg Extension', 'quads', '{}', 'machine'),
  ('Conventional Deadlift', 'hamstrings', '{glutes,back,traps,core}', 'barbell'),
  ('Sumo Deadlift', 'glutes', '{hamstrings,quads,back}', 'barbell'),
  ('Romanian Deadlift', 'hamstrings', '{glutes,back}', 'barbell'),
  ('Stiff-Leg Deadlift', 'hamstrings', '{glutes}', 'barbell'),
  ('Lying Leg Curl', 'hamstrings', '{}', 'machine'),
  ('Seated Leg Curl', 'hamstrings', '{}', 'machine'),
  ('Hip Thrust', 'glutes', '{hamstrings}', 'barbell'),
  ('Glute Bridge', 'glutes', '{hamstrings}', 'barbell'),
  ('Standing Calf Raise', 'calves', '{}', 'machine'),
  ('Seated Calf Raise', 'calves', '{}', 'machine'),
  ('Bench Press', 'chest', '{triceps,shoulders}', 'barbell'),
  ('Incline Bench Press', 'chest', '{triceps,shoulders}', 'barbell'),
  ('Decline Bench Press', 'chest', '{triceps}', 'barbell'),
  ('Dumbbell Bench Press', 'chest', '{triceps,shoulders}', 'dumbbell'),
  ('Incline Dumbbell Press', 'chest', '{triceps,shoulders}', 'dumbbell'),
  ('Machine Chest Press', 'chest', '{triceps,shoulders}', 'machine'),
  ('Cable Fly', 'chest', '{}', 'cable'),
  ('Pec Deck', 'chest', '{}', 'machine'),
  ('Dips', 'chest', '{triceps,shoulders}', 'bodyweight'),
  ('Push-Up', 'chest', '{triceps,shoulders,core}', 'bodyweight'),
  ('Overhead Press', 'shoulders', '{triceps,core}', 'barbell'),
  ('Seated Dumbbell Shoulder Press', 'shoulders', '{triceps}', 'dumbbell'),
  ('Arnold Press', 'shoulders', '{triceps}', 'dumbbell'),
  ('Lateral Raise', 'shoulders', '{}', 'dumbbell'),
  ('Cable Lateral Raise', 'shoulders', '{}', 'cable'),
  ('Rear Delt Fly', 'shoulders', '{upper_back}', 'dumbbell'),
  ('Face Pull', 'shoulders', '{upper_back}', 'cable'),
  ('Upright Row', 'shoulders', '{traps}', 'barbell'),
  ('Barbell Row', 'back', '{biceps,upper_back}', 'barbell'),
  ('Pendlay Row', 'back', '{biceps,upper_back}', 'barbell'),
  ('Dumbbell Row', 'back', '{biceps,upper_back}', 'dumbbell'),
  ('Seated Cable Row', 'back', '{biceps,upper_back}', 'cable'),
  ('T-Bar Row', 'back', '{biceps,upper_back}', 'barbell'),
  ('Chest-Supported Row', 'back', '{biceps,upper_back}', 'machine'),
  ('Lat Pulldown', 'back', '{biceps}', 'cable'),
  ('Pull-Up', 'back', '{biceps}', 'bodyweight'),
  ('Chin-Up', 'back', '{biceps}', 'bodyweight'),
  ('Straight-Arm Pulldown', 'back', '{}', 'cable'),
  ('Barbell Curl', 'biceps', '{forearms}', 'barbell'),
  ('Dumbbell Curl', 'biceps', '{forearms}', 'dumbbell'),
  ('Hammer Curl', 'biceps', '{forearms}', 'dumbbell'),
  ('Preacher Curl', 'biceps', '{}', 'barbell'),
  ('Cable Curl', 'biceps', '{}', 'cable'),
  ('Incline Dumbbell Curl', 'biceps', '{}', 'dumbbell'),
  ('Close-Grip Bench Press', 'triceps', '{chest,shoulders}', 'barbell'),
  ('Triceps Pushdown', 'triceps', '{}', 'cable'),
  ('Overhead Triceps Extension', 'triceps', '{}', 'dumbbell'),
  ('Skullcrusher', 'triceps', '{}', 'barbell'),
  ('Triceps Dip', 'triceps', '{chest,shoulders}', 'bodyweight'),
  ('Plank', 'core', '{}', 'bodyweight'),
  ('Hanging Leg Raise', 'core', '{}', 'bodyweight'),
  ('Cable Crunch', 'core', '{}', 'cable'),
  ('Ab Wheel Rollout', 'core', '{}', 'bodyweight'),
  ('Russian Twist', 'core', '{}', 'bodyweight'),
  ('Back Extension', 'lower_back', '{glutes,hamstrings}', 'bodyweight'),
  ('Barbell Shrug', 'traps', '{forearms}', 'barbell'),
  ('Farmer''s Carry', 'traps', '{forearms,core}', 'dumbbell');
