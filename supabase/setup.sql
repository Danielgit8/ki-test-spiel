-- Runs from the browser game. The public site may only add runs.
-- Reading is done by the nightly build with the secret key, so nobody else can list runs.
create table public.game_runs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  player_id uuid not null,
  level_id text not null check (char_length(level_id) <= 10),
  game_version text not null check (char_length(game_version) <= 20),
  actions jsonb not null check (jsonb_typeof(actions) = 'array' and jsonb_array_length(actions) <= 1000),
  unique (player_id, level_id)
);

alter table public.game_runs enable row level security;

create policy "anyone can add a run" on public.game_runs for insert to anon with check (true);

grant insert on public.game_runs to anon;
grant select on public.game_runs to service_role;
