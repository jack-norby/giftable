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

-- See each person's private edit token (needed for their edit links):
-- select p.name, s.edit_token from giftable_people p join giftable_secrets s on s.person_id = p.id order by p.sort;
