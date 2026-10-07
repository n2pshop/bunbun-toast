-- BunBun Toast database setup
-- Run this whole file in Supabase > SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  image_url text default '',
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null default ('BUN-' || to_char(now() at time zone 'Asia/Bangkok','YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4))),
  customer_name text not null,
  customer_phone text not null,
  fulfillment text not null default 'pickup' check (fulfillment in ('pickup','delivery')),
  address text default '',
  note text default '',
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  status text not null default 'new' check (status in ('new','preparing','ready','delivering','done','cancelled')),
  created_at timestamptz not null default now()
);

-- เปิด RLS
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- ลบ policy เก่าที่ชื่อซ้ำ (ถ้ามี)
drop policy if exists "products_public_read" on public.products;
drop policy if exists "products_staff_write" on public.products;
drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "orders_staff_read" on public.orders;
drop policy if exists "orders_staff_update" on public.orders;

-- ลูกค้าอ่านเฉพาะเมนูที่เปิดขาย
create policy "products_public_read"
on public.products for select
to anon, authenticated
using (available = true or auth.role() = 'authenticated');

-- ผู้ใช้ที่ login แล้วจัดการเมนูได้
create policy "products_staff_write"
on public.products for all
to authenticated
using (true)
with check (true);

-- ลูกค้าสร้างออเดอร์ได้
create policy "orders_public_insert"
on public.orders for insert
to anon, authenticated
with check (true);

-- ผู้ใช้ที่ login แล้วดู/แก้ไขออเดอร์ได้
create policy "orders_staff_read"
on public.orders for select
to authenticated
using (true);

create policy "orders_staff_update"
on public.orders for update
to authenticated
using (true)
with check (true);

-- ข้อมูลเริ่มต้น
insert into public.products (name,description,price,sort_order)
select 'เนยนม','หอมเนย นมฉ่ำ ๆ',35,1
where not exists (select 1 from public.products where name='เนยนม');

insert into public.products (name,description,price,sort_order)
select 'ช็อกโกแลต','ช็อกโกแลตเข้มข้น',40,2
where not exists (select 1 from public.products where name='ช็อกโกแลต');

insert into public.products (name,description,price,sort_order)
select 'สตรอว์เบอร์รี','หวานอมเปรี้ยวกำลังดี',40,3
where not exists (select 1 from public.products where name='สตรอว์เบอร์รี');

insert into public.products (name,description,price,sort_order)
select 'นูเทลลา','ช็อกโกแลตเฮเซลนัทแน่น ๆ',45,4
where not exists (select 1 from public.products where name='นูเทลลา');

-- เปิด Realtime สำหรับออเดอร์ (ถ้าระบบแจ้งว่ามีอยู่แล้ว ให้ข้ามบรรทัดนี้)
alter publication supabase_realtime add table public.orders;
