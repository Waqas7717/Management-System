-- FG Campus database schema for Supabase (Postgres).
-- Run this whole file once in Supabase: SQL Editor > New query > paste > Run.
-- It is safe to run again; it uses "if not exists" and "create or replace".

------------------------------------------------------------------------
-- 1. Tables
------------------------------------------------------------------------

-- One row per login account (admin, principal, teacher, parent).
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  email       text not null,
  full_name   text not null,
  phone       text not null default '',
  role        text not null check (role in ('admin','principal','teacher','parent')),
  relation    text not null default '',          -- parents only: Father, Mother, Guardian
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists subjects (
  code  text primary key check (code ~ '^[a-z0-9_]{2,20}$'),
  name  text not null
);

-- Every class has exactly 5 subjects, because the timetable has 5 lectures a day.
create table if not exists classes (
  id             text primary key check (id ~ '^[a-z0-9_]{1,20}$'),
  name           text not null,
  level          text not null check (level in ('school','college')),
  room           text not null default '',
  class_teacher  uuid references profiles(id) on delete set null,
  subjects       text[] not null check (array_length(subjects, 1) = 5)
);

create table if not exists students (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  roll       integer not null check (roll > 0),
  class_id   text not null references classes(id) on delete restrict,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (class_id, roll)
);

create table if not exists parent_students (
  parent_id  uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  primary key (parent_id, student_id)
);

-- Which teacher teaches which subject in which class (one teacher per class and subject).
create table if not exists teacher_assignments (
  teacher_id   uuid not null references profiles(id) on delete cascade,
  class_id     text not null references classes(id) on delete cascade,
  subject_code text not null references subjects(code) on delete cascade,
  primary key (class_id, subject_code)
);

-- Daily records: attendance, homework, results, leave requests, notices and so on.
-- One row per record. "collection" says what kind of record it is.
create table if not exists records (
  collection text not null,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists records_collection_idx on records (collection);

-- Profile pictures (small square thumbnails saved as text).
alter table profiles add column if not exists photo text not null default '';
alter table students add column if not exists photo text not null default '';

------------------------------------------------------------------------
-- 2. Helper functions (they look up the signed-in user's role)
------------------------------------------------------------------------

create or replace function my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and active $$;

create or replace function my_kid_ids() returns setof uuid
language sql stable security definer set search_path = public as
$$ select student_id from parent_students where parent_id = auth.uid() $$;

create or replace function my_class_ids() returns setof text
language sql stable security definer set search_path = public as
$$ select distinct s.class_id from students s
   join parent_students ps on ps.student_id = s.id
   where ps.parent_id = auth.uid() $$;

-- Lets the login page turn a username into the login address behind it.
create or replace function login_email(p_username text) returns text
language sql stable security definer set search_path = public as
$$ select email from profiles where username = lower(trim(p_username)) limit 1 $$;
revoke all on function login_email(text) from public;
grant execute on function login_email(text) to anon, authenticated;

-- Which records a signed-in user may read.
create or replace function can_read_record(c text, rid text, d jsonb) returns boolean
language plpgsql stable security definer set search_path = public as
$$
declare r text := my_role();
begin
  if r in ('admin','principal','teacher') then return true; end if;
  if r is distinct from 'parent' then return false; end if;
  if c in ('att','res','pub') then
    return split_part(rid, '|', 2) in (select my_class_ids());
  elsif c = 'tt' then
    return rid in (select my_class_ids());
  elsif c in ('hw','datesheet') then
    return (d->>'cid') in (select my_class_ids());
  elsif c = 'hwSub' then
    return true;
  elsif c = 'leaves' then
    return (d->>'sid') in (select k::text from my_kid_ids() k);
  elsif c = 'anns' then
    return (d->'aud'->>'kind') in ('all','parents')
        or ((d->'aud'->>'kind') = 'classes' and exists (
              select 1 from jsonb_array_elements_text(coalesce(d->'aud'->'cids','[]'::jsonb)) x
              where x in (select my_class_ids())));
  elsif c = 'events' then
    return (d->'to'->>'role') = 'parent' and (
              (d->'to'->>'id') = auth.uid()::text
           or ((d->'to'->>'id') is null and (d->'to'->'cids') is null)
           or exists (
              select 1 from jsonb_array_elements_text(coalesce(d->'to'->'cids','[]'::jsonb)) x
              where x in (select my_class_ids())));
  end if;
  return false;   -- parents never see teacher attendance (tatt) or teacher leave (tleaves)
end
$$;

-- Which records a signed-in user may create, change or delete.
create or replace function can_write_record(c text, d jsonb) returns boolean
language plpgsql stable security definer set search_path = public as
$$
declare r text := my_role();
begin
  if c in ('tt','datesheet') then return r = 'admin'; end if;   -- only the Admin posts timetables and date sheets
  if r in ('admin','principal','teacher') then return true; end if;
  if r = 'parent' then
    if c = 'leaves' then
      return (d->>'sid') in (select k::text from my_kid_ids() k);
    elsif c in ('hwSub','events') then
      return true;
    end if;
  end if;
  return false;
end
$$;

------------------------------------------------------------------------
-- 3. Row level security: who can see and change what
------------------------------------------------------------------------

alter table profiles            enable row level security;
alter table subjects            enable row level security;
alter table classes             enable row level security;
alter table students            enable row level security;
alter table parent_students     enable row level security;
alter table teacher_assignments enable row level security;
alter table records             enable row level security;

-- profiles: staff see everyone; parents see themselves and school staff.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated using (
  id = auth.uid()
  or my_role() in ('admin','principal','teacher')
  or (my_role() = 'parent' and role in ('teacher','principal'))
);
drop policy if exists profiles_admin_write on profiles;
create policy profiles_admin_write on profiles for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- subjects, classes, teacher assignments: everyone signed in can read, only Admin changes.
drop policy if exists subjects_select on subjects;
create policy subjects_select on subjects for select to authenticated using (true);
drop policy if exists subjects_admin on subjects;
create policy subjects_admin on subjects for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

drop policy if exists classes_select on classes;
create policy classes_select on classes for select to authenticated using (true);
drop policy if exists classes_admin on classes;
create policy classes_admin on classes for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

drop policy if exists assignments_select on teacher_assignments;
create policy assignments_select on teacher_assignments for select to authenticated using (true);
drop policy if exists assignments_admin on teacher_assignments;
create policy assignments_admin on teacher_assignments for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- students: staff see all; a parent sees the students in the classes of their own children.
drop policy if exists students_select on students;
create policy students_select on students for select to authenticated using (
  my_role() in ('admin','principal','teacher')
  or class_id in (select my_class_ids())
);
drop policy if exists students_admin on students;
create policy students_admin on students for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- parent links: staff see all; a parent sees only their own links. Only Admin changes them.
drop policy if exists parent_students_select on parent_students;
create policy parent_students_select on parent_students for select to authenticated using (
  my_role() in ('admin','principal','teacher') or parent_id = auth.uid()
);
drop policy if exists parent_students_admin on parent_students;
create policy parent_students_admin on parent_students for all to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- records: see the helper functions above.
drop policy if exists records_select on records;
create policy records_select on records for select to authenticated
  using (can_read_record(collection, id, data));
drop policy if exists records_insert on records;
create policy records_insert on records for insert to authenticated
  with check (can_write_record(collection, data));
drop policy if exists records_update on records;
create policy records_update on records for update to authenticated
  using (can_write_record(collection, data)) with check (can_write_record(collection, data));
drop policy if exists records_delete on records;
create policy records_delete on records for delete to authenticated
  using (can_write_record(collection, data));

------------------------------------------------------------------------
-- 4. Starter subjects (Admin can add, rename or remove them in the app)
------------------------------------------------------------------------

insert into subjects (code, name) values
  ('math','Mathematics'), ('eng','English'), ('urdu','Urdu'), ('phy','Physics'),
  ('chem','Chemistry'), ('bio','Biology'), ('isl','Islamiat'), ('comp','Computer Science')
on conflict (code) do nothing;
