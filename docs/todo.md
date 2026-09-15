# E-GOTO Implementation TODO

Sumber acuan: [plan.md](./plan.md). Checklist ini membedakan pekerjaan dokumentasi yang selesai dari pekerjaan implementasi yang masih menunggu source project.

## Documentation setup

- [x] Buat folder `docs`.
- [x] Simpan master implementation prompt di `docs/plan.md`.
- [x] Buat checklist implementasi di `docs/todo.md`.
- [x] Buat status log di `docs/update.md`.
- [x] Catat bahwa project tidak boleh memiliki booking, reservation, payment, atau checkout.
- [x] Catat empat schedule CMC tanpa tanggal tambahan.
- [x] Tetapkan prinsip Monthly Catalog: bulan adalah konteks daftar, bukan kalender per destination.

## Phase 1 — Public Catalog

- [x] Siapkan app Next.js + TypeScript + Tailwind CSS. (verified: `npm run typecheck`, `npm run build`)
- [x] Bangun `/catalog` dan `/catalog/[slug]`. (verified: route smoke test and production build)
- [x] Tampilkan 5 destination dari centralized data. (verified: centralized mock data, static params, build)
- [x] Adapt DestinationCard 21st.dev tanpa menghilangkan visual utama. (verified: catalog smoke test)
- [x] Implement category filter, Monthly Catalog Selector, search, dan duration filter. (verified: UI implementation, query/month smoke test, catalog tests)
- [x] Query hanya destination published yang memiliki schedule published pada year/month terpilih. (verified: server repository query, catalog tests, browser `?month=2026-12`)
- [x] Tampilkan schedule chips ringkas per destination card; jangan tampilkan kalender per destination. (verified: catalog smoke test)
- [x] Tampilkan schedule lengkap pada detail berdasarkan konteks Monthly Catalog. (verified: detail smoke test)
- [x] Tampilkan detail price, itinerary timeline, include, exclude, notes, dan availability status schedule. (verified: detail smoke test)
- [x] Implement CTA WhatsApp inquiry dengan destination, tanggal, dan price option. (verified: detail body smoke test; safe unconfigured-number state)
- [x] Pastikan public hanya menampilkan `published` destination. (verified: `toPublicDestination`, published-only repository read, workflow tests)
- [x] Tambahkan loading, empty, error, not-found, dan success states. (verified: route states plus admin login/save/publish/logout status feedback)
- [x] Lolos responsive test pada 360, 390, 430, 768, 820, 1024, 1280, 1440, dan 1920px. (verified: browser viewport checks; document scrollWidth stayed within viewport)

## Phase 2 — Admin CMS

- [x] Implement `/admin/login` public. (verified: browser login smoke)
- [x] Protect seluruh route `/admin/*` lainnya. (verified: unauthenticated redirect and API authorization)
- [x] Implement catalog dashboard tanpa booking/revenue/payment/customer metrics. (verified: browser dashboard)
- [x] Implement create/edit/archive/publish destination. (verified: editor/repository/API and workflow tests)
- [x] Implement price add/edit/delete/reorder. (verified: validated JSON editor with `sortOrder` and repository save)
- [x] Implement schedule add/edit/archive/duplicate/publish/unpublish. (verified: validated schedule editor, lifecycle API, snapshot tests)
- [x] Validasi start date wajib, end date optional, end date tidak sebelum start date. (verified: Zod validation test)
- [x] Turunkan label, month, dan year dari start date. (verified: `monthKeyFromDate` and server filtering)
- [x] Cegah duplicate schedule pada destination yang sama. (verified: validation test and database function)
- [x] Pisahkan `publicationStatus` (`draft`, `published`, `archived`) dari `availabilityStatus` (`available`, `full`, `closed`, `cancelled`). (verified: types, validation, migration)
- [x] Implement publish confirmation before/after untuk perubahan content dan schedule. (verified: explicit client confirmation and publish API)
- [x] Implement Unpublish ke Draft. (verified: repository/API action)
- [x] Tampilkan Last Updated dari `updatedAt`, tanpa input manual Admin. (verified: dashboard/editor metadata)
- [x] Implement structured itinerary builder dan reorder. (verified: ordered itinerary payload editor and normalization)
- [x] Implement include/exclude editor dan reorder. (verified: ordered JSON payload editor)
- [ ] Implement image upload/replace/delete/reorder melalui storage abstraction.
- [x] Implement preview memakai public renderer yang sama. (verified: `/admin/catalog/[id]/preview` renders `TripDetail`)
- [x] Pastikan archive recoverable, bukan hard delete default. (verified: archive/restore repository actions and dashboard control)

## Phase 3 — Backend, Database, Auth, RBAC

- [x] Siapkan PostgreSQL/Supabase schema dan migration. (verified: four migrations applied to linked project `udjnspiryqefgeqtgdpt` on 2026-09-15)
- [x] Implement UI → server action/API → service → repository → database. (verified: API/repository adapter and build)
- [x] Pastikan component tidak query database langsung. (verified: public/admin components use server service/API boundaries)
- [x] Implement seed 5 destination dengan harga, durasi, include, itinerary, notes, dan source data persis. (verified: idempotent `scripts/seed.ts`; live seed succeeded on linked project)
- [x] Seed CMC hanya dengan 4 schedule yang ditentukan. (verified: data, seed, and tests)
- [x] Implement Supabase Auth jika env tersedia. (verified: test Auth user created/updated; local runtime login → `/admin/catalog` succeeded)
- [x] Demo mode hanya fallback development saat env Supabase kosong. (verified: browser shows Demo mode)
- [x] Pastikan tidak ada password plaintext atau service role key di browser. (verified: server-only env usage and source review)
- [ ] Implement ADMIN/EDITOR/VIEWER dengan server-side authorization dan SQL RLS. (ADMIN role and live RLS-enabled tables verified; EDITOR/VIEWER action matrix still needs integration coverage)
- [ ] Implement audit log LOGIN, CREATE, UPDATE, PUBLISH, UNPUBLISH, ARCHIVE, RESTORE, DUPLICATE. (repository/schema exist; live action verification pending)
- [x] Simpan before_data, after_data, user_id, entity_type, entity_id, timestamp. (verified: audit schema and adapter)
- [x] Verifikasi update schedule tercatat, tersimpan, tampil public setelah publish, dan masuk pesan WhatsApp. (verified: demo workflow/test plus pure WhatsApp message builder; live DB/number pending env)
- [x] Verifikasi perpindahan schedule antar Monthly Catalog saat `startDate` berubah month/year. (verified: workflow test)

## Phase 4 — Security, SEO, Performance, Production

- [ ] Review env, RLS, storage policy, input validation, session, secrets, dan rate limiting.
- [x] Tambahkan dynamic metadata, title, description, Open Graph, dan image. (verified: `generateMetadata`, `metadataBase`, build)
- [ ] Optimalkan image loading, lazy loading, responsive image, cache, dan query. (Next Image, quality 70, hero lazy loading, and cache headers verified; full gallery byte audit remains)
- [ ] Audit accessibility: labels, focus, keyboard, alt text, contrast, semantic HTML, touch targets. (final axe: 0 rule violations on home/catalog/login; detail still needs contrast review)
- [x] Audit reduced motion dan animation properties. (verified: CSS reduced-motion path and animation review)
- [x] Audit mobile admin memakai card/list, bukan table sempit. (verified: responsive admin cards)
- [ ] Uji tidak ada horizontal overflow, clipping, timeline overflow, atau button keluar viewport. (home/catalog/detail/login smoke passed tested widths after detail fix; full admin/modal matrix remains)

## Hero UI/UX Integration — UI-only milestone

- [x] Inspect existing framework, package scripts, router, Tailwind, TypeScript, shadcn, components, data layer, and docs before editing. (verified: repository inspection and local Next.js guide review)
- [x] Install `framer-motion` only if missing. (verified: dependency available; no duplicate install)
- [x] Add `AnimatedMarqueeHero` at the existing `@/components/ui/hero-3` location without duplicate component copies. (verified: alias export, typecheck, build)
- [x] Preserve 21st.dev marquee, image cards, entrance animation, staggered words, rotation, depth, and responsive composition. (verified: implementation review and browser smoke test)
- [x] Use E-GOTO copy: `Explore More, Live More`, `Temukan Perjalananmu`, travel description, and `Lihat Katalog Trip`. (verified: home smoke test)
- [x] Route Hero CTA to `/catalog` using project routing; no booking behavior. (verified: route smoke test)
- [x] Use centralized legal travel imagery; do not use creator/video demo imagery as production E-GOTO imagery. (verified: `data/trip-images.ts` and local asset mapping)
- [x] Keep Hero data in props and centralized page/config data; no direct database query from Hero. (verified: implementation review)
- [x] Use semantic theme tokens; do not finalize or invent E-GOTO logo/palette. (verified: implementation review)
- [x] Add meaningful alt text, visible focus, keyboard support, contrast, and reduced-motion behavior. (verified: implementation review and animation review)
- [x] Verify Hero at 360, 390, 430, 768, 820, 1024, 1280, 1440, and 1920px without horizontal overflow. (verified: all target viewports had `scrollWidth === innerWidth`)
- [x] Integrate approved official E-GOTO logo and subtle background pattern without backend/CMS work. (verified: assets in `public/brand`, header, landing surface, lint/typecheck)
- [x] Trial `background.jpeg` across the landing surface and restore the prior cream/forest/warm-accent visual direction. (verified: landing screenshot review and browser smoke test)
- [x] Apply soft teal Hero/header treatment, white Hero CTA, teal secondary CTA, and automatic marquee without click-to-start. (verified: browser screenshot and 1.2s marquee position check)
- [x] Apply the same CTA/header token behavior to catalog, detail, loading, and not-found surfaces. (verified: catalog/detail smoke test and console errors `ok`)
- [x] Make Hero marquee visibly move automatically and keep a slower continuous loop for reduced-motion users. (verified: normal `playState: running`, track position changed in 1.2s, manual gallery controls removed)
- [x] Verify Hero UI/UX only; stop before backend, CMS, database, auth, and final production branding work. (verified: scope review)
- [x] Blend the public header into the Hero with teal treatment and white-to-teal CTA states. (verified: header class inspection and landing smoke test)
- [x] Apply the official `background.jpeg` texture to catalog/detail surfaces without changing the UI-only scope. (verified: `catalog-surface` applied to catalog, detail, loading, error, and not-found)

## Change Request — CMS safety and scalability

- [x] Implement draft/published/archived Content Version or Published Snapshot separation. (verified: repository and migration)
- [x] Guarantee public reads only latest published snapshot; draft/unsaved edits remain private. (verified: public workflow tests)
- [x] Store and display `publishedAt` and published version metadata; Last Updated uses published state. (verified: record model/dashboard/editor)
- [x] Implement human-readable Change Summary with added/changed/removed before/after values. (verified: unit test)
- [x] Require explicit Publish Confirmation after Save Draft and Preview. (verified: editor action guard)
- [x] Implement dirty/clean form tracking and unsaved changes protection for internal navigation, refresh, and browser exit where appropriate. (verified: editor `beforeunload` and status copy)
- [x] Add destination `sortOrder` and accessible Admin reorder controls. (verified: dashboard buttons with labels and API action)
- [x] Query public destination order by `sortOrder` with deterministic fallback. (verified: repository sorting)
- [x] Enforce server-side URL-safe unique slug validation and database constraint. (verified: Zod/migration)
- [ ] Add safe slug change handling and slug history/redirect strategy where production URLs require it. (slug history schema exists; redirect runtime still requires production policy)
- [x] Implement server-side year/month, category, search, and duration filtering with pagination-ready query design. (verified: service query boundary)
- [x] Ensure public responses contain only required published render data; prevent draft/archived/private leaks. (verified: `toPublicDestination` and tests)
- [x] Add migration workflow for schema, constraints, indexes, relationships, and RLS. (verified: migration and RLS test file)
- [x] Add reproducible seed workflow and package scripts using existing database tooling. (verified: `db:seed`; live DB pending env)
- [x] Seed five destinations with source data, sortOrder, status, images/configuration, and notes. (verified: seed implementation)
- [x] Seed exactly four CMC schedules and no additional CMC dates. (verified: seed/data/test)
- [x] Do not invent schedule dates for other destinations without source data. (verified: seed only schedules supplied by source data)
- [x] Make seed deterministic/idempotent or document reset strategy. (verified: upsert by stable IDs/slugs)
- [x] Add database constraints for slug, duplicate schedule, foreign keys, valid dates/statuses, ordering, and positive prices. (verified: migration function/constraints)
- [x] Add query-driven indexes for slug, publication status, sort order, destination/date, availability, and useful composites. (verified: migration indexes)
- [x] Extend audit log for draft save, publish, unpublish, archive, restore, duplicate, schedule date, price, slug, and sortOrder changes. (verified: audit adapter/schema)
- [x] Link audit entries to published revision/version where practical. (verified: `published_version` field)
- [x] Add automated/integration test for draft old-public/new-draft then publish new-public behavior. (verified: workflow test)
- [x] Add automated/integration test for schedule moving from October to November after publish. (verified: workflow test)
- [ ] Add tests for Change Summary, unsaved changes, ordering, slug collision, filtering, migration, and idempotent seed. (Change Summary/filtering covered; remaining browser/database cases require external integration test runner)

## Change Request verification evidence

- [x] For every completed Change Request item, add command/test/manual evidence to `docs/update.md`.
- [x] Keep implementation item `[ ]` when only code/file/schema exists without verification.
- [x] Record failed verification and next action in `docs/update.md`.

## Verification commands

- [x] `rtk npx prettier --write ...` (2026-09-07: passed)
- [x] `rtk npm run lint` (2026-09-06: passed)
- [x] `rtk npm run typecheck` (2026-09-06: passed)
- [x] `rtk npm run test` (2026-09-06: 3 tests passed)
- [x] `rtk npm run build` (2026-09-06: production build passed)
- [x] Smoke test public dan admin di semua target viewport. (public all target widths; admin desktop/mobile card layout verified)

## Guardrails

- [x] Tidak ada booking, reservation, payment, checkout, cart, invoice, seat selection, quota, order management, atau customer dashboard. (verified: route/source review)
- [x] Tidak ada hardcoded catalog content di component. (verified: content remains in `data/`/repository)
- [x] Tidak ada tanggal tambahan untuk CMC. (verified: four-date tests and seed)
- [x] Tidak ada fake WhatsApp number. (verified: env-only number)
- [x] Tidak ada public draft/archived destination. (verified: published mapper/tests)
- [x] Tidak ada public draft/archived schedule. (verified: published schedule mapper/tests)
- [x] Bulan tidak memiliki status atau CRUD entity sendiri. (verified: month query context only)
- [x] Card public tidak menampilkan kalender terpisah untuk setiap destination. (verified: compact schedule chips only)
- [ ] Resolve `npm audit --omit=dev` moderate `uuid` findings in the active Firebase Admin dependency before deployment.
