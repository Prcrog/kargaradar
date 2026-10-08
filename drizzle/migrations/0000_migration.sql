create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- first user to sign up becomes admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique default upper(substr(md5(random()::text), 1, 10)),
  nfe_number text,
  nfe_key text,
  customer_name text not null,
  customer_doc text not null,
  origin text not null,
  destination text not null,
  status text not null default 'coletado',
  estimated_delivery date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  location text,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shipments to authenticated;
grant select, insert, update, delete on public.shipment_events to authenticated;
grant all on public.shipments to service_role;
grant all on public.shipment_events to service_role;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
create policy "admin all shipments" on public.shipments for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin all events" on public.shipment_events for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- public lookup: chave NF-e (44 digitos) OU (numero NF / codigo rastreio) + CPF/CNPJ
create or replace function public.track_shipment(_nfe_key text default null, _number text default null, _doc text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s public.shipments; k text; d text; n text;
begin
  k := regexp_replace(coalesce(_nfe_key,''), '\D', '', 'g');
  d := regexp_replace(coalesce(_doc,''), '\D', '', 'g');
  n := upper(trim(coalesce(_number,'')));
  if length(k) = 44 then
    select * into s from public.shipments where regexp_replace(coalesce(nfe_key,''), '\D','','g') = k limit 1;
  elsif n <> '' and length(d) >= 11 then
    select * into s from public.shipments
     where regexp_replace(customer_doc, '\D','','g') = d
       and (upper(tracking_code) = n or ltrim(regexp_replace(coalesce(nfe_number,''),'\D','','g'),'0') = ltrim(regexp_replace(n,'\D','','g'),'0'))
     limit 1;
  else
    return null;
  end if;
  if s.id is null then return null; end if;
  return jsonb_build_object(
    'tracking_code', s.tracking_code, 'nfe_number', s.nfe_number,
    'customer_name', split_part(s.customer_name, ' ', 1),
    'origin', s.origin, 'destination', s.destination, 'status', s.status,
    'estimated_delivery', s.estimated_delivery, 'updated_at', s.updated_at,
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'location', e.location, 'note', e.note, 'created_at', e.created_at) order by e.created_at desc)
                         from public.shipment_events e where e.shipment_id = s.id), '[]'::jsonb));
end; $$;
grant execute on function public.track_shipment(text, text, text) to anon, authenticated;

insert into public.shipments (tracking_code, nfe_number, nfe_key, customer_name, customer_doc, origin, destination, status, estimated_delivery)
values ('GP12345678', '000123', '33261012345678000190550010000001231000001234', 'Cliente Exemplo', '123.456.789-09', 'Rio de Janeiro - RJ', 'São Paulo - SP', 'em_transito', current_date + 2);
insert into public.shipment_events (shipment_id, status, location, note, created_at)
select id, 'coletado', 'Rio de Janeiro - RJ', 'Mercadoria coletada no remetente', now() - interval '1 day' from public.shipments where tracking_code='GP12345678';
insert into public.shipment_events (shipment_id, status, location, note)
select id, 'em_transito', 'Resende - RJ', 'Em trânsito para o destino' from public.shipments where tracking_code='GP12345678';