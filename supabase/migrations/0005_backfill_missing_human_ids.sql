-- 0005_backfill_missing_human_ids.sql
-- OPTIONAL / COSMETIC. Apply whenever convenient — nothing is broken without it.
--
-- Before 0004, `guard_profile_self_update` also fired for service-role writes
-- (triggers run regardless of the calling role, and a service-role request has
-- no auth.uid(), so current_role_is_admin() read false). That silently reverted
-- the `human_id` that `createTeamMember` sets on new accounts — so any team
-- member created while that bug was live has a NULL human_id and shows no
-- "Specialist ID" on their profile.
--
-- 0004 fixed the trigger for all FUTURE accounts. This backfills the existing
-- ones. Idempotent — only touches rows where human_id is still null, and
-- retries on the (unlikely) unique collision.

do $$
declare
  target record;
  candidate text;
  attempts int;
begin
  for target in select id from public.profiles where human_id is null loop
    attempts := 0;
    loop
      attempts := attempts + 1;
      -- Same shape as genSpecialistId() in src/lib/ids.ts: "OCS-4821".
      candidate := 'OCS-' || lpad((1000 + floor(random() * 9000))::int::text, 4, '0');
      begin
        update public.profiles set human_id = candidate where id = target.id;
        exit; -- success
      exception when unique_violation then
        if attempts >= 20 then
          raise notice 'Could not allocate a unique human_id for profile % after % attempts', target.id, attempts;
          exit;
        end if;
        -- else: loop and try another number
      end;
    end loop;
  end loop;
end $$;
