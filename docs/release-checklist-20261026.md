# E-GOTO Release Gate — 26 October 2026

**Application:** Next.js / Coolify (production branch: `main`)  
**Change PR:** https://github.com/Fikrialv/catalog-e-goto/pull/2  
**Database project:** Supabase `udjnspiryqefgeqtgdpt`  
**Release status:** NOT DEPLOYED. Do not deploy by merely merging PR #2 to `develop`.

## 1. Verified in CI

- `npm ci && npm test && npm run lint && npm run typecheck && npm run build`.
- `npm audit --omit=dev --audit-level=high`, with zero production advisories on the verified commit.
- Disposable PostgreSQL 17 service: apply the three pre-deploy SQL migrations, verify RLS/column grants as `anon`, price and date-scoped promo, voucher redemption idempotency, full/unpublished date rejection, quota and legacy availability.
- Post-deploy cutover migration separately revokes the unsafe legacy RPC. Its revoke is tested in CI.
- No production catalog, voucher, or Auth data is modified by CI.

## 2. Deployment order — do not reorder

1. Verify production Coolify deploy branch is `main`. Prepare a rollback reference to the exact currently deployed `main` commit; record environment variables without exposing secrets.
2. Back up Supabase database and confirm restoration is possible. Keep existing voucher secrets unchanged; rotating the HMAC secret would invalidate all existing voucher codes.
3. Apply `202610250000_allow_cross_month_schedule_ranges.sql` only if the currently deployed database validator requires it; this SQL is designed to be idempotent.
4. Apply `202610250001_secure_date_scoped_voucher.sql`. **This creates the new voucher RPC while keeping the old RPC executable**, so the live old app continues redeeming vouchers during the transition.
5. Apply `202610250002_protect_catalog_drafts.sql`. Verify as anon that `published_payload` remains readable while `draft_payload` is not; verify ADMIN and EDITOR access still works. This security fix can be applied independently before a Next.js rollout.
6. Only after a separate staging smoke test for login, CRUD, image upload, draft/publish, schedules, promos and voucher limits succeeds: review PR #2, merge to `develop`, then prepare a reviewed promotion PR from `develop` to `main`.
7. Trigger a **manual** Coolify redeploy from `main`. Check server logs, health and error rate, catalog URLs, admin login, public availability, and WhatsApp content. Verify voucher RPC with a **dedicated disposable test voucher**; do not consume existing customer vouchers.
8. Once the new deployment is active everywhere and the voucher test passes, apply `202610250003_revoke_legacy_voucher_rpc.sql`, then verify the old overload has no `EXECUTE` for `anon` or `authenticated`.
9. Monitor errors, old and new redemption volumes and audit logs after deployment. Do not automatically recreate older vulnerable Next.js dependencies during rollback.

## 3. Rollback considerations

- Before step 8: rollback the Next.js application only; old voucher RPC remains available. Keep the new `schedule_id` column and new RPC in place, since they are additive.
- After step 8: to roll back to the old app, restore its old RPC `EXECUTE` privileges **only as a temporary emergency compatibility exception**, recognizing it accepts a caller-provided price. Prefer rolling forward and repairing the new app instead.
- `draft_payload` must remain protected even during rollback. Do **not** undo the column-level revoke as a standard rollback.
- If a migration errors, stop. Do not publish, delete records, or deploy around the failure.

## 4. Manual acceptance checklist (staging)

- [ ] ADMIN login, logout and session timeout return JSON API errors (401/403), not hidden HTML login pages.
- [ ] Create trip with no prices as draft; add positive prices and published schedule before publishing.
- [ ] Edit trip slug in draft while public URL still uses published snapshot; verify URL update only upon Publish.
- [ ] Save Draft, Preview, Publish, Unpublish, Duplicate and Archive/Restore.
- [ ] Upload/replace image without deleting an image still shown by published snapshot.
- [ ] Add and duplicate trips across October–November and December–January; verify 29 February on leap year and block impossible dates.
- [ ] Select two separate departure dates: date with promo gets its own price; other date remains normal.
- [ ] Apply voucher on discounted and non-discounted dates, inspect final rupiah amount and WhatsApp message.
- [ ] Exhaust test voucher quota and retry same browser session; verify no extra redeemed_count.
- [ ] Re-select a different date while the voucher request is in flight; ensure old price never appears in the new WhatsApp message.
- [ ] Confirm VIEWER cannot create/update trips, images or vouchers.

## 5. GitHub branch policy

Keep exactly three long-lived/active branches:

- `main` — production.
- `develop` — integration and staging builds.
- `fix/admin-pricing-voucher-dates` — active review branch; delete only after PR #2 is merged and release is verified.

The former `deploy/cloudflare-opennext`, `fix/catalog-cross-month` and `fix/cross-month-draft-schedules` refs were cleaned up after SHA verification, without merging them directly to production.
