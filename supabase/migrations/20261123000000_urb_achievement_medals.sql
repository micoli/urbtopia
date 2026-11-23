-- The Medal of a completed Achievement category belongs to the Player account, one per category, whichever City completed it first.
-- Like the Donation Medals it has no Challenge, and the server trusts the client's declaration of the completion (ADR 0094).
create function public.urb_record_achievement_medal(p_category text, p_name_fr text, p_name_en text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_code text;
  v_inserted integer;
begin
  if p_category is null or p_category !~ '^[a-z]{1,26}$'
     or p_name_fr is null or length(p_name_fr) not between 1 and 60
     or p_name_en is null or length(p_name_en) not between 1 and 60 then
    raise exception 'urb_achievement_invalid' using errcode = '22023';
  end if;
  v_code := 'achievements-' || p_category;
  insert into public.urb_medals (user_id, challenge_id, medal_code, name_fr, name_en)
    values (v_user, null, v_code, p_name_fr, p_name_en)
    on conflict (user_id, medal_code) where challenge_id is null do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    perform public.urb_bump_social(v_user);
    perform public.urb_bump_friends(v_user);
  end if;
  return jsonb_build_object('medalCode', v_code, 'earned', v_inserted > 0);
end;
$$;

revoke execute on function public.urb_record_achievement_medal(text, text, text) from public, anon;
grant execute on function public.urb_record_achievement_medal(text, text, text) to authenticated;
