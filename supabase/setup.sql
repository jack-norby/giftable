-- Giftable database setup
-- Run this once in the Supabase SQL editor (or via the Supabase connector).
--
-- How security works:
--   * Nobody touches the tables directly. RLS is on with no policies.
--   * The web app only calls the functions below.
--   * Reading lists is open to anyone with the site link.
--   * Changing a list needs that person's secret edit token.
--   * Un-claiming a gift needs the claim key the claimer's browser got back.

create extension if not exists pgcrypto;

-- People -------------------------------------------------------------------
create table if not exists giftable_people (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  colors      text not null default '',
  sizes       jsonb not null default '{}'::jsonb,
  sort        int  not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists giftable_secrets (
  person_id   uuid primary key references giftable_people(id) on delete cascade,
  edit_token  text not null unique default encode(gen_random_bytes(12), 'hex')
);

-- Wish-list items ------------------------------------------------------------
create table if not exists giftable_items (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references giftable_people(id) on delete cascade,
  category    text not null,
  name        text not null,
  link        text not null default '',
  price       text not null default '',
  priority    text not null default 'like',
  size        text not null default '',
  color       text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists giftable_items_person on giftable_items(person_id);

-- Claims ("I'm getting this") ------------------------------------------------
create table if not exists giftable_claims (
  item_id     uuid primary key references giftable_items(id) on delete cascade,
  claimed_by  text not null,
  claim_key   text not null default encode(gen_random_bytes(12), 'hex'),
  created_at  timestamptz not null default now()
);

alter table giftable_people  enable row level security;
alter table giftable_secrets enable row level security;
alter table giftable_items   enable row level security;
alter table giftable_claims  enable row level security;

revoke all on giftable_people, giftable_secrets, giftable_items, giftable_claims from anon, authenticated;

-- Helpers --------------------------------------------------------------------
create or replace function giftable_person_for(p_token text)
returns uuid language sql stable security definer set search_path = public as $$
  select person_id from giftable_secrets where edit_token = p_token;
$$;
revoke all on function giftable_person_for(text) from public, anon, authenticated;

-- Read everything (no secrets) -----------------------------------------------
create or replace function giftable_get_all()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'people', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'name', name, 'colors', colors, 'sizes', sizes, 'sort', sort)
        order by sort, name) from giftable_people), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'person_id', person_id, 'category', category, 'name', name, 'link', link,
        'price', price, 'priority', priority, 'size', size, 'color', color, 'notes', notes,
        'created_at', created_at) order by created_at) from giftable_items), '[]'::jsonb),
    'claims', coalesce((select jsonb_agg(jsonb_build_object(
        'item_id', item_id, 'claimed_by', claimed_by)) from giftable_claims), '[]'::jsonb)
  );
$$;

-- Does this edit token belong to this person? ----------------------------------
create or replace function giftable_check_token(p_slug text, p_token text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from giftable_people p join giftable_secrets s on s.person_id = p.id
    where p.slug = p_slug and s.edit_token = p_token);
$$;

-- Add or update an item --------------------------------------------------------
create or replace function giftable_save_item(p_token text, p_item jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_person uuid := giftable_person_for(p_token);
  v_id uuid;
begin
  if v_person is null then raise exception 'Invalid edit link'; end if;
  if coalesce(trim(p_item->>'name'), '') = '' then raise exception 'Item needs a name'; end if;

  if p_item ? 'id' and nullif(p_item->>'id', '') is not null then
    update giftable_items set
      category = left(coalesce(p_item->>'category', category), 40),
      name     = left(p_item->>'name', 200),
      link     = left(coalesce(p_item->>'link', ''), 1000),
      price    = left(coalesce(p_item->>'price', ''), 40),
      priority = left(coalesce(p_item->>'priority', 'like'), 20),
      size     = left(coalesce(p_item->>'size', ''), 60),
      color    = left(coalesce(p_item->>'color', ''), 60),
      notes    = left(coalesce(p_item->>'notes', ''), 1000)
    where id = (p_item->>'id')::uuid and person_id = v_person
    returning id into v_id;
    if v_id is null then raise exception 'Item not found'; end if;
  else
    insert into giftable_items (person_id, category, name, link, price, priority, size, color, notes)
    values (v_person,
      left(coalesce(p_item->>'category', 'other'), 40),
      left(p_item->>'name', 200),
      left(coalesce(p_item->>'link', ''), 1000),
      left(coalesce(p_item->>'price', ''), 40),
      left(coalesce(p_item->>'priority', 'like'), 20),
      left(coalesce(p_item->>'size', ''), 60),
      left(coalesce(p_item->>'color', ''), 60),
      left(coalesce(p_item->>'notes', ''), 1000))
    returning id into v_id;
  end if;
  update giftable_people set updated_at = now() where id = v_person;
  return jsonb_build_object('id', v_id);
end;
$$;

create or replace function giftable_delete_item(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_person uuid := giftable_person_for(p_token);
begin
  if v_person is null then raise exception 'Invalid edit link'; end if;
  delete from giftable_items where id = p_id and person_id = v_person;
end;
$$;

-- Favorite colors and sizes ----------------------------------------------------
create or replace function giftable_save_profile(p_token text, p_colors text, p_sizes jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_person uuid := giftable_person_for(p_token);
begin
  if v_person is null then raise exception 'Invalid edit link'; end if;
  update giftable_people
     set colors = left(coalesce(p_colors, ''), 300),
         sizes = coalesce(p_sizes, '{}'::jsonb),
         updated_at = now()
   where id = v_person;
end;
$$;

-- Claim / un-claim a gift ------------------------------------------------------
create or replace function giftable_claim(p_item_id uuid, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'Please enter your name'; end if;
  insert into giftable_claims (item_id, claimed_by) values (p_item_id, left(trim(p_name), 60))
  on conflict (item_id) do nothing
  returning claim_key into v_key;
  if v_key is null then raise exception 'Someone already claimed this gift'; end if;
  return v_key;
end;
$$;

create or replace function giftable_unclaim(p_item_id uuid, p_key text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  delete from giftable_claims where item_id = p_item_id and claim_key = p_key;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

grant execute on function
  giftable_get_all(), giftable_check_token(text, text),
  giftable_save_item(text, jsonb), giftable_delete_item(text, uuid),
  giftable_save_profile(text, text, jsonb),
  giftable_claim(uuid, text), giftable_unclaim(uuid, text)
to anon, authenticated;

-- The kids ---------------------------------------------------------------------
insert into giftable_people (slug, name, sort) values
  ('jack', 'Jack', 1), ('jillian', 'Jillian', 2), ('lila', 'Lila', 3), ('etta', 'Etta', 4)
on conflict (slug) do nothing;

insert into giftable_secrets (person_id)
select id from giftable_people
on conflict (person_id) do nothing;

-- Login with name + password ---------------------------------------------------
-- (Columns and functions say "pin" for history; they hold a password.)
-- Passwords are stored as bcrypt hashes, lowercased so capitals don't matter.
-- 5 wrong tries locks that name for 15 minutes.
alter table giftable_secrets add column if not exists pin_hash text;
alter table giftable_secrets add column if not exists failed_attempts int not null default 0;
alter table giftable_secrets add column if not exists locked_until timestamptz;

-- Returns {ok: true, token} or {ok: false, error}. It returns instead of raising
-- an error so the failed-attempt counter is saved.
create or replace function giftable_login(p_slug text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_person uuid; v_hash text; v_token text; v_fails int; v_locked timestamptz;
begin
  select s.person_id, s.pin_hash, s.edit_token, s.failed_attempts, s.locked_until
    into v_person, v_hash, v_token, v_fails, v_locked
    from giftable_secrets s join giftable_people p on p.id = s.person_id
   where p.slug = p_slug
   for update of s;
  if v_person is null or v_hash is null then
    return jsonb_build_object('ok', false, 'error', 'That name doesn''t have a PIN yet. Ask a parent to set one.');
  end if;
  if v_locked is not null and v_locked > now() then
    return jsonb_build_object('ok', false, 'error', 'Too many wrong tries. Wait 15 minutes and try again.');
  end if;
  if crypt(lower(trim(coalesce(p_pin, ''))), v_hash) = v_hash then
    update giftable_secrets set failed_attempts = 0, locked_until = null where person_id = v_person;
    return jsonb_build_object('ok', true, 'token', v_token);
  end if;
  v_fails := v_fails + 1;
  if v_fails >= 5 then
    update giftable_secrets set failed_attempts = 0, locked_until = now() + interval '15 minutes'
     where person_id = v_person;
    return jsonb_build_object('ok', false, 'error', 'Too many wrong tries. Wait 15 minutes and try again.');
  end if;
  update giftable_secrets set failed_attempts = v_fails where person_id = v_person;
  return jsonb_build_object('ok', false, 'error', 'Wrong PIN. Try again.');
end;
$$;

create or replace function giftable_set_pin(p_token text, p_pin text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_person uuid := giftable_person_for(p_token);
begin
  if v_person is null then raise exception 'Please log in again'; end if;
  if length(lower(trim(coalesce(p_pin, '')))) not between 4 and 60 then
    raise exception 'Password needs at least 4 characters';
  end if;
  update giftable_secrets
     set pin_hash = crypt(lower(trim(p_pin)), gen_salt('bf')), failed_attempts = 0, locked_until = null
   where person_id = v_person;
end;
$$;

grant execute on function giftable_login(text, text), giftable_set_pin(text, text) to anon, authenticated;

-- Set or reset someone's password (run in the SQL Editor; change the name and
-- password, and type the password in lowercase):
-- update giftable_secrets set pin_hash = crypt('newpassword', gen_salt('bf')), failed_attempts = 0, locked_until = null
--  where person_id = (select id from giftable_people where slug = 'jack');

-- =============================================================================
-- Update 3: protect claimed gifts, "bought" checkmarks, edit warnings.
-- Safe to run more than once. Later definitions replace earlier ones above.
-- =============================================================================
alter table giftable_items  add column if not exists updated_at timestamptz;
alter table giftable_items  add column if not exists removed_at timestamptz;
alter table giftable_claims add column if not exists bought boolean not null default false;

create or replace function giftable_get_all()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'people', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'name', name, 'colors', colors, 'sizes', sizes, 'sort', sort)
        order by sort, name) from giftable_people), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'person_id', person_id, 'category', category, 'name', name, 'link', link,
        'price', price, 'priority', priority, 'size', size, 'color', color, 'notes', notes,
        'created_at', created_at, 'updated_at', updated_at, 'removed_at', removed_at)
        order by created_at) from giftable_items), '[]'::jsonb),
    'claims', coalesce((select jsonb_agg(jsonb_build_object(
        'item_id', item_id, 'claimed_by', claimed_by, 'claimed_at', created_at, 'bought', bought))
        from giftable_claims), '[]'::jsonb)
  );
$$;

create or replace function giftable_save_item(p_token text, p_item jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_person uuid := giftable_person_for(p_token);
  v_id uuid;
begin
  if v_person is null then raise exception 'Please log in again'; end if;
  if coalesce(trim(p_item->>'name'), '') = '' then raise exception 'Item needs a name'; end if;

  if p_item ? 'id' and nullif(p_item->>'id', '') is not null then
    update giftable_items set
      category = left(coalesce(p_item->>'category', category), 40),
      name     = left(p_item->>'name', 200),
      link     = left(coalesce(p_item->>'link', ''), 1000),
      price    = left(coalesce(p_item->>'price', ''), 40),
      priority = left(coalesce(p_item->>'priority', 'like'), 20),
      size     = left(coalesce(p_item->>'size', ''), 60),
      color    = left(coalesce(p_item->>'color', ''), 60),
      notes    = left(coalesce(p_item->>'notes', ''), 1000),
      updated_at = now()
    where id = (p_item->>'id')::uuid and person_id = v_person and removed_at is null
    returning id into v_id;
    if v_id is null then raise exception 'Item not found'; end if;
  else
    insert into giftable_items (person_id, category, name, link, price, priority, size, color, notes)
    values (v_person,
      left(coalesce(p_item->>'category', 'other'), 40),
      left(p_item->>'name', 200),
      left(coalesce(p_item->>'link', ''), 1000),
      left(coalesce(p_item->>'price', ''), 40),
      left(coalesce(p_item->>'priority', 'like'), 20),
      left(coalesce(p_item->>'size', ''), 60),
      left(coalesce(p_item->>'color', ''), 60),
      left(coalesce(p_item->>'notes', ''), 1000))
    returning id into v_id;
  end if;
  update giftable_people set updated_at = now() where id = v_person;
  return jsonb_build_object('id', v_id);
end;
$$;

-- A claimed gift isn't really deleted: it's hidden from everyone except the
-- giver who claimed it, so they know it was removed.
create or replace function giftable_delete_item(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_person uuid := giftable_person_for(p_token);
begin
  if v_person is null then raise exception 'Please log in again'; end if;
  if exists (select 1 from giftable_claims where item_id = p_id) then
    update giftable_items set removed_at = now() where id = p_id and person_id = v_person;
  else
    delete from giftable_items where id = p_id and person_id = v_person;
  end if;
end;
$$;

create or replace function giftable_claim(p_item_id uuid, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'Please enter your name'; end if;
  if not exists (select 1 from giftable_items where id = p_item_id and removed_at is null) then
    raise exception 'This gift was removed from the list';
  end if;
  insert into giftable_claims (item_id, claimed_by) values (p_item_id, left(trim(p_name), 60))
  on conflict (item_id) do nothing
  returning claim_key into v_key;
  if v_key is null then raise exception 'Someone already claimed this gift'; end if;
  return v_key;
end;
$$;

create or replace function giftable_unclaim(p_item_id uuid, p_key text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  delete from giftable_claims where item_id = p_item_id and claim_key = p_key;
  get diagnostics v_count = row_count;
  if v_count > 0 then
    delete from giftable_items where id = p_item_id and removed_at is not null;
  end if;
  return v_count > 0;
end;
$$;

create or replace function giftable_mark_bought(p_item_id uuid, p_key text, p_bought boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  update giftable_claims set bought = coalesce(p_bought, false)
   where item_id = p_item_id and claim_key = p_key;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

grant execute on function giftable_mark_bought(uuid, text, boolean) to anon, authenticated;

-- =============================================================================
-- Update 4: sale prices. Empty sale_price means the gift isn't on sale.
-- =============================================================================
alter table giftable_items add column if not exists sale_price text not null default '';

create or replace function giftable_get_all()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'people', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'slug', slug, 'name', name, 'colors', colors, 'sizes', sizes, 'sort', sort)
        order by sort, name) from giftable_people), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'person_id', person_id, 'category', category, 'name', name, 'link', link,
        'price', price, 'sale_price', sale_price, 'priority', priority, 'size', size, 'color', color, 'notes', notes,
        'created_at', created_at, 'updated_at', updated_at, 'removed_at', removed_at)
        order by created_at) from giftable_items), '[]'::jsonb),
    'claims', coalesce((select jsonb_agg(jsonb_build_object(
        'item_id', item_id, 'claimed_by', claimed_by, 'claimed_at', created_at, 'bought', bought))
        from giftable_claims), '[]'::jsonb)
  );
$$;

create or replace function giftable_save_item(p_token text, p_item jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_person uuid := giftable_person_for(p_token);
  v_id uuid;
begin
  if v_person is null then raise exception 'Please log in again'; end if;
  if coalesce(trim(p_item->>'name'), '') = '' then raise exception 'Item needs a name'; end if;

  if p_item ? 'id' and nullif(p_item->>'id', '') is not null then
    update giftable_items set
      category = left(coalesce(p_item->>'category', category), 40),
      name     = left(p_item->>'name', 200),
      link     = left(coalesce(p_item->>'link', ''), 1000),
      price    = left(coalesce(p_item->>'price', ''), 40),
      sale_price = left(coalesce(p_item->>'sale_price', ''), 40),
      priority = left(coalesce(p_item->>'priority', 'like'), 20),
      size     = left(coalesce(p_item->>'size', ''), 60),
      color    = left(coalesce(p_item->>'color', ''), 60),
      notes    = left(coalesce(p_item->>'notes', ''), 1000),
      updated_at = now()
    where id = (p_item->>'id')::uuid and person_id = v_person and removed_at is null
    returning id into v_id;
    if v_id is null then raise exception 'Item not found'; end if;
  else
    insert into giftable_items (person_id, category, name, link, price, sale_price, priority, size, color, notes)
    values (v_person,
      left(coalesce(p_item->>'category', 'other'), 40),
      left(p_item->>'name', 200),
      left(coalesce(p_item->>'link', ''), 1000),
      left(coalesce(p_item->>'price', ''), 40),
      left(coalesce(p_item->>'sale_price', ''), 40),
      left(coalesce(p_item->>'priority', 'like'), 20),
      left(coalesce(p_item->>'size', ''), 60),
      left(coalesce(p_item->>'color', ''), 60),
      left(coalesce(p_item->>'notes', ''), 1000))
    returning id into v_id;
  end if;
  update giftable_people set updated_at = now() where id = v_person;
  return jsonb_build_object('id', v_id);
end;
$$;
