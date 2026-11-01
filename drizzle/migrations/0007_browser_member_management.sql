CREATE TABLE public.member_registration_tickets (
  token_hash text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);
GRANT ALL ON public.member_registration_tickets TO service_role;
ALTER TABLE public.member_registration_tickets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.list_company_members(_company_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid, email text, created_at timestamptz, confirmed boolean, "isAdmin" boolean, "isOwner" boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE cid uuid := coalesce(_company_id, public.current_company_id());
BEGIN
  IF auth.uid() IS NULL OR cid IS NULL OR NOT (public.is_platform_admin() OR public.is_company_owner(cid)) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT u.id, u.email::text, u.created_at, u.email_confirmed_at IS NOT NULL, r.approved, r.role = 'owner'
    FROM public.company_roles r JOIN auth.users u ON u.id = r.user_id
    WHERE r.company_id = cid ORDER BY u.created_at;
END;
$$;
REVOKE ALL ON FUNCTION public.list_company_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_company_members(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.prepare_company_member(_email text, _company_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE cid uuid := coalesce(_company_id, public.current_company_id());
  normalized_email text := lower(trim(_email)); uid uuid; existing_company uuid; ticket text;
BEGIN
  IF auth.uid() IS NULL OR cid IS NULL OR NOT (public.is_platform_admin() OR public.is_company_owner(cid)) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE companies.id = cid) THEN RAISE EXCEPTION 'Transportadora não encontrada'; END IF;
  IF normalized_email IS NULL OR normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'E-mail inválido'; END IF;
  SELECT u.id INTO uid FROM auth.users u WHERE lower(u.email) = normalized_email LIMIT 1;
  IF uid IS NOT NULL THEN
    SELECT r.company_id INTO existing_company FROM public.company_roles r WHERE r.user_id = uid;
    IF existing_company IS NOT NULL AND existing_company <> cid THEN RAISE EXCEPTION 'Esse e-mail já está vinculado a outra transportadora'; END IF;
    IF existing_company IS NULL THEN
      INSERT INTO public.company_roles(company_id, user_id, role, approved) VALUES(cid, uid, 'operator', true);
    END IF;
    RETURN jsonb_build_object('existing', true);
  END IF;
  ticket := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.member_registration_tickets(token_hash, company_id, email)
    VALUES(encode(extensions.digest(ticket, 'sha256'), 'hex'), cid, normalized_email);
  RETURN jsonb_build_object('existing', false, 'ticket', ticket);
END;
$$;
REVOKE ALL ON FUNCTION public.prepare_company_member(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prepare_company_member(text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.attach_registered_company_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE ticket text := new.raw_user_meta_data->>'company_registration_ticket'; registration public.member_registration_tickets;
BEGIN
  IF ticket IS NULL THEN RETURN new; END IF;
  SELECT * INTO registration FROM public.member_registration_tickets
    WHERE token_hash = encode(extensions.digest(ticket, 'sha256'), 'hex')
      AND email = lower(new.email) AND expires_at > now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cadastro não autorizado ou expirado'; END IF;
  INSERT INTO public.company_roles(company_id, user_id, role, approved)
    VALUES(registration.company_id, new.id, 'operator', true);
  DELETE FROM public.member_registration_tickets WHERE token_hash = registration.token_hash;
  RETURN new;
END;
$$;
REVOKE ALL ON FUNCTION public.attach_registered_company_member() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_company_member AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.attach_registered_company_member();