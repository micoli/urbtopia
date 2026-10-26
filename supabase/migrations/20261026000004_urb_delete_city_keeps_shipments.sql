-- A City with a waiting Shipment, sent or received, cannot lose its Cloud save: the Lot in Escrow would have nowhere to go (ADR 0048).

create or replace function public.urb_delete_city_saves(p_city_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  if exists (
    select 1 from public.urb_shipments
    where user_id = auth.uid() and state = 'waiting' and p_city_id in (from_city_id, to_city_id)
  ) then
    raise exception 'urb_city_has_shipments' using errcode = 'P0001';
  end if;
  delete from public.urb_saves where user_id = auth.uid() and city_id = p_city_id;
end;
$$;
