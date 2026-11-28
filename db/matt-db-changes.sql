-- Matt's database changes. Run top to bottom in the Supabase SQL editor.
-- Each step is safe to re-run.

--Enable RLS for everything for now
alter table address              enable row level security;
alter table appointments         enable row level security;
alter table patients             enable row level security;
alter table staff                enable row level security;
alter table medications          enable row level security;
alter table patients_medication  enable row level security;
alter table ref_medication_types enable row level security;

-- add password field
alter table patients add column if not exists password text;
alter table staff    add column if not exists password text;

-- Add staff identifier
alter table staff add column if not exists staff_code text
  generated always as ('pemv' || staff_id) stored unique;

-- Random passwords for now
update patients set password = substr(md5(random()::text), 1, 5) where password is null;
update staff    set password = substr(md5(random()::text), 1, 5) where password is null;

do $$
declare pol record;
begin
  for pol in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- lock tables to all users except the ones i want to see them
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- log in checks
create or replace function patient_login(p_id int, p_password text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from patients where patient_id = p_id and password = p_password);
$$;

-- new select for staff id
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where staff_code = lower(trim(p_code)) and password = p_password);
$$;

-- 6. Staff Tools page (placeholder): pick a patient, see all their appointments.
--    Every function re-checks the staff code + password with staff_login() first;
--    wrong credentials = no rows.

--    All appointment columns, plus the doctor's name. security_invoker keeps the view
--    locked to the website like the tables; only the functions below can read it.
create or replace view appointment_details with (security_invoker = true) as
select a.*, s.first_name || ' ' || s.last_name as doctor
from appointments a
left join staff s on s.staff_id = a.staff_id;

--    Patient list for the dropdown (names only, no passwords).
create or replace function staff_list_patients(p_code text, p_password text)
returns table (patient_id int, first_name text, last_name text)
language sql stable security definer set search_path = public as $$
  select p.patient_id::int, p.first_name::text, p.last_name::text
  from patients p
  where staff_login(p_code, p_password)
  order by p.last_name, p.first_name;
$$;

--    One patient's appointments, newest first.
create or replace function staff_patient_appointments(p_code text, p_password text, p_patient_id int)
returns setof appointment_details
language sql stable security definer set search_path = public as $$
  select * from appointment_details
  where patient_id = p_patient_id and staff_login(p_code, p_password)
  order by date_time_of_appointment desc;
$$;
