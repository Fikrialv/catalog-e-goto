# E-GOTO Catalog — Cloudflare Workers

This branch prepares a **separate Cloudflare Workers deployment** for the existing Next.js app. Render remains unchanged as the rollback option. Supabase remains the database.

## Before deployment

1. Install Node.js LTS and npm.
2. From the repository root, run `npm install` to reconcile `package-lock.json` with the Cloudflare dependencies added in this branch.
3. Run `npm run typecheck`, `npm run lint`, and `npm test`. Resolve failures before deploying.
4. Run `npm run preview:cloudflare` and test the app in the local Workers runtime.
5. Authenticate the Cloudflare CLI with `npx wrangler login`.

## Cloudflare environment variables

Configure these in the Cloudflare Worker dashboard under Settings → Variables and Secrets. Use the same names as `.env.example` and the values for the production environment:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_INSTAGRAM_URL` (optional)
- `NEXT_PUBLIC_TIKTOK_URL` (optional)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_USD_EXCHANGE_RATE`
- `E_GOTO_ADMIN_USERNAME`
- `E_GOTO_ADMIN_EMAIL`
- `VOUCHER_HASH_SECRET` (server-side secret; never expose it with a `NEXT_PUBLIC_` prefix)

Never commit production secrets or a populated `.dev.vars` file. Public Supabase keys are intended for client use but must still be protected by correct Supabase RLS policies.

## Build and deploy manually

After environment variables are configured and local checks pass:

```bash
npm run deploy:cloudflare
```

This command builds the app and deploys it to the Worker named `e-goto-catalog-cloudflare`. The command requires your Cloudflare CLI to be authenticated.

## Verification checklist

- [ ] Worker deployment succeeds and the generated `workers.dev` URL opens over HTTPS.
- [ ] Public catalog and destination details load.
- [ ] Admin login succeeds.
- [ ] Create, edit, and delete draft destinations work.
- [ ] Price options, cross-month schedules, and highlights behave correctly.
- [ ] Images load from Supabase Storage.
- [ ] Supabase RLS blocks unauthorized access.
- [ ] Error logs and Worker metrics are reviewed.
- [ ] Only after verification, consider moving the custom domain.

## Important limitations

- This setup does not automatically move the custom domain or change Supabase.
- The Worker avoids Render Free's idle-sleep behavior, but it does not guarantee 100% uptime.
- Cloudflare's free plan has usage and resource limits. Check the current limits and Worker size after building.
- Next.js/adapter compatibility and all app features still need to be tested; this repository configuration has not been built or deployed by this change.
