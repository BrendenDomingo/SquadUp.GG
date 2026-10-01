-- SquadUp.GG database schema for Supabase/Postgres
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text default '',
  avatar_url text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id bigint primary key,
  name text not null,
  slug text unique not null,
  player_count integer default 0,
  is_featured boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_modes (
  id uuid primary key default gen_random_uuid(),
  game_id bigint not null references public.games(id) on delete cascade,
  name text not null,
  unique(game_id,name)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  unique(requester_id,addressee_id),
  check(requester_id <> addressee_id)
);

create table if not exists public.user_games (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id bigint not null references public.games(id) on delete cascade,
  role text,
  skill_text text,
  preferred_modes text[] default '{}',
  primary key(user_id,game_id)
);

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  game_id bigint not null references public.games(id),
  name text not null,
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.squad_members (
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  primary key(squad_id,user_id)
);

create table if not exists public.lfg_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  game_id bigint not null references public.games(id),
  mode_id uuid references public.game_modes(id),
  title text not null,
  body text default '',
  slots_needed integer not null default 1 check(slots_needed between 1 and 99),
  status text not null default 'open' check(status in ('open','full','closed')),
  voice_required boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.lfg_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lfg_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text default '',
  status text not null default 'pending' check(status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique(post_id,user_id)
);

create table if not exists public.saved_squads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  squad_id uuid not null references public.squads(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,squad_id)
);

-- Basic row-level security. Tighten policies further as the product grows.
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_modes enable row level security;
alter table public.friendships enable row level security;
alter table public.user_games enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.lfg_posts enable row level security;
alter table public.lfg_requests enable row level security;
alter table public.saved_squads enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid()=id);
create policy "games are public" on public.games for select using (true);
create policy "modes are public" on public.game_modes for select using (true);
create policy "friendships visible to participants" on public.friendships for select using (auth.uid()=requester_id or auth.uid()=addressee_id);
create policy "users create friendships" on public.friendships for insert with check (auth.uid()=requester_id);
create policy "participants update friendships" on public.friendships for update using (auth.uid()=requester_id or auth.uid()=addressee_id);
create policy "user games public" on public.user_games for select using (true);
create policy "users manage own games" on public.user_games for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "squads public" on public.squads for select using (true);
create policy "owners manage squads" on public.squads for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "squad members public" on public.squad_members for select using (true);
create policy "members manage membership" on public.squad_members for all using (auth.uid()=user_id or exists(select 1 from public.squads s where s.id=squad_id and s.owner_id=auth.uid()));
create policy "open lfg public" on public.lfg_posts for select using (status='open' or auth.uid()=author_id);
create policy "users create lfg" on public.lfg_posts for insert with check (auth.uid()=author_id);
create policy "authors manage lfg" on public.lfg_posts for update using (auth.uid()=author_id) with check (auth.uid()=author_id);
create policy "authors delete lfg" on public.lfg_posts for delete using (auth.uid()=author_id);
create policy "requester can view own requests" on public.lfg_requests for select using (auth.uid()=user_id or exists(select 1 from public.lfg_posts p where p.id=post_id and p.author_id=auth.uid()));
create policy "users create own requests" on public.lfg_requests for insert with check (auth.uid()=user_id);
create policy "requesters update own requests" on public.lfg_requests for update using (auth.uid()=user_id or exists(select 1 from public.lfg_posts p where p.id=post_id and p.author_id=auth.uid()));
create policy "saved squads private" on public.saved_squads for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

insert into public.games(id,name,slug,player_count,is_featured) values
(730,'Counter-Strike 2','counter-strike-2',1400000,true),(570,'Dota 2','dota-2',700000,true),(1172470,'Apex Legends','apex-legends',350000,true),(578080,'PUBG: BATTLEGROUNDS','pubg-battlegrounds',600000,true),(1938090,'Call of Duty','call-of-duty',250000,true),(1599340,'Lost Ark','lost-ark',180000,true),(1085660,'Destiny 2','destiny-2',150000,true),(252490,'Rust','rust',140000,true)
on conflict(id) do update set player_count=excluded.player_count,is_featured=excluded.is_featured;
