-- Example: repair UTF-8 mojibake in Hindi text columns after validating on a DB snapshot.
-- Adjust table/column names to match your Drizzle schema. Run only after testing on a copy.

-- UPDATE public.org_settings
-- SET name_hi = convert_from(convert_to(name_hi, 'latin1'), 'utf8')
-- WHERE name_hi LIKE '%à¤%';

-- UPDATE public.roles
-- SET name_hi = convert_from(convert_to(name_hi, 'latin1'), 'utf8')
-- WHERE name_hi LIKE '%à¤%';

-- UPDATE public.profiles
-- SET display_name_hi = convert_from(convert_to(display_name_hi, 'latin1'), 'utf8')
-- WHERE display_name_hi LIKE '%à¤%';
