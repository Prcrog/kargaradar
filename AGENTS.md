<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Pre-bundle UI dependencies in vite.config.ts optimizeDeps.include when adding new Radix/UI packages — mid-session dependency re-optimization loads two React copies and blanks the preview.
- Tenant data is scoped by company_roles and companies with database-enforced access; platform_roles only controls company approval, never shipment access, to prevent cross-company exposure.
- Platform administrators may read company memberships to manage each company's team; this exception applies only to company_roles and never expands shipment access.
- Member management uses authenticated browser RPCs with owner/platform authorization in the database; registration uses a short-lived email-bound single-use ticket and an isolated Auth client, never direct SQL writes to auth users or browser administrative keys.
- Public tracking stays carrier-blind: the customer picks no carrier and sees no carrier name, so lookups go through track_public_shipment, which returns {ambiguous:true} instead of guessing when several carriers match; tracking_companies is not public.
- Existing carrier records remain assigned to Guanabara Prime and only the oldest existing administrator owns platform approval, preserving data without granting platform access to every carrier.
- Keep public shipment lookup on its own `/rastrear` route so the home page can explain and sell the service without mixing customer and carrier journeys.
