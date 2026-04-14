create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin','dispatcher','driver','company')),
  created_at timestamptz not null default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  load_code text not null unique,
  customer_name text not null,
  origin text not null,
  destination text not null,
  status text not null default 'created' check (status in ('created','assigned','loading','in_transit','delivered','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  assigned_driver_id uuid references users(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists driver_locations (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references shipments(id) on delete cascade,
  driver_id uuid references users(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  speed_mph integer not null default 0,
  recorded_at timestamptz not null default now()
);

create table if not exists driver_messages (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references shipments(id) on delete cascade,
  driver_id uuid references users(id) on delete set null,
  category text not null default 'general',
  priority text not null default 'normal',
  message text not null,
  sent_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references shipments(id) on delete set null,
  uploaded_by uuid references users(id) on delete set null,
  storage_bucket text not null,
  storage_path text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_shipments_status on shipments(status);
create index if not exists idx_driver_locations_shipment_id on driver_locations(shipment_id);
create index if not exists idx_driver_messages_shipment_id on driver_messages(shipment_id);
create index if not exists idx_documents_shipment_id on documents(shipment_id);
