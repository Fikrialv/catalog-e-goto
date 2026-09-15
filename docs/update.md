# E-GOTO Update Log

## 2026-09-15 — Canonical admin home and auth proxy request reduction

- Login success now redirects to `/admin`; the new `AdminFeatureHub` is canonical admin home. `/admin/catalog` remains catalog child navigation.
- Added account identity and logout control to canonical admin home. No active admin route or feature was removed; the former catalog dashboard remains the catalog-management child surface.
- Removed duplicate Supabase `getClaims()` execution in proxy session handling by returning verified claims from the single session refresh call. Business rules and authorization checks remain unchanged.
- Smoke evidence: unauthenticated local and ngrok `/admin` both return `307 Location: /admin/login`; local login page cold response `1.32s`, ngrok login page cold response `6.10s`.
- Admin authenticated CRUD/tab timing and full responsive QA remain blocked until `.env.local` provides the required server-only test-admin reset inputs (`SUPABASE_SERVICE_ROLE_KEY`, `TEST_ADMIN_PASSWORD`). No credential was created, printed, or committed.

## 2026-09-15 — Mobile editor overflow fix and production verification

- Fixed mobile editor flex overflow in `components/admin/catalog-editor.tsx`: list inputs and highlight itinerary fields now use `min-w-0 flex-1`; affected rows also constrain their flex containers. This preserves reorder/delete controls without horizontal page overflow.
- Reproduced and resolved a production build blocker caused by the optimized catalog SELECT RLS policy evaluating `admin_profiles` for anonymous reads. The final applied migration `20260915123000_restore_separate_catalog_select_rls.sql` separates anon published reads from authenticated staff reads; published catalog access and admin/editor RBAC remain unchanged.
- Verification: `rtk npm run lint`, `rtk npm run typecheck`, `rtk npm run test` (16 tests), `rtk proxy npm run build` (23 pages), `rtk git diff --check` all passed.
- Production smoke: `/catalog` rendered with `scrollWidth === innerWidth` at 360, 390, 430, 768, 820, 1024, 1280, 1440, and 1920px; invalid catalog slug returned HTTP 404.
- Admin editor browser matrix remains pending because the saved browser sessions require a password not present in local environment; no credential was written to source or shell history.

## 2026-09-15 — Real Supabase runtime and scroll/image pass

- `.env.local` now uses the supplied Supabase URL and publishable key; no database password or service-role key was added. Project linked with `npx supabase link --project-ref udjnspiryqefgeqtgdpt`.
- Migration list verified remote/local equal for `202609070001`, `202609090002`, and `20260910174615`. Live inventory: 5 catalog rows, 5 published snapshots, 1 confirmed `ADMIN` profile, RLS enabled on catalog/admin/audit/slug tables. Audit table currently has 0 rows because no CMS mutation was performed in this pass.
- Added and applied `20260915120000_audit_storage_grants.sql`: authenticated admins now have the missing `INSERT` grant required by the existing audit RLS policy.
- Live Draft → Preview → Publish verified on CMC: `SAVE_DRAFT` and `PUBLISH` returned 200; published snapshot version 3 and both audit rows were confirmed in Supabase. Storage upload/delete smoke returned 200/200 and left zero smoke objects.
- Local dev, production `next start` on port 3001, and ngrok dev runtime loaded Supabase env. Real admin login API returned 200 and `/admin/catalog` rendered 5 destinations through ngrok and production local smoke.
- Performance changes: Hero marquee no longer ships as a client component; marquee images use lazy loading beyond the first two and quality 70; fixed background attachment removed; marquee paint containment added. No build was run per request.
- `allowedDevOrigins` added for the active ngrok hostname so Next dev resources load correctly through the tunnel. Lint, typecheck, and tests passed after the changes.

## 2026-09-15 — Production-readiness audit and Supabase admin setup

### Evidence

- Folder audit: Next.js 16.3.4 app, Supabase migrations, public/admin routes, tests, and existing uncommitted feature files inspected. No project rebuild or business-rule reset performed.
- `rtk --version`: 0.42.0. `ngrok version`: 3.39.9-msix-stable.
- ngrok local API reports active tunnel `https://ravioli-partly-fried.ngrok-free.dev` forwarding to `http://localhost:3000`.
- Supabase CLI `2.117.0`; linked project `udjnspiryqefgeqtgdpt` is `ACTIVE_HEALTHY`, PostgreSQL `17.6.1.166`.
- `supabase db push --linked --yes` applied migrations `202609070001_catalog.sql`, `202609090002_monthly_highlights.sql`, and `20260910174615_normalize_schedule_highlights.sql`.
- Added safe `scripts/create-test-admin.ts`. It requires server-only `SUPABASE_SERVICE_ROLE_KEY` and `TEST_ADMIN_PASSWORD`; no credential is stored in source. A transient CLI key runner was used locally and deleted afterward.
- Test admin created/updated: username `adminegoto`, technical Auth email `adminegoto@egoto.test`, profile role `ADMIN`, email confirmed. Password omitted from this log.
- Supabase login now accepts configured username mapping through `E_GOTO_ADMIN_USERNAME` and `E_GOTO_ADMIN_EMAIL`; direct email login remains supported.
- Public data fix: demo monthly catalog now excludes unpublished schedules from month tabs and cards; homepage/catalog avoid duplicate public repository reads. Regression test added.
- Added baseline security response headers in `next.config.ts`.
- Formatting, lint, typecheck, and tests after changes passed: 16 Vitest tests.
- Final production build passed with Next Turbopack after setting `experimental.cpus=1` to prevent a reproducible worker OOM; final timings were compile `7.5s`, TypeScript `9.0s`, page-data/static generation completed, 23 pages generated.
- Linked Supabase seed succeeded (`5 destinations`, CMC schedules `4`). Local runtime smoke with transient public env passed real `/admin/login → /admin/catalog`, showing 5 destinations; no credential was written to the repository.
- Browser smoke through ngrok public root/catalog/detail/login passed. Home/catalog had `scrollWidth === innerWidth` at all target widths; detail initially exposed 419px content at 360px and was fixed with `min-w-0`, then rechecked at 360px with no overflow. Final axe: home/catalog/login `0 violations`; detail has 4 violations (landmark nesting plus 3 contrast findings) and remains open.

### Open blockers / not yet claimed

- Runtime app `.env.local` lacks Supabase URL/publishable key; the real Auth smoke used a transient server-only runtime injection and is not yet reproducible from the checked-in local env. Demo-mode ngrok is not proof of production Auth.
- RLS table/policy inventory is verified live; Storage upload/delete, audit actions, and published snapshot verification remain pending live app workflow checks.
- Browser Dashboard session was not authenticated; Supabase Dashboard account creation path was not used.
- Full admin/modal responsive audit is not complete. Detail axe contrast/landmark findings remain open.
- Navigation cache verified after the change: first production catalog request `802.8ms`, next month request `328.0ms`; response headers show `x-nextjs-cache: HIT`/30-second stale-while-revalidate on static public shell. Dependency/bundle and full hero image byte audit remain open. Production `next start` returned 200 for public and 307 for protected admin route; image returned AVIF with cache headers.
- `npm audit --omit=dev` reports 2 moderate transitive `uuid` findings under optional Firebase Admin storage dependencies; automated audit fix was blocked by registry remote-package policy and remains a deployment risk to resolve before release.
- Rate limiting, Firebase monitoring credentials, cPanel Node.js configuration, HTTPS domain, and GitHub deployment checks remain deployment blockers.

## 2026-09-11 — Dynamic month catalog and normalized highlights

- Customer and admin month tabs now derive from actual departure schedules; adding a new published month exposes it without a hard-coded two-month limit.
- The homepage catalog rail and its featured trips now use published catalog data, not fixed month or destination lists.
- A highlight discount is now only a schedule and meeting-point price selection. Its departure date and itinerary always inherit from the linked monthly trip.
- Legacy one-highlight payloads normalize safely into the current collection, and a new Supabase migration removes duplicate legacy fields from saved JSON snapshots.
- Customer USD display reads `NEXT_PUBLIC_USD_EXCHANGE_RATE` (default `16000`) instead of a hidden fixed rate; the language selection also updates the document language attribute.
- Destination-level manual sort data has been removed; catalog listings remain derived from the earliest published departure.

## 2026-09-11 — Same-month catalog schedules

- A catalog departure may no longer cross into another month. Lawu October is corrected to 29–31 October 2026, and its October highlight now follows that departure.
- App validation and both Supabase payload validators reject start/end dates that belong to different calendar months.

## 2026-09-09 — Monthly inventory and multi-highlight catalog

- Admin and customer inventory now derive from the selected schedule month; the two active tabs contain complete October and November trip data.
- Every destination has monthly departures matching its duration, completed AVIF galleries, and one discount selection per active month.
- Highlight discount is now a plural collection: each item selects a trip schedule and meeting point, inherits the normal price and itinerary, and stores its own rounded discount price.
- Manual destination sort controls and API action are removed. Listings sort automatically by the earliest published departure, then destination name.
- Admin cover upload has a clear `Pilih file` affordance and selected filename instead of an ambiguous native file picker.
- Admin price/discount entry formats as rounded Rupiah; storage remains integer IDR.
- Customer header provides persisted `ID | EN` and `Rp | $` preferences; catalog cards and trip-detail prices react to the chosen currency (USD uses the fixed display rate of Rp16.000 per USD).
- Added migration `202609090002_monthly_highlights.sql`: removes legacy database ordering and accepts multi-highlight payloads. Apply it after the base migration, before seeding.
- Verified: lint, TypeScript, 11 Vitest tests, and production build all pass. Production compilation: 5.9 seconds, 18 routes.

## 2026-09-09 — Deployment readiness, production guard, and project specification

### Status

- No blocking code error found.
- `rtk npm run lint` passed after removing the unused auth import.
- `rtk npm run typecheck` passed.
- `rtk npm run test` passed: 3 test files, 11 tests.
- `rtk npm run build` passed: Next.js 16.3.4 compiled 18/18 static pages and all public, admin, API, and favicon routes.
- Local HTTP smoke previously returned `200` for homepage, catalog, detail, favicon, AVIF, and social PNG assets.

### Production behavior

- Demo authentication is now development-only through `isDemoMode`.
- Production without Supabase configuration cannot use demo credentials or an old demo cookie; login returns a configuration error and protected admin routes redirect to login.
- Supabase Auth, PostgreSQL catalog repository, published snapshots, roles (`ADMIN`, `EDITOR`, `VIEWER`), audit log, and Storage adapter are ready in the application code.
- Live deployment remains dependent on external Supabase setup: project credentials, migration application, Auth users, `admin_profiles`, Storage bucket, and seed execution.

### Catalog E-GOTO specification

- Stack: Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4, Supabase SSR/Client, Zod, Lucide, Motion, Vitest.
- Public routes: `/`, `/catalog?month=YYYY-MM`, `/catalog/[slug]`, and `/icon.svg`.
- Admin routes: `/admin/login`, `/admin/catalog`, create/edit/preview destination, audit history, publish, unpublish, archive, restore, and duplicate.
- API: protected catalog CRUD/workflow routes, audit route, upload route, login, and logout.
- Monthly catalog: two visible month tabs; schedules are filtered by month and controlled by admin.
- Destination data: cover, gallery, category, duration, prices, schedules, itinerary, include, exclude, notes, and publication status. Ordering is automatic by first departure.
- Highlight discount: multiple monthly offers per destination; each chooses a schedule and meeting point, inherits the trip itinerary, holds a rounded discount price, and has a WhatsApp inquiry.
- Customer inquiry: WhatsApp CTA includes destination, selected schedule, price, discount data, and itinerary.
- Branding: Creato Display headings, semantic teal/forest/white palette, AVIF background/hero and trip imagery, SVG logo/favicon, transparent PNG Instagram/TikTok icons.
- Motion: automatic hero marquee, reduced-motion support, short hover transitions, and smoother WhatsApp CTA motion.
- Security: no service-role key in browser; production demo fallback disabled; server-side payload validation; role-based admin access; RLS and Storage policies included in migration.

### Required production environment

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.example
NEXT_PUBLIC_WHATSAPP_NUMBER=628xxxxxxxxxx
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/your-account
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@your-account
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=catalog-images
```

`E_GOTO_DEMO_EMAIL` and `E_GOTO_DEMO_PASSWORD` are development-only. Never configure them as the production authentication path.

### Deployment checklist

1. Create a Supabase project and configure the production environment variables.
2. Apply `supabase/migrations/202609070001_catalog.sql`, then `supabase/migrations/202609090002_monthly_highlights.sql`.
3. Create Auth users, then add their roles to `public.admin_profiles`.
4. Run `npm run db:seed` with the server-only service-role key.
5. Verify Storage bucket and policies, then run `npm run build`.
6. Deploy the Next.js app using `npm run start` or a compatible Node hosting provider.

Supabase CLI and live credentials are not available in this workspace, so migration apply, live RLS/Auth/Storage verification, and external deployment were not executed.

### Project size

Measured after production build, using binary MB:

- Source, public assets, config, tests, and docs, excluding `.git`, `.next`, and `node_modules`: **11.05 MB**.
- `node_modules`: **521.23 MB**; local dependency workspace only, not a deploy asset bundle.
- `.next`: **908.42 MB**; generated build/cache output, not fully uploaded as source.
- `.git`: **0.03 MB**.
- Current workspace total: **1.41 GB**.

Deployment footprint should be treated as source plus production dependencies/runtime output; local `.next` cache and development dependencies should not be used as a website download-size estimate.

## 2026-09-07 — Storage safety, render delay, and WhatsApp CTA polish

- Storage upload sekarang hanya menerima JPEG, PNG, WebP, dan AVIF dengan batas 5 MB; SVG dan MIME non-gambar ditolak.
- Editor Admin mendukung upload/replace cover dan gallery. Asset lama dihapus setelah draft berhasil disimpan, dengan pemeriksaan ownership folder destination sebelum delete.
- Public dan Admin async pages memakai minimum render delay 650 ms agar loading state tidak langsung berganti saat response sangat cepat; request lambat tetap menunggu data secara natural.
- CTA WhatsApp dirapikan menjadi satu surface hijau dengan layer shadow terpisah, hierarchy teks yang jelas, target sentuh lebih lega, dan focus state yang terlihat.
- Added 4 storage safety tests. Verification: lint passed, typecheck passed, 3 test files / 10 tests passed, production build passed with `experimental.cpus = 1`, and local HTTP smoke returned 200 for home, catalog, and CMC detail with a valid `wa.me` link.
- Live Supabase Storage delete/upload dan RLS tetap menunggu environment Supabase terkonfigurasi.

## 2026-09-07 — Morphing loader and WhatsApp connection

- Added `components/ui/morphing-square.tsx` using `motion/react` and `class-variance-authority`.
- Replaced route loading skeletons with `PageLoading` across root, catalog, and admin route boundaries.
- Added reduced-motion behavior: the square keeps a gentle opacity pulse without rotation.
- Configured the local WhatsApp destination through ignored `.env.local`; CTA now produces a real `https://wa.me/...` URL with destination, date, departure point, and price in the encoded message.
- Browser verification: detail page produced a `wa.me` link, fallback text was absent, and browser console errors were `ok`.

## 2026-09-07 — Normal admin form and calendar input

- Replaced raw JSON-array editing in the admin editor with normal form fields.
- Schedule dates now use native date inputs with calendar picker affordance and a visible calendar icon.
- Prices support label, rupiah amount, add, delete, and reorder controls.
- Schedules support start/end dates, publication status, availability, duplicate, delete, and reorder controls.
- Gallery, include, exclude, notes, and itinerary now use regular inputs with add/delete/reorder actions.
- Internal API payload remains structured; only the editor UI changed.
- Browser regression: CMC editor has 8 date inputs, 18 time inputs, 0 raw JSON editor labels, and console errors `ok`.

## 2026-09-07 — CMS integration, QA, and final verification

### Completed

- Implemented server-side published catalog reads and year/month, category, search, and duration filtering. Public responses are derived from the published snapshot only; draft and archived records stay private.
- Added `/admin/login`, protected `/admin/*` and `/api/admin/*`, demo session fallback, Supabase Auth path, ADMIN/EDITOR/VIEWER authorization, logout redirect, and editor visibility rules for VIEWER.
- Added catalog repository abstraction with demo in-memory mode and Supabase adapter: create draft, save draft, publish, unpublish, archive, restore, duplicate, reorder, and audit history.
- Added draft/published snapshot separation, version metadata, `publishedAt`, human-readable change summary, publish confirmation, dirty-form protection, slug validation, deterministic sort order, and server-side validation for prices and schedules.
- Added migration, RLS/storage policies, slug history, indexes, audit fields, and reproducible `db:seed` workflow under `supabase/` and `scripts/`.
- Added editor preview using the same `TripDetail` renderer, responsive card/list admin layout, upload abstraction, dynamic metadata/Open Graph, and safe WhatsApp configuration with no fake fallback number.
- Fixed public accessibility findings: destination card heading hierarchy and schedule-chip list semantics. Latest axe run: 0 violations; color contrast remains an axe manual-review item.
- Fixed logout behavior: client action now calls `/api/auth/logout`, clears the demo cookie, and routes to `/admin/login`.
- Added `/admin` shortcut redirecting to `/admin/login` when signed out, or `/admin/catalog` after authentication.
- Demo login now accepts a username identifier. Local credentials are loaded from ignored `.env.local`; no password is committed to the repository.

### Verification evidence

- `rtk npx prettier --write app components lib services types tests scripts proxy.ts supabase .env.example docs` — passed.
- `rtk npm run lint` — passed.
- `rtk npm run typecheck` — passed.
- `rtk npm run test` — 2 files, 6 tests passed. Covers published snapshot isolation, publish workflow, October→November schedule movement, validation, and Change Summary.
- `rtk npm run build` — passed. Next.js 16.3.4 compiled all public/admin/API routes and static detail paths.
- Network smoke: `/admin` returned `307 → /admin/login`, `/admin/login` returned `200`, and browser login reached `/admin/catalog` with the new username flow.
- Browser QA with `agent-browser`: public `/catalog?month=2026-12`, CMC detail, `/admin/login`, protected redirect, successful demo login, dashboard, CMC editor, logout, and console errors `ok`.
- Responsive public viewport QA at 360, 390, 430, 768, 820, 1024, 1280, 1440, and 1920px: `scrollWidth === innerWidth` at every viewport. Admin smoke was verified at desktop and mobile layout is card/list-based.
- Fresh Web Interface Guidelines review completed for labels, focus states, semantic controls, async status/error regions, reduced motion, and destructive-action confirmation. See the [guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).

### External verification blocker

- Supabase CLI is not installed in this environment, and no `NEXT_PUBLIC_SUPABASE_URL`, publishable key, or service-role key is configured. Therefore migration apply, live RLS tests, real Supabase Auth/RBAC, Storage upload, and production seed execution could not be run.
- The local demo path is fully verified. Next action for deployment: configure `.env.local`, apply `supabase/migrations/202609070001_catalog.sql`, run `npm run db:seed`, then execute `supabase/tests/catalog_rls.sql` with the Supabase CLI.
- Rate limiting and production observability still require deployment infrastructure; no unsafe claim is made that those external controls are complete.

### Remaining unchecked TODOs

- Storage delete/reorder needs a configured Supabase bucket and a production policy for removing/reordering remote assets.
- Slug-history redirects need the production URL retention policy before wiring permanent redirects.
- Full migration/idempotent-seed/RLS integration tests need a live database; local unit and workflow coverage already passes.
- Production rate limiting needs an external shared store or gateway; the local demo intentionally does not pretend to provide it.

## 2026-09-06

### Done

- Folder `docs` dibuat.
- MASTER IMPLEMENTATION PROMPT disimpan di [plan.md](./plan.md).
- Checklist pekerjaan disimpan di [todo.md](./todo.md).
- Status repository dan blocker dicatat di dokumen ini.
- Aturan bisnis utama didokumentasikan: katalog informasi dan inquiry WhatsApp saja.
- Seed schedule CMC didokumentasikan persis:
  - 12–13 Desember 2026
  - 21–22 Desember 2026
  - 23 Desember 2026
  - 25 Desember 2026
- Model public diperjelas menjadi Monthly Catalog: year/month adalah konteks katalog; tanggal tetap schedule child dari destination.
- `Month Selector` pada dokumentasi diubah menjadi `Monthly Catalog Selector`.
- Public card diwajibkan menampilkan schedule chips ringkas per destination, bukan kalender terpisah.
- Schedule publication lifecycle dipisahkan dari availability status.
- Ditambahkan requirement publish confirmation, Unpublish ke Draft, dan Last Updated otomatis dari `updatedAt`.
- Prompt Hero UI/UX 21st.dev ditambahkan sebagai milestone terpisah; reference marquee/demo dipertahankan, CTA diarahkan ke `/catalog`, dan final logo/palette ditunda.
- Change Request arsitektural ditambahkan: Published Snapshot/Content Version, Change Summary, unsaved changes protection, destination sortOrder, slug safety, server-side filtering, migration/seed, strict TODO evidence, indexing, dan audit extension.
- Asset lokal user ditemukan di `catalog e-goto/`, termasuk gambar destinasi dan folder `logo e-goto`; asset dipertahankan untuk integrasi Hero/public saat source aplikasi tersedia.

### Previous blocker (before approved scaffold)

Worktree project saat ini hanya berisi `.git` dan commit awal `b89d351`; belum ada `package.json`, `src/`, konfigurasi aplikasi, atau source Phase 1–3. Karena itu implementasi, format, lint, typecheck, test, build, dan smoke test belum dapat dijalankan.

Hero UI/UX dan Change Request belum diklaim terimplementasi. Keduanya baru terdokumentasi karena source aplikasi dan database belum tersedia untuk perubahan atau verifikasi.

`AGENTS.md` juga tidak ditemukan di root project maupun lokasi parent yang diperiksa. Aturan terminal yang tersedia dari `C:\Users\fikri\.codex\RTK.md`: semua command terminal wajib diawali `rtk`.

### Historical next action

Pulihkan atau checkout source project E-GOTO ke worktree ini. Setelah source tersedia, implementasikan Hero UI/UX dan Monthly Catalog sesuai `docs/plan.md`, lalu kerjakan checklist `docs/todo.md` berurutan dari Phase 1 sampai Phase 4 dan Change Request. Centang item hanya setelah diverifikasi dengan test atau inspeksi yang sesuai; setiap evidence penting masuk ke log ini.

### UI/UX implementation evidence

- Source aplikasi belum tersedia saat eksekusi dimulai, sehingga frontend prototype Next.js baru dibuat sesuai keputusan scaffold yang sudah disetujui.
- Public UI selesai untuk milestone ini: landing page `/`, Monthly Catalog `/catalog`, dan detail `/catalog/[slug]`.
- Hero 21st.dev diintegrasikan melalui `components/ui/hero-3.tsx`, memakai komponen reusable `AnimatedMarqueeHero`, asset lokal terpusat, CTA `/catalog`, dan reduced-motion support.
- Monthly Catalog memakai query `?month=YYYY-MM`; klik bulan kini mempertahankan konteks katalog saat navigasi/refresh.
- Smoke test browser berhasil untuk landing, catalog, filter Oktober/Desember, empat schedule CMC, detail CMC, price options, itinerary, include/exclude, dan notes.
- Console check `agent-browser errors` menghasilkan `ok` setelah perbaikan hydration mismatch pada motion Hero.
- Accessibility check `agent-browser a11y` pada landing menghasilkan 0 violations; remaining image-overlay contrast items hanya ditandai incomplete untuk manual review oleh axe.
- Responsive viewport check pada 360, 390, 430, 768, 820, 1024, 1280, 1440, dan 1920px tidak menemukan horizontal overflow (`scrollWidth` tetap di bawah viewport width).
- Validasi 2026-09-06: `rtk npm run lint` passed, `rtk npm run typecheck` passed, `rtk npm run test` passed (3 tests), `rtk npm run build` passed.
- CMC tetap memiliki tepat empat schedule awal: 12–13, 21–22, 23, dan 25 Desember 2026. Tidak ada tanggal tambahan.

### Intentionally not implemented

Backend, database, Supabase/PostgreSQL, migration/seed, CMS, authentication/RBAC, audit log, published snapshot, Change Summary, dan production data integration sengaja belum dikerjakan karena milestone aktif hanya UI/UX frontend prototype.

Nomor WhatsApp final belum tersedia; CTA menampilkan state konfigurasi aman tanpa mengarang nomor. Logo, palette, background, typography, dan brand guideline final juga belum dikunci.

### Next action after review

Review visual dan responsive prototype terlebih dahulu. Setelah UI/UX disetujui, lanjutkan milestone backend/CMS secara terpisah tanpa mengubah scope katalog informasi dan inquiry WhatsApp.

## 2026-09-07 — Header blend, automatic marquee, and catalog background

- Header public disatukan dengan Hero memakai gradient deep-teal yang transparan; tidak lagi tampil sebagai bar warna terpisah.
- Tombol header dan Hero memakai state default putih lalu berubah ke teal saat hover/focus.
- Kontrol manual `Jeda galeri` / `Putar galeri` dihapus; marquee sekarang selalu otomatis berjalan menggunakan CSS linear loop.
- Background resmi `background.jpeg` diterapkan pada `/catalog`, detail destination, loading, error, dan not-found melalui `catalog-surface`; content catalog tetap memakai overlay translucent agar texture terbaca halus.
- Motion smoke test landing: `animationPlayState: running`, track berpindah dari `-861.49px` ke `-152.13px`, tombol galeri tidak ada, dan overflow horizontal `false`.
- Verifikasi kode 2026-09-07: `rtk npm run lint`, `rtk npm run typecheck`, `rtk npm run test` (3 passed), dan `rtk npm run build` passed.
- Tidak ada dependency yang di-install; permintaan instalasi tetap membutuhkan persetujuan user.
- CTA landing bagian bawah juga dikoreksi mengikuti state yang sama: default putih, berubah teal saat hover/focus.
- Nomor WhatsApp inquiry dikonfigurasi terpusat sebagai `6282317762549` dengan dukungan override `NEXT_PUBLIC_WHATSAPP_NUMBER`; disclaimer teks di bawah CTA dihapus sesuai arahan review.
- CTA WhatsApp tetap aktif meskipun destination belum memiliki jadwal kalender; pesan memakai tanggal `Belum dipilih` sampai user memilih/menanyakan jadwal.
- Header landing/catalog kini memakai `logo putih.png` yang disalin sebagai `/public/brand/logo-putih.png`, diposisikan di tengah, dan tombol `Lihat katalog` pojok kanan dihapus.

### Integrity note

Tidak ada implementasi yang diklaim selesai hanya karena tercantum di master prompt. Item UI/UX yang dicentang di `todo.md` memiliki evidence di log ini; Phase 2–4 dan Change Request tetap unchecked karena sengaja berada di luar milestone saat ini.

## 2026-09-06 — UI polish pass

- Memperbaiki Hero reduced-motion bug: ketika `prefers-reduced-motion` aktif, konten tidak lagi tertahan pada `opacity: 0`; hanya gerak yang dihentikan.
- Memindahkan marquee gambar ke CSS linear loop `egoto-marquee` agar konsisten; mode normal terverifikasi `animationPlayState: running` dan transform berubah selama 1,2 detik.
- Kartu bulan landing dibuat netral/putih; warna gelap sekarang menjadi hover/focus state, bukan state permanen Desember.
- Feature cards mengganti ikon generik dengan motif garis editorial.
- Filter katalog diubah dari panel besar menjadi control rail dengan label, underline focus, dan chevron select.
- Overlay DestinationCard diperkuat agar teks di atas foto lebih terbaca.
- Validasi ulang: lint, typecheck, test (3 passed), build, browser errors `ok`, dan axe `0 violations`.

## 2026-09-06 — Official palette integration

- Palette UI dipetakan ke semantic tokens resmi: `#29A3A1` sebagai primary dan `#064E4F` sebagai primary-dark/foreground.
- Hero, Monthly Catalog, Catalog page, Detail page, CTA section, DestinationCard overlay, dan not-found state sudah memakai token brand baru.
- Section informasi diperbarui menjadi headline `Jelajahi lebih jauh, dengan informasi yang terasa dekat.` serta copy Card 01–03 sesuai creative direction.
- Tidak ada dependency baru yang di-install; seluruh dependency yang diperlukan sudah tersedia.
- Verifikasi folder `catalog e-goto/logo e-goto/`: folder tersedia tetapi kosong. Logo resmi dan background pattern belum dapat diintegrasikan tanpa membuat asset pengganti, sehingga slot logo masih memakai placeholder existing dan pattern resmi belum diklaim selesai.
- Axe landing check: `0 violations`; image-overlay contrast masih ditandai `incomplete` untuk manual review oleh axe, dengan overlay DestinationCard sudah diperkuat.

## 2026-09-06 — Official assets and marquee correction

- Asset resmi yang kini tersedia di `catalog e-goto/logo e-goto/` sudah disalin apa adanya ke `public/brand/`: `e-goto-logo-transparent.png`, `background.jpeg`, dan `colour pallete.jpeg`.
- `BrandLogo` memakai logo transparan resmi melalui `next/image`; `next.config.ts` diperbarui agar path `/brand/**` diizinkan. File logo berlatar putih tidak digunakan.
- Header memakai surface putih tipis dari palette resmi agar wordmark deep teal terbaca; proporsi dan isi logo tidak diubah.
- Background pattern resmi dipakai secara subtil pada Monthly Catalog dengan blur ringan dan opacity rendah.
- Marquee Hero dipastikan bergerak pada mode normal: `animation-name: egoto-marquee`, `animation-play-state: running`, dan posisi track berubah pada pemeriksaan 1,2 detik.
- Catatan historis: pada iterasi awal reduced-motion sempat memakai tombol opt-in; perilaku tersebut kemudian dihapus. Implementasi sekarang tetap auto-run dengan durasi lebih lambat saat `prefers-reduced-motion` aktif.
- Hydration mismatch Hero tetap teratasi karena konten server tidak dirender dalam keadaan opacity tersembunyi.
- Tidak ada dependency baru yang di-install; permintaan instalasi tetap menunggu persetujuan user.
- Validasi lanjutan: `rtk npm run lint` passed dan `rtk npm run typecheck` passed setelah koreksi marquee dan konfigurasi asset.
- Responsive smoke test Hero/landing pada 360, 390, 430, 768, 820, 1024, 1280, 1440, dan 1920px: seluruh viewport memiliki `scrollWidth` sama dengan viewport width; horizontal overflow tidak ditemukan.

## 2026-09-06 — Landing visual reset and background trial

- Atas review visual terbaru, landing dikembalikan dari teal resmi ke arah desain sebelumnya: paper cream, forest green, warm orange accent, dan kartu putih.
- `background.jpeg` sekarang dipakai sebagai tekstur utama `landing-surface` dari landing/header hingga section bawah dengan overlay ringan agar tetap terbaca.
- Header tidak lagi memakai bar putih-teal yang dominan; surface dibuat menyatu dengan landing dan logo resmi tetap dipakai.
- Hero tetap auto-play pada mode normal. Verifikasi terbaru: `playState: running`, posisi marquee berubah dalam 1,2 detik, dan `overflow: false`.
- Catalog/detail tidak dirombak total; perubahan ini dibatasi pada token visual dan landing page sesuai permintaan review.

## 2026-09-06 — Teal CTA, soft header, automatic marquee

- Hero dan elemen interaktif dikembalikan ke teal resmi: `#29A3A1` dan `#064E4F`.
- CTA Hero `Lihat Katalog Trip` sekarang putih dengan hover teal agar lebih ringan di atas Hero.
- CTA landing lain memakai teal, bukan orange/green yang terlalu dominan.
- Header memakai soft teal transparan agar serasi dengan Hero, tetap terbaca, dan tidak terasa seperti bar terpisah.
- Marquee tidak lagi menunggu tombol pada reduced-motion; tetap otomatis berjalan dengan durasi lebih lambat. Tombol hanya berfungsi sebagai jeda manual.
- Smoke test terbaru: normal dan reduced-motion sama-sama menunjukkan `playState: running`, posisi track berubah dalam 1,2 detik, dan tidak ada horizontal overflow.

## 2026-09-06 — Header blend and CTA state correction

- Header landing/public sekarang memakai gradient soft-teal yang melebur ke Hero tanpa garis atau panel keras.
- Tombol header `Lihat katalog` kembali putih sebagai default dan berubah teal saat hover/focus.
- CTA Hero tetap putih sebagai default dan berubah teal saat hover.
- Token teal diterapkan ke CTA dan state interaktif lintas landing, catalog, detail, loading, dan not-found; WhatsApp tetap mempertahankan green fungsionalnya.
- Smoke test `/catalog` dan `/catalog/cmc-pantai-3-warna-tumpak-sewu` berhasil; seluruh empat schedule CMC tetap tampil dan console errors `ok`.
- Final QA: removed unreferenced UI demo files and unused `framer-motion` dependency; `.gitignore` now excludes Supabase CLI temp state and runtime upload paths. `npm run lint`, `npm run typecheck`, `npm run test` (16 tests) and production build completed after cleanup.
- Final QA evidence: `npm audit --omit=dev` still reports two moderate transitive `uuid` findings through Firebase Admin; this remains a deployment blocker until the active Firebase integration is upgraded/replaced safely.
# Admin QA: PASS — manual verification accepted
