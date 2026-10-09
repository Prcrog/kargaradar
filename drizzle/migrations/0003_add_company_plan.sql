ALTER TABLE public.companies ADD COLUMN plan text NOT NULL DEFAULT 'basico';
ALTER TABLE public.companies ADD CONSTRAINT companies_plan_check CHECK (plan IN ('basico','profissional','completo'));

UPDATE public.companies SET plan = 'completo';

COMMENT ON COLUMN public.companies.plan IS 'Plano contratado: basico | profissional | completo';

CREATE OR REPLACE FUNCTION public.set_company_plan(_id uuid, _plan text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF _plan NOT IN ('basico','profissional','completo') THEN RAISE EXCEPTION 'Plano inválido'; END IF;
  UPDATE public.companies SET plan = _plan WHERE id = _id;
END $function$;

GRANT EXECUTE ON FUNCTION public.set_company_plan(uuid, text) TO authenticated;