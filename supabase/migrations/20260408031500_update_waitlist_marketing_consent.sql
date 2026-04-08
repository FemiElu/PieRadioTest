-- Add marketing_consent column to waitlist table if it doesn't exist
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'waitlist' and column_name = 'marketing_consent') then
        alter table public.waitlist add column marketing_consent boolean default false;
    end if;
end $$;

-- Ensure RLS is enabled
alter table public.waitlist enable row level security;

-- Allow public (anon) insertions into the waitlist table
-- Note: Check if the policy already exists to avoid errors
do $$ 
begin 
    if not exists (select 1 from pg_policies where tablename = 'waitlist' and policyname = 'Allow public waitlist signups') then
        create policy "Allow public waitlist signups" on public.waitlist
        for insert with check (true);
    end if;
end $$;

-- Add index on email for faster lookups
create index if not exists waitlist_email_idx on public.waitlist (email);
