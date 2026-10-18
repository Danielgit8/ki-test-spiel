-- Runs from the browser game. Anyone may add and read runs, nobody may change or delete them.
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
create policy "anyone can read runs" on public.game_runs for select to anon using (true);

grant select, insert on public.game_runs to anon;
