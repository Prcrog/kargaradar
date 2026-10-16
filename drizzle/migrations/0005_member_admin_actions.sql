-- Allow platform admin or company owner to set member access on any company
CREATE OR REPLACE FUNCTION public.set_member_access(_user_id uuid, _company_id uuid, _approved boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT (public.is_platform_admin() OR public.is_company_owner(_company_id)) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  UPDATE public.company_roles SET approved = _approved
    WHERE user_id = _user_id AND company_id = _company_id AND role = 'operator';
  IF NOT FOUND THEN RAISE EXCEPTION 'Membro não encontrado ou proprietário protegido'; END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.set_member_access(uuid, uuid, boolean) TO authenticated;

-- Delete a company member (operator). Platform admin or owner of that company.
CREATE OR REPLACE FUNCTION public.delete_member(_user_id uuid, _company_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT (public.is_platform_admin() OR public.is_company_owner(_company_id)) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  DELETE FROM public.company_roles
    WHERE user_id = _user_id AND company_id = _company_id AND role = 'operator';
  IF NOT FOUND THEN RAISE EXCEPTION 'Membro não encontrado ou proprietário protegido'; END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.delete_member(uuid, uuid) TO authenticated;

-- Delete a company entirely (platform admin only). Removes shipments, events, roles.
CREATE OR REPLACE FUNCTION public.delete_company(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  DELETE FROM public.shipment_events WHERE shipment_id IN (SELECT id FROM public.shipments WHERE company_id = _id);
  DELETE FROM public.shipments WHERE company_id = _id;
  DELETE FROM public.company_roles WHERE company_id = _id;
  DELETE FROM public.companies WHERE id = _id;
END $$;

GRANT EXECUTE ON FUNCTION public.delete_company(uuid) TO authenticated;