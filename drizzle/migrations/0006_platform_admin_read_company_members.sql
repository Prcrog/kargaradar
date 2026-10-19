CREATE POLICY platform_admin_read_members
ON public.company_roles
FOR SELECT
TO authenticated
USING (public.is_platform_admin());

GRANT SELECT ON public.company_roles TO authenticated;
