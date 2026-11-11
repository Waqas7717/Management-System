-- Run once in Supabase SQL Editor (safe to run again).
-- Tightens two read rules for parents:
--   1. A notification sent to selected students is only visible to the parents of those students.
--   2. Homework hand-in marks are only visible for homework of the parent's own classes.

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
    -- homework hand-in marks: only for homework that belongs to one of the parent's classes
    return exists (select 1 from records h where h.collection = 'hw' and h.id = rid
                   and (h.data->>'cid') in (select my_class_ids()));
  elsif c = 'leaves' then
    return (d->>'sid') in (select k::text from my_kid_ids() k);
  elsif c = 'anns' then
    return (d->'aud'->>'kind') in ('all','parents')
        or ((d->'aud'->>'kind') = 'classes' and exists (
              select 1 from jsonb_array_elements_text(coalesce(d->'aud'->'cids','[]'::jsonb)) x
              where x in (select my_class_ids())
                and (jsonb_array_length(coalesce(d->'aud'->'sids','[]'::jsonb)) = 0
                     or exists (select 1 from jsonb_array_elements_text(d->'aud'->'sids') y
                                where y in (select k::text from my_kid_ids() k)))));
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
