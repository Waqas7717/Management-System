-- Run once in Supabase SQL Editor (safe to run again).
-- Lets parents read timetables and school-wide events, and limits timetable and date sheet writing to the Admin.

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

