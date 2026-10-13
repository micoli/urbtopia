-- Daily challenges are renewed at 07:00 Paris time (CET in winter, CEST in summer), not at midnight UTC.
-- pg_cron runs in UTC, so it ticks every hour and the function publishes the day's Challenges once, at the first tick from 07:00.
create or replace function public.urb_generate_daily_challenges()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_local timestamp := (now() at time zone 'Europe/Paris') - interval '7 hours';
  v_start timestamptz := (date_trunc('day', v_local) + interval '7 hours') at time zone 'Europe/Paris';
  v_end timestamptz := (date_trunc('day', v_local) + interval '1 day 7 hours') at time zone 'Europe/Paris';
  v_pair record;
  v_goal jsonb;
begin
  if exists (select 1 from public.urb_challenges where kind = 'daily' and starts_at = v_start) then
    return;
  end if;
  for v_pair in select distinct difficulty, band from public.urb_challenge_templates loop
    select t.goal into v_goal from public.urb_challenge_templates t
      where t.difficulty = v_pair.difficulty and t.band = v_pair.band order by random() limit 1;
    insert into public.urb_challenges (kind, difficulty, min_citizens, goal, reward_kind, name_keys, starts_at, ends_at)
      values ('daily', v_pair.difficulty, v_pair.band, v_goal, 'urbs',
              jsonb_build_object('hook', floor(random() * 1000)::integer, 'item', v_goal -> 0 ->> 'item'),
              v_start, v_end)
      on conflict do nothing;
  end loop;
end;
$$;

revoke execute on function public.urb_generate_daily_challenges() from public, anon, authenticated;

select cron.schedule('urb_generate_daily_challenges', '0 * * * *', 'select public.urb_generate_daily_challenges()');
