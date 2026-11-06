-- Bug reports (ADR 0058): a Player account with an email writes to the Admin, with optional attachments kept in the database.
-- Written only through urb_* functions; the Admin works through the service key. Every object created here is prefixed `urb_`.

create table public.urb_bug_reports (
  id bigint generated always as identity primary key,
  author_id uuid not null references auth.users (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 4000),
  status text not null default 'new' check (status in ('new', 'seen', 'resolved')),
  camera jsonb check (camera is null or pg_column_size(camera) <= 4000),
  context jsonb not null default '{}'::jsonb check (pg_column_size(context) <= 20000),
  city_id text check (city_id is null or char_length(city_id) <= 100),
  city_seed text check (city_seed is null or char_length(city_seed) <= 200),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  author_unread boolean not null default false,
  admin_unread boolean not null default true
);

create index urb_bug_reports_author_idx on public.urb_bug_reports (author_id, created_at desc);
create index urb_bug_reports_status_idx on public.urb_bug_reports (status, created_at desc);

-- Apart from the report so that lists never load the blobs.
create table public.urb_bug_report_attachments (
  report_id bigint primary key references public.urb_bug_reports (id) on delete cascade,
  screenshot text check (screenshot is null or char_length(screenshot) <= 400000),
  city_json jsonb check (city_json is null or pg_column_size(city_json) <= 2000000),
  city_gzip text check (city_gzip is null or char_length(city_gzip) <= 2800000),
  constraint urb_bug_report_one_city check (city_json is null or city_gzip is null)
);

create table public.urb_bug_report_replies (
  id bigint generated always as identity primary key,
  report_id bigint not null references public.urb_bug_reports (id) on delete cascade,
  from_admin boolean not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index urb_bug_report_replies_report_idx on public.urb_bug_report_replies (report_id, id);

alter table public.urb_bug_reports enable row level security;
alter table public.urb_bug_report_attachments enable row level security;
alter table public.urb_bug_report_replies enable row level security;
revoke all on public.urb_bug_reports from public, anon, authenticated;
revoke all on public.urb_bug_report_attachments from public, anon, authenticated;
revoke all on public.urb_bug_report_replies from public, anon, authenticated;

-- A reply raises the unread flag of the other side. A report takes its resolution date when it is resolved.
create function public.urb_bug_report_on_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.from_admin then
    update public.urb_bug_reports set author_unread = true where id = new.report_id;
  else
    update public.urb_bug_reports set admin_unread = true where id = new.report_id;
  end if;
  return new;
end;
$$;

create trigger urb_bug_report_reply_flags after insert on public.urb_bug_report_replies
  for each row execute function public.urb_bug_report_on_reply();

create function public.urb_bug_report_on_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'resolved' and old.status <> 'resolved' then
    new.resolved_at := now();
  elsif new.status <> 'resolved' then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create trigger urb_bug_report_status_date before update of status on public.urb_bug_reports
  for each row execute function public.urb_bug_report_on_status();

-- Internal: an account with an attached email. The Handle is not required.
create function public.urb_report_member()
returns uuid
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
  if not exists (select 1 from auth.users u where u.id = v_user and u.email is not null) then
    raise exception 'urb_email_required' using errcode = 'P0001';
  end if;
  return v_user;
end;
$$;

create function public.urb_send_bug_report(
  p_description text,
  p_camera jsonb,
  p_context jsonb,
  p_city_id text,
  p_city_seed text,
  p_screenshot text,
  p_city_json jsonb,
  p_city_gzip text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_report_member();
  v_description text := btrim(coalesce(p_description, ''));
  v_recent integer;
  v_wait numeric;
  v_id bigint;
begin
  if char_length(v_description) not between 1 and 4000 then
    raise exception 'urb_report_invalid' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 4));

  select count(*), extract(epoch from min(created_at) + interval '1 day' - now())
    into v_recent, v_wait
    from public.urb_bug_reports
    where author_id = v_user and created_at > now() - interval '1 day';
  if v_recent >= 5 then
    raise exception 'urb_rate_limited' using errcode = 'P0001', detail = greatest(1, ceil(v_wait))::text;
  end if;

  insert into public.urb_bug_reports (author_id, description, camera, context, city_id, city_seed)
    values (v_user, v_description, p_camera, coalesce(p_context, '{}'::jsonb), p_city_id, p_city_seed)
    returning id into v_id;

  if p_screenshot is not null or p_city_json is not null or p_city_gzip is not null then
    insert into public.urb_bug_report_attachments (report_id, screenshot, city_json, city_gzip)
      values (v_id, p_screenshot, p_city_json, p_city_gzip);
  end if;
  return v_id;
end;
$$;

-- The reports of the caller, newest first, without any attachment.
create function public.urb_list_bug_reports()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'description', r.description,
    'status', r.status,
    'createdAt', r.created_at,
    'unread', r.author_unread
  ) order by r.id desc), '[]'::jsonb)
  from public.urb_bug_reports r
  where r.author_id = public.urb_report_member();
$$;

-- One report of the caller with its replies; reading it clears the unread flag.
create function public.urb_get_bug_report(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_report_member();
  v_report public.urb_bug_reports;
begin
  select * into v_report from public.urb_bug_reports where id = p_id and author_id = v_user;
  if not found then
    raise exception 'urb_report_not_found' using errcode = 'P0001';
  end if;
  update public.urb_bug_reports set author_unread = false where id = p_id and author_unread;
  return jsonb_build_object(
    'id', v_report.id,
    'description', v_report.description,
    'status', v_report.status,
    'createdAt', v_report.created_at,
    'replies', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'fromAdmin', p.from_admin, 'body', p.body, 'createdAt', p.created_at) order by p.id)
      from public.urb_bug_report_replies p where p.report_id = p_id
    ), '[]'::jsonb)
  );
end;
$$;

create function public.urb_reply_to_bug_report(p_id bigint, p_body text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_report_member();
  v_body text := btrim(coalesce(p_body, ''));
  v_status text;
  v_id bigint;
begin
  if char_length(v_body) not between 1 and 500 then
    raise exception 'urb_reply_invalid' using errcode = 'P0001';
  end if;
  select status into v_status from public.urb_bug_reports where id = p_id and author_id = v_user;
  if not found then
    raise exception 'urb_report_not_found' using errcode = 'P0001';
  end if;
  if v_status = 'resolved' then
    raise exception 'urb_report_closed' using errcode = 'P0001';
  end if;
  insert into public.urb_bug_report_replies (report_id, from_admin, body) values (p_id, false, v_body)
    returning id into v_id;
  return v_id;
end;
$$;

create function public.urb_purge_bug_reports()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.urb_bug_reports
  where created_at < now() - interval '90 days'
     or resolved_at < now() - interval '30 days';
$$;

revoke execute on function public.urb_bug_report_on_reply() from public, anon, authenticated;
revoke execute on function public.urb_bug_report_on_status() from public, anon, authenticated;
revoke execute on function public.urb_report_member() from public, anon, authenticated;
revoke execute on function public.urb_purge_bug_reports() from public, anon, authenticated;
revoke execute on function public.urb_send_bug_report(text, jsonb, jsonb, text, text, text, jsonb, text) from public, anon;
revoke execute on function public.urb_list_bug_reports() from public, anon;
revoke execute on function public.urb_get_bug_report(bigint) from public, anon;
revoke execute on function public.urb_reply_to_bug_report(bigint, text) from public, anon;
grant execute on function public.urb_send_bug_report(text, jsonb, jsonb, text, text, text, jsonb, text) to authenticated;
grant execute on function public.urb_list_bug_reports() to authenticated;
grant execute on function public.urb_get_bug_report(bigint) to authenticated;
grant execute on function public.urb_reply_to_bug_report(bigint, text) to authenticated;

select cron.schedule('urb_purge_bug_reports', '41 3 * * *', 'select public.urb_purge_bug_reports()');
