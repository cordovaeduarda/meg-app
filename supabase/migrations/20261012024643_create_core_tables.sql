-- Core tables for the Meg app.
-- Access rules (RLS policies) come in the next migration, in step 7.
-- Until then, RLS is on with no policies, so nobody can read or write.

-- ── Pets ────────────────────────────────────────────────────────────
create table public.pets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  breed       text,
  birth_date  date,
  created_at  timestamptz not null default now()
);

-- ── Medications ─────────────────────────────────────────────────────
create table public.medications (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets (id) on delete cascade,
  name          text not null,                    -- 'Pimobendan'
  dose_amount   numeric(10, 3),                   -- 2.5
  dose_unit     text,                             -- 'mg', 'ml', 'tablet'
  instructions  text,                             -- 'with food'
  active        boolean not null default true,    -- false = no longer given
  start_date    date,
  end_date      date,
  created_at    timestamptz not null default now()
);

-- One row per time of day a medication is given (08:00, 20:00…)
create table public.medication_schedules (
  id             uuid primary key default gen_random_uuid(),
  medication_id  uuid not null references public.medications (id) on delete cascade,
  time_of_day    time not null,
  unique (medication_id, time_of_day)
);

-- One row per dose actually given: a ticked checkbox
create table public.dose_logs (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.medication_schedules (id) on delete cascade,
  log_date     date not null,
  given_at     timestamptz not null default now(),
  given_by     uuid default auth.uid() references auth.users (id) on delete set null,
  unique (schedule_id, log_date)   -- a dose can only be ticked once per day
);

-- ── Daily log ───────────────────────────────────────────────────────
create table public.daily_logs (
  id                 uuid primary key default gen_random_uuid(),
  pet_id             uuid not null references public.pets (id) on delete cascade,
  log_date           date not null,
  symptoms           text[] not null default '{}',   -- {'diarrhea','vomit'}
  extra_medications  text,                           -- 'Dipyrone 10 drops at 15:00'
  notes              text,
  updated_at         timestamptz not null default now(),
  unique (pet_id, log_date)   -- one log per pet per day
);

-- ── Expenses ────────────────────────────────────────────────────────
create table public.expense_categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets (id) on delete cascade,
  category_id   uuid references public.expense_categories (id) on delete set null,
  spent_on      date not null default current_date,
  amount        numeric(10, 2) not null check (amount > 0),   -- exact money math
  description   text,
  place         text,              -- 'Vet clinic', 'Pet shop'
  receipt_path  text,              -- file in Supabase Storage (step 9)
  created_at    timestamptz not null default now()
);

-- Speeds up "expenses this month" and "logs this week" queries
create index on public.expenses (pet_id, spent_on);
create index on public.daily_logs (pet_id, log_date);
create index on public.dose_logs (log_date);

-- ── Security ────────────────────────────────────────────────────────
-- Row Level Security: rows are hidden unless a policy allows them
alter table public.pets                 enable row level security;
alter table public.medications          enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.dose_logs            enable row level security;
alter table public.daily_logs           enable row level security;
alter table public.expense_categories   enable row level security;
alter table public.expenses             enable row level security;

-- Expose the tables to logged-in users only (never to anonymous visitors).
-- RLS policies still decide which rows each user can touch.
grant select, insert, update, delete on
  public.pets,
  public.medications,
  public.medication_schedules,
  public.dose_logs,
  public.daily_logs,
  public.expenses
to authenticated;

grant select on public.expense_categories to authenticated;

-- ── Starting data ───────────────────────────────────────────────────
insert into public.expense_categories (name) values
  ('Medications'),
  ('Vet'),
  ('Exams'),
  ('Food'),
  ('Grooming'),
  ('Supplies'),
  ('Other');
