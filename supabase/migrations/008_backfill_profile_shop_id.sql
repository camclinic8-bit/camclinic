-- Profiles with NULL shop_id are invisible to "Super admins can view all profiles in their shop" RLS
-- (shop_id = get_my_shop_id() is false when shop_id IS NULL).
-- Single-shop deployments: copy shop_id from any super_admin profile.

UPDATE public.profiles AS p
SET shop_id = sa.shop_id
FROM (
  SELECT shop_id
  FROM public.profiles
  WHERE role = 'super_admin'
    AND shop_id IS NOT NULL
  LIMIT 1
) AS sa
WHERE p.shop_id IS NULL
  AND sa.shop_id IS NOT NULL;
