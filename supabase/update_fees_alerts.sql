-- FG Campus update: fee records and phone alerts.
-- Run this once in the Supabase SQL editor. It is safe to run again.

-- 1. Who can see and change fee records (fees, feeCfg are stored in the records table)
create or replace function can_read_record(c text, rid text, d jsonb) returns boolean
language plpgsql stable security definer set search_path = public as
$$
declare r text := my_role();
begin
  if c in ('fees','feeCfg') then
    -- fee records: office staff see all; a parent sees only their own children's fees; teachers see none
    if r in ('admin','principal') then return true; end if;
    if r = 'parent' then
      if c = 'fees' then return split_part(rid, '|', 1) in (select k::text from my_kid_ids() k); end if;
      return rid in (select my_class_ids());
    end if;
    return false;
  end if;
  if r in ('admin','principal','teacher') then return true; end if;
  if r is distinct from 'parent' then return false; end if;
  if c in ('att','res','pub') then
    return split_part(rid, '|', 2) in (select my_class_ids());
  elsif c = 'tt' then
    return rid in (select my_class_ids());
  elsif c in ('hw','datesheet') then
    return (d->>'cid') in (select my_class_ids());
  elsif c = 'hwSub' then
    -- homework hand-in marks: only for homework that belongs to one of the parent's classes
    return exists (select 1 from records h where h.collection = 'hw' and h.id = rid
                   and (h.data->>'cid') in (select my_class_ids()));
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

create or replace function can_write_record(c text, d jsonb) returns boolean
language plpgsql stable security definer set search_path = public as
$$
declare r text := my_role();
begin
  if c in ('fees','feeCfg') then return r in ('admin','principal'); end if;   -- only office staff change fees
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

-- 2. Phone alert subscriptions (only the server function can read or write this table)
create table if not exists push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  sub jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on push_subs (user_id);
alter table push_subs enable row level security;
