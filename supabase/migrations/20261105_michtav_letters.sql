-- מכתב לעצמי בעוד שנה: החותם בשרת.
-- הבעלים יכול/ה להכניס מכתב, ולקרוא או לעדכן אותו רק מיום הפתיחה. לפני כן מגיעים רק מטא־נתונים דרך michtav_sealed().
create table if not exists public.michtav_letters (
  id uuid primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  open_at timestamptz not null,
  letter jsonb not null,
  answers jsonb,
  constraint michtav_open_after_created check (open_at >= created_at + interval '30 days'),
  constraint michtav_letter_size check (pg_column_size(letter) < 32768)
);
create index if not exists michtav_letters_owner_idx on public.michtav_letters(owner, open_at);
alter table public.michtav_letters enable row level security;

create policy michtav_insert_own on public.michtav_letters for insert to authenticated
  with check (owner = (select auth.uid()) and created_at <= now() + interval '5 minutes' and created_at >= now() - interval '1 day');
create policy michtav_select_open on public.michtav_letters for select to authenticated
  using (owner = (select auth.uid()) and open_at <= now());
create policy michtav_update_open on public.michtav_letters for update to authenticated
  using (owner = (select auth.uid()) and open_at <= now())
  with check (owner = (select auth.uid()));
create policy michtav_delete_own on public.michtav_letters for delete to authenticated
  using (owner = (select auth.uid()));

-- עמודות שאסור לשנות אחרי החתימה.
create or replace function public.michtav_freeze() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.letter is distinct from old.letter or new.open_at is distinct from old.open_at or new.created_at is distinct from old.created_at or new.owner is distinct from old.owner then
    raise exception 'המכתב חתום: אפשר לעדכן רק את התשובות';
  end if;
  return new;
end $$;
drop trigger if exists michtav_freeze on public.michtav_letters;
create trigger michtav_freeze before update on public.michtav_letters for each row execute function public.michtav_freeze();

-- מטא־נתונים בלבד על מכתבים שעוד חתומים: בלי התוכן.
create or replace function public.michtav_sealed()
returns table (id uuid, created_at timestamptz, open_at timestamptz, visions int, fears int)
language sql stable security definer set search_path = '' as $$
  select l.id, l.created_at, l.open_at,
         coalesce(jsonb_array_length(l.letter->'visions'), 0),
         coalesce(jsonb_array_length(l.letter->'fears'), 0)
  from public.michtav_letters l
  where l.owner = (select auth.uid()) and l.open_at > now()
  order by l.open_at
$$;
revoke all on function public.michtav_sealed() from public, anon;
grant execute on function public.michtav_sealed() to authenticated;
