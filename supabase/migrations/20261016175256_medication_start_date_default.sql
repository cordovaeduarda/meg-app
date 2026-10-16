-- New medications start "today" in Brazil, not in UTC
-- (after 21:00 in São Paulo, UTC is already the next day)
alter table public.medications
    alter column start_date set default(now() at time zone 'America/Sao_Paulo')::date;

-- Existing rows: use the day they were created
update public.medications
    set start_date = (created_at at time zone 'America/Sao_Paulo')::date
    where start_date is null;

-- From now on every medication has a start date
alter table public.medications
    alter column start_date set not null;