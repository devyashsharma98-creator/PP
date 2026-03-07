-- Local/dev seed (idempotent). Keep production-safe and non-secret.

insert into public.org_settings (org_code, org_name, default_timezone)
values ('pragya-pravah', 'Pragya Pravah', 'Asia/Kolkata')
on conflict (org_code) do nothing;

with org_row as (
  select id from public.org_settings where org_code = 'pragya-pravah'
)
insert into public.units (org_id, code, name, unit_kind)
select org_row.id, v.code, v.name, v.unit_kind
from org_row
cross join (
  values
    ('bhopal-vibhag', 'Bhopal Vibhag', 'vibhag'),
    ('bhopal-shahar', 'Bhopal Shahar', 'unit')
) as v(code, name, unit_kind)
on conflict (org_id, code) do nothing;

with org_row as (
  select id from public.org_settings where org_code = 'pragya-pravah'
), bhopal_unit as (
  select u.id, u.org_id
  from public.units u
  join org_row o on o.id = u.org_id
  where u.code = 'bhopal-shahar'
)
insert into public.departments_or_aayams (org_id, unit_id, code, name, department_kind)
select b.org_id, b.id, v.code, v.name, 'aayam'
from bhopal_unit b
cross join (
  values
    ('prachar', 'Prachar Aayam'),
    ('aalekh', 'Aalekh Aayam'),
    ('vimarsh', 'Vimarsh Aayam')
) as v(code, name)
on conflict (org_id, code) do nothing;

with org_row as (
  select id from public.org_settings where org_code = 'pragya-pravah'
)
insert into public.tags (org_id, tag_type, tag_key, label, color)
select org_row.id, v.tag_type, v.tag_key, v.label, v.color
from org_row
cross join (
  values
    ('module', 'events', 'Events', '#d97706'),
    ('module', 'articles', 'Articles', '#2563eb'),
    ('module', 'prachar', 'Prachar', '#16a34a')
) as v(tag_type, tag_key, label, color)
on conflict (org_id, tag_type, tag_key) do nothing;
