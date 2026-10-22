-- Your Brain Is Lying — Phase C + D cloud schema
-- Run this entire file in the SQL Editor of the Supabase project used by this app.
-- Do NOT use a service_role/secret key in the browser. The frontend uses a publishable key and RLS.
-- Tables are private to authenticated accounts except opted-in leaderboard entries and profile handles.

create extension if not exists pgcrypto;

create table if not exists public.brain_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null,
  display_name text not null check (char_length(display_name) between 2 and 40),
  avatar_emoji text not null default '🧠' check (char_length(avatar_emoji) <= 8),
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brain_profiles_handle_shape check (handle = lower(handle) and handle ~ '^[a-z0-9_]{3,20}$')
);

create unique index if not exists brain_profiles_handle_unique_idx on public.brain_profiles (lower(handle));

create table if not exists public.brain_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 2 check (schema_version > 0),
  player_data jsonb not null default '{}'::jsonb check (jsonb_typeof(player_data) = 'object'),
  updated_at timestamptz not null default now(),
  constraint brain_progress_size_limit check (octet_length(player_data::text) <= 1500000)
);

create table if not exists public.brain_friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brain_friend_request_not_self check (requester_id <> receiver_id)
);

create unique index if not exists brain_friend_requests_pair_unique_idx
  on public.brain_friend_requests (least(requester_id, receiver_id), greatest(requester_id, receiver_id));
create index if not exists brain_friend_requests_receiver_status_idx
  on public.brain_friend_requests (receiver_id, status, created_at desc);
create index if not exists brain_friend_requests_requester_status_idx
  on public.brain_friend_requests (requester_id, status, created_at desc);

create table if not exists public.brain_challenges (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  challenger_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  skill text not null check (skill in ('reaction', 'memory', 'attention', 'logic', 'impulse')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint brain_challenge_not_self check (challenger_id <> opponent_id),
  constraint brain_challenge_expiry check (expires_at > created_at)
);
create index if not exists brain_challenges_challenger_created_idx on public.brain_challenges (challenger_id, created_at desc);
create index if not exists brain_challenges_opponent_created_idx on public.brain_challenges (opponent_id, created_at desc);

create table if not exists public.brain_challenge_scores (
  challenge_id uuid not null references public.brain_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  raw_metric text not null check (char_length(raw_metric) <= 80),
  submitted_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index if not exists brain_challenge_scores_user_idx on public.brain_challenge_scores (user_id, submitted_at desc);

create table if not exists public.brain_leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.brain_profiles(user_id) on delete cascade,
  skill text not null check (skill in ('reaction', 'memory', 'attention', 'logic', 'impulse')),
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  raw_metric text not null check (char_length(raw_metric) <= 80),
  created_at timestamptz not null default now()
);
create index if not exists brain_leaderboard_skill_score_idx on public.brain_leaderboard_entries (skill, score desc, created_at desc);

create or replace function public.brain_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists brain_profiles_touch_updated_at on public.brain_profiles;
create trigger brain_profiles_touch_updated_at before update on public.brain_profiles
for each row execute function public.brain_touch_updated_at();

drop trigger if exists brain_progress_touch_updated_at on public.brain_progress;
create trigger brain_progress_touch_updated_at before update on public.brain_progress
for each row execute function public.brain_touch_updated_at();

drop trigger if exists brain_friend_requests_touch_updated_at on public.brain_friend_requests;
create trigger brain_friend_requests_touch_updated_at before update on public.brain_friend_requests
for each row execute function public.brain_touch_updated_at();

create or replace function public.brain_guard_friend_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.requester_id is distinct from old.requester_id
     or new.receiver_id is distinct from old.receiver_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Friend request identity fields cannot be changed';
  end if;
  if old.status <> 'pending' or new.status not in ('accepted', 'declined') then
    raise exception 'Only a pending friend request can be accepted or declined';
  end if;
  if (select auth.uid()) is distinct from old.receiver_id then
    raise exception 'Only the recipient can respond to a friend request';
  end if;
  return new;
end;
$$;

drop trigger if exists brain_friend_requests_guard on public.brain_friend_requests;
create trigger brain_friend_requests_guard before update on public.brain_friend_requests
for each row execute function public.brain_guard_friend_request();

create or replace function public.brain_guard_challenge_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.challenger_id is distinct from old.challenger_id
     or new.opponent_id is distinct from old.opponent_id
     or new.skill is distinct from old.skill
     or new.invite_code is distinct from old.invite_code
     or new.created_at is distinct from old.created_at
     or new.expires_at is distinct from old.expires_at then
    raise exception 'Challenge identity fields cannot be changed';
  end if;
  if old.status <> 'pending' then
    raise exception 'Only a pending challenge can change status';
  end if;
  if new.status = 'accepted' then
    if (select auth.uid()) is distinct from old.opponent_id then
      raise exception 'Only the invited friend can accept a challenge';
    end if;
    new.accepted_at := now();
  elsif new.status = 'cancelled' then
    if (select auth.uid()) is distinct from old.challenger_id then
      raise exception 'Only the challenge creator can cancel it';
    end if;
  else
    raise exception 'Unsupported challenge state transition';
  end if;
  return new;
end;
$$;

drop trigger if exists brain_challenges_guard on public.brain_challenges;
create trigger brain_challenges_guard before update on public.brain_challenges
for each row execute function public.brain_guard_challenge_update();

alter table public.brain_profiles enable row level security;
alter table public.brain_progress enable row level security;
alter table public.brain_friend_requests enable row level security;
alter table public.brain_challenges enable row level security;
alter table public.brain_challenge_scores enable row level security;
alter table public.brain_leaderboard_entries enable row level security;

-- Only signed-in users may see public-facing profile handles. Profile data contains no email.
revoke all on public.brain_profiles, public.brain_progress, public.brain_friend_requests,
  public.brain_challenges, public.brain_challenge_scores, public.brain_leaderboard_entries from anon;
grant select, insert, update, delete on public.brain_profiles, public.brain_progress,
  public.brain_friend_requests, public.brain_challenges, public.brain_challenge_scores,
  public.brain_leaderboard_entries to authenticated;

drop policy if exists brain_profiles_read_signed_in on public.brain_profiles;
create policy brain_profiles_read_signed_in on public.brain_profiles for select to authenticated using (true);
drop policy if exists brain_profiles_insert_self on public.brain_profiles;
create policy brain_profiles_insert_self on public.brain_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists brain_profiles_update_self on public.brain_profiles;
create policy brain_profiles_update_self on public.brain_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists brain_profiles_delete_self on public.brain_profiles;
create policy brain_profiles_delete_self on public.brain_profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists brain_progress_select_self on public.brain_progress;
create policy brain_progress_select_self on public.brain_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists brain_progress_insert_self on public.brain_progress;
create policy brain_progress_insert_self on public.brain_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists brain_progress_update_self on public.brain_progress;
create policy brain_progress_update_self on public.brain_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists brain_progress_delete_self on public.brain_progress;
create policy brain_progress_delete_self on public.brain_progress for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists brain_friend_requests_read_participant on public.brain_friend_requests;
create policy brain_friend_requests_read_participant on public.brain_friend_requests for select to authenticated
using ((select auth.uid()) in (requester_id, receiver_id));
drop policy if exists brain_friend_requests_insert_requester on public.brain_friend_requests;
create policy brain_friend_requests_insert_requester on public.brain_friend_requests for insert to authenticated
with check (
  requester_id = (select auth.uid())
  and requester_id <> receiver_id
  and exists (select 1 from public.brain_profiles p where p.user_id = receiver_id)
);
drop policy if exists brain_friend_requests_update_recipient on public.brain_friend_requests;
create policy brain_friend_requests_update_recipient on public.brain_friend_requests for update to authenticated
using (receiver_id = (select auth.uid()) and status = 'pending')
with check (receiver_id = (select auth.uid()) and status in ('accepted', 'declined'));
drop policy if exists brain_friend_requests_delete_participant on public.brain_friend_requests;
create policy brain_friend_requests_delete_participant on public.brain_friend_requests for delete to authenticated
using (requester_id = (select auth.uid()) and status = 'pending');

drop policy if exists brain_challenges_read_participant on public.brain_challenges;
create policy brain_challenges_read_participant on public.brain_challenges for select to authenticated
using ((select auth.uid()) in (challenger_id, opponent_id));
drop policy if exists brain_challenges_insert_friend on public.brain_challenges;
create policy brain_challenges_insert_friend on public.brain_challenges for insert to authenticated
with check (
  challenger_id = (select auth.uid())
  and challenger_id <> opponent_id
  and exists (
    select 1 from public.brain_friend_requests f
    where f.status = 'accepted'
      and least(f.requester_id, f.receiver_id) = least(challenger_id, opponent_id)
      and greatest(f.requester_id, f.receiver_id) = greatest(challenger_id, opponent_id)
  )
);
drop policy if exists brain_challenges_accept on public.brain_challenges;
create policy brain_challenges_accept on public.brain_challenges for update to authenticated
using (opponent_id = (select auth.uid()) and status = 'pending')
with check (opponent_id = (select auth.uid()) and status = 'accepted');
drop policy if exists brain_challenges_cancel on public.brain_challenges;
create policy brain_challenges_cancel on public.brain_challenges for update to authenticated
using (challenger_id = (select auth.uid()) and status = 'pending')
with check (challenger_id = (select auth.uid()) and status = 'cancelled');

drop policy if exists brain_challenge_scores_read_participant on public.brain_challenge_scores;
create policy brain_challenge_scores_read_participant on public.brain_challenge_scores for select to authenticated
using (
  exists (
    select 1 from public.brain_challenges c
    where c.id = challenge_id and (select auth.uid()) in (c.challenger_id, c.opponent_id)
  )
);
drop policy if exists brain_challenge_scores_insert_self on public.brain_challenge_scores;
create policy brain_challenge_scores_insert_self on public.brain_challenge_scores for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.brain_challenges c
    where c.id = challenge_id
      and (select auth.uid()) in (c.challenger_id, c.opponent_id)
      and c.status = 'accepted'
      and c.expires_at > now()
  )
);
drop policy if exists brain_challenge_scores_no_update on public.brain_challenge_scores;
create policy brain_challenge_scores_no_update on public.brain_challenge_scores for update to authenticated using (false) with check (false);
drop policy if exists brain_challenge_scores_delete_self on public.brain_challenge_scores;
create policy brain_challenge_scores_delete_self on public.brain_challenge_scores for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists brain_leaderboard_entries_read_opted_in on public.brain_leaderboard_entries;
create policy brain_leaderboard_entries_read_opted_in on public.brain_leaderboard_entries for select to authenticated
using (exists (select 1 from public.brain_profiles p where p.user_id = user_id and p.leaderboard_opt_in));
drop policy if exists brain_leaderboard_entries_insert_opted_in on public.brain_leaderboard_entries;
create policy brain_leaderboard_entries_insert_opted_in on public.brain_leaderboard_entries for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.brain_profiles p where p.user_id = (select auth.uid()) and p.leaderboard_opt_in)
);
drop policy if exists brain_leaderboard_entries_delete_self on public.brain_leaderboard_entries;
create policy brain_leaderboard_entries_delete_self on public.brain_leaderboard_entries for delete to authenticated
using (user_id = (select auth.uid()));

-- Realtime is optional; enable it for brain_progress if live cross-device updates are desired.
-- The app still syncs on login and after every saved run if Realtime is not enabled.
