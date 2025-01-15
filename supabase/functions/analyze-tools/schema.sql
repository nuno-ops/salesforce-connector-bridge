create table if not exists tool_analysis (
  id uuid default gen_random_uuid() primary key,
  org_id text not null,
  analysis jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table tool_analysis enable row level security;

create policy "Enable read access for all users"
on tool_analysis for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on tool_analysis for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users"
on tool_analysis for update
to authenticated
using (true);

-- Add unique constraint on org_id
alter table tool_analysis
add constraint tool_analysis_org_id_key
unique (org_id);