-- The Hall of fame lists the other cities: the player's own is never shown, and the ranks count only the others.

create or replace function public.urb_hall_of_fame()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'userId', ranked.user_id, 'handle', ranked.handle, 'avatar', ranked.avatar,
      'citizens', ranked.ranking_citizens, 'rank', ranked.place
    ) order by ranked.place)
    from (
      select s.user_id, p.handle, p.avatar, s.ranking_citizens,
             row_number() over (order by s.ranking_citizens desc, p.created_at, s.user_id) as place
      from public.urb_showcase s
      join public.urb_profiles p on p.user_id = s.user_id
      where s.user_id <> v_user
        and not p.hall_of_fame_opted_out
        and not exists (
          select 1 from public.urb_friendships f
          where f.state = 'blocked' and f.user_low = least(s.user_id, v_user) and f.user_high = greatest(s.user_id, v_user)
        )
      order by place
      limit 10
    ) ranked
  ), '[]'::jsonb);
end;
$$;
