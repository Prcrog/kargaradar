ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS cte text;
CREATE OR REPLACE FUNCTION public.track_public_shipment(_nfe_key text DEFAULT NULL::text, _number text DEFAULT NULL::text, _doc text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE rec public.shipments; matches int; k text; d text; n text; BEGIN
k := regexp_replace(coalesce(_nfe_key,''),'\D','','g'); d := regexp_replace(coalesce(_doc,''),'\D','','g'); n := upper(trim(coalesce(_number,'')));
IF length(k) = 44 THEN
 SELECT count(*) INTO matches FROM public.shipments sh JOIN public.companies c ON c.id = sh.company_id WHERE c.status = 'approved' AND regexp_replace(coalesce(sh.nfe_key,''),'\D','','g') = k;
ELSIF n <> '' AND length(d) IN (11,14) THEN
 SELECT count(*) INTO matches FROM public.shipments sh JOIN public.companies c ON c.id = sh.company_id WHERE c.status = 'approved' AND regexp_replace(sh.customer_doc,'\D','','g') = d AND (upper(sh.tracking_code) = n OR upper(trim(coalesce(sh.cte,''))) = n OR (n ~ '^[0-9]+$' AND (ltrim(coalesce(sh.nfe_number,''),'0') = ltrim(n,'0') OR ltrim(coalesce(sh.cte,''),'0') = ltrim(n,'0'))));
ELSE RETURN NULL; END IF;
IF matches = 0 THEN RETURN NULL; END IF;
IF matches > 1 THEN RETURN jsonb_build_object('ambiguous',true); END IF;
IF length(k) = 44 THEN
 SELECT sh.* INTO rec FROM public.shipments sh JOIN public.companies c ON c.id = sh.company_id WHERE c.status = 'approved' AND regexp_replace(coalesce(sh.nfe_key,''),'\D','','g') = k ORDER BY sh.created_at DESC LIMIT 1;
ELSE
 SELECT sh.* INTO rec FROM public.shipments sh JOIN public.companies c ON c.id = sh.company_id WHERE c.status = 'approved' AND regexp_replace(sh.customer_doc,'\D','','g') = d AND (upper(sh.tracking_code) = n OR upper(trim(coalesce(sh.cte,''))) = n OR (n ~ '^[0-9]+$' AND (ltrim(coalesce(sh.nfe_number,''),'0') = ltrim(n,'0') OR ltrim(coalesce(sh.cte,''),'0') = ltrim(n,'0')))) ORDER BY sh.created_at DESC LIMIT 1;
END IF;
IF rec.id IS NULL THEN RETURN NULL; END IF;
RETURN jsonb_build_object('tracking_code',rec.tracking_code,'nfe_number',rec.nfe_number,'customer_name',split_part(rec.customer_name,' ',1),'origin',rec.origin,'destination',rec.destination,'status',rec.status,'estimated_delivery',rec.estimated_delivery,'updated_at',rec.updated_at,'events',coalesce((SELECT jsonb_agg(jsonb_build_object('status',e.status,'location',e.location,'note',e.note,'created_at',e.created_at) ORDER BY e.created_at DESC) FROM public.shipment_events e WHERE e.shipment_id = rec.id),'[]'::jsonb)); END $function$;