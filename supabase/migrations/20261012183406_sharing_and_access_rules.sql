-- Sharing and access rules.
--
-- Model: a pet has members (people with access). The person who creates
-- the pet is its owner; the owner invites others by email. When an invited
-- person signs up and confirms that email, they become a member.
-- Every row of Meg's data is visible only to members of her pet record.

-- ── Who has access to which pet ─────────────────────────────────────
create table public.pet_members (
  pet_id      uuid not null references public.pets (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'member')),
  created_at  timestamptz not null default now(),
  primary key (pet_id, user_id)
);

-- Pending invitations, matched by email when the invited person logs in
create table public.pet_invitations (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references public.pets (id) on delete cascade,
  email       text not null check (email = lower(trim(email))),
  invited_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (pet_id, email)
);

alter table public.pet_members     enable row level security;
alter table public.pet_invitations enable row level security;

grant select, delete         on public.pet_members     to authenticated;
grant select, insert, delete on public.pet_invitations to authenticated;

-- ── Helper functions used by the rules ──────────────────────────────
-- They live in a "private" schema, which the Data API does not expose.
-- "security definer" lets them read pet_members without triggering
-- pet_members' own rules (which would loop back into these functions).
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_pet_member(p_pet_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members
    where pet_id = p_pet_id and user_id = (select auth.uid())
  );
$$;

create function private.is_pet_owner(p_pet_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members
    where pet_id = p_pet_id and user_id = (select auth.uid()) and role = 'owner'
  );
$$;

-- Schedules and dose logs don't store pet_id directly; follow the links up
create function private.can_access_medication(p_medication_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.medications m
    where m.id = p_medication_id and private.is_pet_member(m.pet_id)
  );
$$;

create function private.can_access_schedule(p_schedule_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.medication_schedules s
    where s.id = p_schedule_id and private.can_access_medication(s.medication_id)
  );
$$;

revoke execute on all functions in schema private from public, anon;
grant  execute on all functions in schema private to authenticated;

-- ── Rules (RLS policies) ────────────────────────────────────────────
-- "using"      = which existing rows you can see / change / delete
-- "with check" = which new or edited rows you are allowed to save

-- Pets: members see them; only the owner edits or deletes.
-- Creating a pet goes through create_pet() below, so no insert rule.
create policy "Members can view their pets" on public.pets
  for select to authenticated using (private.is_pet_member(id));
create policy "Owners can update their pets" on public.pets
  for update to authenticated
  using (private.is_pet_owner(id)) with check (private.is_pet_owner(id));
create policy "Owners can delete their pets" on public.pets
  for delete to authenticated using (private.is_pet_owner(id));

-- Members: see who else has access; the owner removes members,
-- and a member can remove themselves. Nobody can remove the owner.
create policy "Members can view co-members" on public.pet_members
  for select to authenticated using (private.is_pet_member(pet_id));
create policy "Owner removes members, members can leave" on public.pet_members
  for delete to authenticated
  using (
    role = 'member'
    and (user_id = (select auth.uid()) or private.is_pet_owner(pet_id))
  );

-- Invitations: managed by the owner only
create policy "Owners manage invitations" on public.pet_invitations
  for all to authenticated
  using (private.is_pet_owner(pet_id)) with check (private.is_pet_owner(pet_id));

-- Meg's data: any member can read and write it
create policy "Members manage medications" on public.medications
  for all to authenticated
  using (private.is_pet_member(pet_id)) with check (private.is_pet_member(pet_id));

create policy "Members manage schedules" on public.medication_schedules
  for all to authenticated
  using (private.can_access_medication(medication_id))
  with check (private.can_access_medication(medication_id));

create policy "Members manage dose logs" on public.dose_logs
  for all to authenticated
  using (private.can_access_schedule(schedule_id))
  with check (private.can_access_schedule(schedule_id));

create policy "Members manage daily logs" on public.daily_logs
  for all to authenticated
  using (private.is_pet_member(pet_id)) with check (private.is_pet_member(pet_id));

create policy "Members manage expenses" on public.expenses
  for all to authenticated
  using (private.is_pet_member(pet_id)) with check (private.is_pet_member(pet_id));

-- Categories are shared reference data: every logged-in user can read them
create policy "Anyone logged in can read categories" on public.expense_categories
  for select to authenticated using (true);

-- ── Actions the app calls (exposed through the API as RPCs) ─────────

-- Creates a pet and makes the caller its owner, in one step
create function public.create_pet(
  p_name        text,
  p_breed       text default null,
  p_birth_date  date default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_pet_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;

  insert into public.pets (name, breed, birth_date)
  values (p_name, p_breed, p_birth_date)
  returning id into new_pet_id;

  insert into public.pet_members (pet_id, user_id, role)
  values (new_pet_id, auth.uid(), 'owner');

  return new_pet_id;
end;
$$;

-- Turns any invitations for the caller's (confirmed) email into memberships.
-- The app calls this after every login. Returns how many were accepted.
create function public.accept_pending_invitations()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  user_email     text;
  accepted_count integer;
begin
  -- Only confirmed emails count, so nobody can claim an invite
  -- by signing up with someone else's address
  select lower(email) into user_email
  from auth.users
  where id = auth.uid() and email_confirmed_at is not null;

  if user_email is null then
    return 0;
  end if;

  insert into public.pet_members (pet_id, user_id, role)
  select pet_id, auth.uid(), 'member'
  from public.pet_invitations
  where email = user_email
  on conflict do nothing;

  get diagnostics accepted_count = row_count;

  delete from public.pet_invitations where email = user_email;

  return accepted_count;
end;
$$;

-- Lists a pet's members with their emails (emails live in auth.users,
-- which the app can't read directly). Returns nothing for non-members.
create function public.list_pet_members(p_pet_id uuid)
returns table (user_id uuid, email text, role text, is_me boolean)
language sql stable security definer set search_path = ''
as $$
  select m.user_id, u.email::text, m.role, m.user_id = auth.uid()
  from public.pet_members m
  join auth.users u on u.id = m.user_id
  where m.pet_id = p_pet_id
    and private.is_pet_member(p_pet_id)
  order by m.role desc, m.created_at;
$$;

revoke execute on function
  public.create_pet(text, text, date),
  public.accept_pending_invitations(),
  public.list_pet_members(uuid)
from public, anon;

grant execute on function
  public.create_pet(text, text, date),
  public.accept_pending_invitations(),
  public.list_pet_members(uuid)
to authenticated;
