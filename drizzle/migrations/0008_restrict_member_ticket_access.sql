REVOKE ALL ON TABLE public.member_registration_tickets FROM anon, authenticated;
GRANT ALL ON TABLE public.member_registration_tickets TO service_role;