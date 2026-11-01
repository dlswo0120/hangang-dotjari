-- 한강 돗자리 · Supabase 설정
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 을 누르세요.
-- 맨 아래 '관리자 비밀번호'는 꼭 바꿔서 실행하세요. 길고 남이 추측하기 어려운 문장이 좋습니다.

-- 1) 날씨를 저장하는 표 (누구나 읽기만 가능)
create table if not exists public.world (
  id int primary key,
  weather text not null default 'clear',
  updated_at timestamptz not null default now()
);
insert into public.world (id) values (1) on conflict (id) do nothing;
alter table public.world enable row level security;
drop policy if exists "world is readable" on public.world;
create policy "world is readable" on public.world for select using (true);

-- 2) 관리자 비밀번호 (정책이 없어서 바깥에서는 아무도 읽을 수 없음)
create table if not exists public.admin_secret (
  id int primary key,
  code text not null
);
alter table public.admin_secret enable row level security;

-- 3) 비밀번호 확인 함수
create or replace function public.check_admin(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_secret s where s.id = 1 and s.code = p_code);
$$;

-- 4) 날씨 바꾸기 함수 (비밀번호가 맞을 때만)
create or replace function public.set_weather(p_code text, p_weather text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_weather not in ('clear', 'cloudy', 'rain', 'snow', 'fog') then
    return false;
  end if;
  if not exists (select 1 from public.admin_secret s where s.id = 1 and s.code = p_code) then
    return false;
  end if;
  update public.world set weather = p_weather, updated_at = now() where id = 1;
  return true;
end;
$$;

revoke all on function public.check_admin(text) from public;
revoke all on function public.set_weather(text, text) from public;
grant execute on function public.check_admin(text) to anon, authenticated;
grant execute on function public.set_weather(text, text) to anon, authenticated;

-- 5) 관리자 비밀번호 정하기  ← 여기를 바꾸세요
insert into public.admin_secret (id, code)
values (1, '여기에-관리자-비밀번호를-적으세요')
on conflict (id) do update set code = excluded.code;
