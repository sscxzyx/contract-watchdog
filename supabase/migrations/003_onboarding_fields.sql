-- Run in Supabase SQL editor after 001 and 002

-- Add business profile fields to users table
alter table public.users
  add column if not exists business_type text
    check (business_type in ('sole_trader', 'partnership', 'company', 'trust')),
  add column if not exists contract_volume text
    check (contract_volume in ('1-5', '5-20', '20-50', '50+')),
  add column if not exists contract_types text[] not null default '{}',
  add column if not exists biggest_headache text,
  add column if not exists caught_out text,
  add column if not exists personalisation_context text;

-- Add notification fields to user_settings table
alter table public.user_settings
  add column if not exists notification_preference text not null default 'email_only'
    check (notification_preference in ('email_only', 'email_sms', 'in_app_only')),
  add column if not exists phone_number text;

-- Update handle_new_user trigger to save full_name from signup metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;
