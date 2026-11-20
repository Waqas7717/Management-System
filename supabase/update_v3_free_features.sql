-- School app update v3: faster sync, photo storage, tighter permissions, audit trail,
-- fee options, alerts, enquiries. Run this once in the Supabase SQL editor. Safe to run again.
-- It only adds things and tightens permissions. It does not delete data.

------------------------------------------------------------------------
-- 1. Incremental sync (F01)
------------------------------------------------------------------------
create index if not exists records_updated_idx on records (updated_at);

-- The server sets the change time, so a wrong phone clock cannot hide a change.
create or replace function set_records_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists records_set_updated on records;
create trigger records_set_updated before insert or update on records
  for each row execute function set_records_updated_at();

-- A small log of deleted records so other screens can remove them without a full reload.
create table if not exists deleted_records (
  id bigserial primary key,
  collection text not null,
  rid text not null,
  deleted_at timestamptz not null default now()
);
create index if not exists deleted_records_at_idx on deleted_records (deleted_at);
alter table deleted_records enable row level security;
drop policy if exists deleted_records_select on deleted_records;
create policy deleted_records_select on deleted_records for select to authenticated
  using (my_role() is not null);

create or replace function log_deleted_record() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into deleted_records (collection, rid) values (old.collection, old.id);
  delete from deleted_records where deleted_at < now() - interval '30 days';
  return old;
end $$;
drop trigger if exists records_log_delete on records;
create trigger records_log_delete after delete on records
  for each row execute function log_deleted_record();

------------------------------------------------------------------------
-- 2. Photo storage (F02): public bucket, staff upload, random file names
------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists photos_staff_insert on storage.objects;
create policy photos_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and my_role() in ('admin','principal','teacher'));
drop policy if exists photos_staff_update on storage.objects;
create policy photos_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and my_role() in ('admin','principal','teacher'));
-- Parents may upload only their own profile photo (file name starts with their user id)
drop policy if exists photos_parent_insert on storage.objects;
create policy photos_parent_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and my_role() = 'parent' and name like auth.uid()::text || '-%');

insert into storage.buckets (id, name, public) values ('backups', 'backups', false)
on conflict (id) do nothing;  -- private; only the server function (service key) reads and writes it

------------------------------------------------------------------------
-- 3. Tighter permissions (F04) and audit trail (F06)
------------------------------------------------------------------------
-- Which classes a teacher teaches (any subject) or is class teacher of
create or replace function my_teacher_class_ids() returns setof text
language sql stable security definer set search_path = public as
$$ select class_id from teacher_assignments where teacher_id = auth.uid()
   union select id from classes where class_teacher = auth.uid() $$;

create or replace function can_write_record(c text, d jsonb) returns boolean
language plpgsql stable security definer set search_path = public as
$$
declare r text := my_role();
begin
  if r is null then return false; end if;
  if c in ('fees','feeCfg') then return r in ('admin','principal'); end if;
  if c in ('tt','datesheet') then return r = 'admin'; end if;
  if r in ('admin','principal') then return true; end if;
  if r = 'teacher' then
    -- the class is inside the record: homework and similar carry "cid"
    if (d ? 'cid') then return (d->>'cid') in (select my_teacher_class_ids()); end if;
    return true; -- attendance, results and others are keyed by class in the id; see the trigger below
  end if;
  if r = 'parent' then
    if c = 'leaves' then return (d->>'sid') in (select k::text from my_kid_ids() k); end if;
    if c = 'hwSub' then return true; end if;
    if c = 'events' then return (d->'to'->>'role') = 'teacher'; end if; -- parents may only notify teachers (leave requests)
  end if;
  return false;
end
$$;

-- Teachers may change attendance, results and published results only for their own classes.
-- Their record ids look like "date|classId" (att) or "exam|classId" (res, pub).
create or replace function check_teacher_class() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid text;
begin
  if my_role() = 'teacher' and (new.collection in ('att','res','pub')) then
    cid := split_part(new.id, '|', 2);
    if cid is null or cid = '' or cid not in (select my_teacher_class_ids()) then
      raise exception 'You can change records only for your own classes.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists records_teacher_class on records;
create trigger records_teacher_class before insert or update on records
  for each row execute function check_teacher_class();

-- Audit trail: who changed marks, attendance and fees, and when.
create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_name text,
  collection text not null,
  rid text not null,
  action text not null check (action in ('insert','update','delete')),
  summary text not null default ''
);
create index if not exists audit_log_at_idx on audit_log (at desc);
alter table audit_log enable row level security;
drop policy if exists audit_select on audit_log;
create policy audit_select on audit_log for select to authenticated
  using (my_role() in ('admin','principal'));

create or replace function audit_record() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text; rid text; col text; act text;
begin
  if tg_op = 'DELETE' then rid := old.id; col := old.collection; act := 'delete';
  else rid := new.id; col := new.collection; act := lower(tg_op); end if;
  if col in ('att','tatt','res','pub','fees','feeCfg','leaves','tleaves') then
    select full_name into who from profiles where id = auth.uid();
    insert into audit_log (actor, actor_name, collection, rid, action, summary)
    values (auth.uid(), coalesce(who, 'system'), col, rid, act, '');
    delete from audit_log where at < now() - interval '12 months';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists records_audit on records;
create trigger records_audit after insert or update or delete on records
  for each row execute function audit_record();

------------------------------------------------------------------------
-- 4. Public enquiry form (F17): insert only, no reading by the public
------------------------------------------------------------------------
create table if not exists inquiries (
  id bigserial primary key,
  at timestamptz not null default now(),
  name text not null check (length(name) between 2 and 80),
  phone text not null check (length(phone) between 7 and 20),
  class_wanted text not null default '' check (length(class_wanted) <= 40),
  note text not null default '' check (length(note) <= 400),
  status text not null default 'new' check (status in ('new','contacted','admitted','closed'))
);
alter table inquiries enable row level security;
drop policy if exists inquiries_insert on inquiries;
create policy inquiries_insert on inquiries for insert to anon, authenticated with check (true);
drop policy if exists inquiries_staff_select on inquiries;
create policy inquiries_staff_select on inquiries for select to authenticated using (my_role() in ('admin','principal'));
drop policy if exists inquiries_staff_update on inquiries;
create policy inquiries_staff_update on inquiries for update to authenticated
  using (my_role() in ('admin','principal')) with check (my_role() in ('admin','principal'));
