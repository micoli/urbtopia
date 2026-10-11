-- Every object created here is prefixed `urb_`.

-- A Lot item never names an inherited JavaScript object key: the client indexes plain objects with it.
create or replace function public.urb_lot_is_valid(p_lot jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_line jsonb;
  v_items text[] := array[]::text[];
  v_item text;
begin
  if p_lot is null or jsonb_typeof(p_lot) <> 'array' or jsonb_array_length(p_lot) not between 1 and 10 then
    return false;
  end if;
  for v_line in select * from jsonb_array_elements(p_lot) loop
    if jsonb_typeof(v_line) <> 'object' or jsonb_typeof(v_line -> 'item') <> 'string' or jsonb_typeof(v_line -> 'quantity') <> 'number' then
      return false;
    end if;
    v_item := v_line ->> 'item';
    if v_item !~ '^[A-Za-z0-9-][A-Za-z0-9_-]{0,39}$' or v_item = any (v_items) then
      return false;
    end if;
    if v_item in ('constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf') then
      return false;
    end if;
    if (v_line ->> 'quantity') !~ '^[1-9][0-9]{0,3}$' then
      return false;
    end if;
    v_items := v_items || v_item;
  end loop;
  return true;
end;
$$;
