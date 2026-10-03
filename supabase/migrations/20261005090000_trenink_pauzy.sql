-- Trénink: pauza mezi cviky u šablony (pro odhad délky tréninku)
alter table public.workout_templates
  add column rest_between_s integer not null default 120 check (rest_between_s between 0 and 900);
