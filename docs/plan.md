# E-GOTO Digital Trip Catalog

## Master Implementation Prompt

> Baca seluruh dokumen ini sebelum mengerjakan project. Dokumen ini adalah sumber acuan utama E-GOTO Digital Trip Catalog dan Trip Information Management System.

## 0. Tujuan Project

Bangun website katalog perjalanan E-GOTO yang modern, premium, visual, interaktif, informatif, responsif, mudah diperbarui, dan selalu menampilkan informasi terbaru.

Produk ini adalah **Digital Trip Catalog + Trip Information Management System**. Produk ini bukan booking website, reservation system, payment website, checkout system, customer booking system, ecommerce, atau CRM booking. Website booking/transaksi berada di website lain.

## 1. Alur Utama

Alur public:

`Open Website → Choose Monthly Catalog → Browse Destinations → See Departure Dates per Destination → Open Detail → Choose Departure Schedule → Read Trip Information → Read Price → Read Itinerary → Read Include/Exclude → Read Notes → Tanya via WhatsApp`

WhatsApp hanya untuk inquiry/contact. Tidak ada booking, checkout, payment, reservation, cart, invoice, seat selection, quota, order management, atau customer account.

## 2. Prinsip Data

Gunakan single source of truth:

`Admin Update → Database → Publish → Public Catalog Updated`

Semua data public berasal dari centralized data. Setelah Admin mengubah dan mem-publish harga, tanggal, jadwal, itinerary, include, exclude, catatan, gambar, durasi, atau deskripsi, public catalog memakai data terbaru tanpa perubahan source code.

## 3. Teknologi dan Arsitektur

- Frontend: Next.js, TypeScript, Tailwind CSS.
- UI: shadcn/ui bila diperlukan, lucide-react, komponen referensi 21st.dev.
- Backend: Next.js Server Actions/Route Handlers atau API layer bersih.
- Database: PostgreSQL, prefer Supabase PostgreSQL.
- Storage: Supabase Storage atau abstraction storage yang mudah diganti.
- Validation: Zod.
- Authentication: secure authentication.
- Authorization: RBAC.
- Date utility: date-fns atau utility date yang sesuai.

Arsitektur wajib:

`UI → Server Action/API → Service → Repository → Database`

Public/admin component tidak query database langsung. Minimal service: `TripService`, `ScheduleService`, `PriceService`, `ItineraryService`, `ImageService`. Repository minimal: `TripRepository`, `ScheduleRepository`, `PriceRepository`, `ItineraryRepository`.

## 4. Design Direction

Public catalog terasa seperti travel magazine + modern digital catalog: modern, premium, clean, natural, elegant, dan interaktif. Gunakan large imagery, rounded cards, clean typography, subtle animation, generous spacing, readable hierarchy, modern timeline, dan interactive schedule cards. Animasi tetap ringan dan purposeful.

Pertahankan visual public catalog, DestinationCard referensi 21st.dev, image zoom, gradient, hover scale, shadow, ArrowRight, rounded card, full-image card, itinerary timeline, monthly selector, price selector, include/exclude, dan CTA WhatsApp. Admin boleh bergaya CMS/dashboard, tetapi public bukan dashboard.

## 5. Responsive

Target viewport: `360px`, `390px`, `430px`, `768px`, `820px`, `1024px`, `1280px`, `1440px`, `1920px`.

Uji small/normal/large mobile, tablet portrait/landscape, laptop, desktop, large desktop, dan touch screen. Tidak boleh ada horizontal overflow, text clipping, button keluar layar, modal keluar viewport, image rusak, card terlalu kecil, table merusak mobile, atau timeline overflow.

## 6. Routes

Public:

- `/catalog`
- `/catalog/[slug]`
- Optional: `/catalog/[slug]?schedule=...`

Admin:

- `/admin/login` — public.
- `/admin/catalog`
- `/admin/catalog/new`
- `/admin/catalog/[id]`
- `/admin/catalog/[id]/edit`
- Optional: `/admin/catalog/[id]/preview`

Semua `/admin/*` selain `/admin/login` wajib protected.

## 7. Monthly Catalog Model

Public catalog menggunakan konsep **Monthly Catalog**. Bulan adalah konteks katalog, bukan kalender yang dimiliki setiap destination dan bukan entitas database terpisah.

Contoh konteks: `Katalog Oktober 2026`, `Katalog November 2026`, `Katalog Desember 2026`, `Katalog Januari 2027`.

Flow public:

`Choose Monthly Catalog → Destination List → Departure Dates per Destination → Destination Detail`

Saat user memilih year/month, tampilkan hanya destination yang memiliki minimal satu schedule dengan destination `publicationStatus = published`, schedule `publicationStatus = published`, dan `startDate` berada pada year/month katalog yang dipilih.

Tanggal tetap atribut schedule milik destination. System mengelompokkan schedule berdasarkan `startDate`; tidak ada field `month` manual dan tidak ada entitas `Month`/`CatalogMonth` yang harus dikelola Admin.

Pada card, tampilkan tanggal ringkas sebagai schedule chips, misalnya `10–12`, `17–19`, `24–26`, beserta label `Jadwal Oktober`. Jangan menampilkan kalender besar per destination. Detail menampilkan schedule cards lengkap, misalnya `10–12 Oktober 2026`, lalu user memilih schedule untuk melihat informasi lengkap.

Jika Admin mengubah `12–13 Oktober 2026` menjadi `14–15 Oktober 2026`, chip dan detail pada Katalog Oktober otomatis berubah. Jika start date dipindah ke `2026-11-02`, schedule otomatis tampil pada Katalog November 2026.

## 8. Public Catalog

Catalog terdiri dari Hero, **Monthly Catalog Selector**, Category Filter, Destination Catalog, dan Trip Cards. Monthly Catalog Selector memilih year/month sebagai konteks daftar destination. Filter public: year/month, category, search, duration. Kategori: `Mountain` dan `Beach & Waterfall`.

Destination card menampilkan nama, durasi, harga mulai, label konteks bulan, dan schedule chips ringkas yang tersedia pada bulan terpilih. Card tidak membuat kalender sendiri.

Detail destination terdiri dari hero image, nama, kategori, durasi, deskripsi, departure schedule, month, schedule cards, selected date, price, includes, excludes, itinerary, notes, dan CTA `Tanya via WhatsApp`.

Public hanya menampilkan destination berstatus `published` dan schedule berstatus `published`. Availability status schedule ditampilkan sesuai aturan:

- `available`: clickable normal.
- `full`: tampil sebagai Full.
- `closed`: tidak dapat dipilih.
- `cancelled`: tampil sebagai Dibatalkan.

## 9. Month dan Schedule

Month selalu diturunkan dari `startDate`, bukan field manual. Jika start date berubah tahun/bulan, schedule berpindah otomatis ke month/year baru.

Model schedule memisahkan publication lifecycle dari status ketersediaan informasi:

```ts
type DepartureSchedule = {
  id: string;
  destinationId: string;
  startDate: string;
  endDate: string | null;
  publicationStatus: "draft" | "published" | "archived";
  availabilityStatus: "available" | "full" | "closed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};
```

`startDate` wajib. `endDate` optional. Jika ada, `endDate >= startDate`. Label otomatis dari tanggal; Admin tidak mengetik label manual. Tolak duplicate dengan kombinasi `destinationId + startDate + endDate`. Archive bersifat recoverable dan bukan hard delete default.

`publicationStatus` menentukan apakah schedule masuk Monthly Catalog public. `availabilityStatus` hanya mengatur tampilan informasi schedule yang sudah published: `available` clickable normal, `full` tampil Full, `closed` tidak dapat dipilih, dan `cancelled` tampil Dibatalkan.

Destination memakai publication status `draft`, `published`, atau `archived`. Bulan tidak memiliki status sendiri. Public menampilkan schedule hanya jika destination dan schedule sama-sama published.

## Catalog Status, Publish Safety, dan Last Updated

Catalog status adalah status publication content, bukan status bulan. Admin mengelola status pada destination dan schedule:

- `Draft`: tersimpan dan dapat dipreview, tetapi tidak masuk public Monthly Catalog.
- `Published`: masuk public jika schedule berada pada year/month yang dipilih.
- `Archived`: tersembunyi tetapi tetap recoverable.
- `Unpublish`: mengembalikan `Published` ke `Draft` tanpa menghapus data.

Sebelum publish, tampilkan confirmation before/after untuk perubahan harga, tanggal, itinerary, include/exclude, notes, gambar, dan status. Contoh: `Harga Jakarta Rp 810.000 → Rp 850.000` serta `Jadwal 12–13 Oktober → 14–15 Oktober`. Publish berjalan setelah Admin mengonfirmasi `Publish Changes`, lalu tampilkan `Informasi berhasil diperbarui.`

Public menampilkan `Info diperbarui 6 Sep 2026` atau format lokal setara, berasal dari `updatedAt` versi published terakhir yang relevan. Admin tidak mengisi nilai ini manual.

Admin dapat add, edit, archive, duplicate, mengubah start/end date, dan status publication/availability. Month/year berubah otomatis melalui start date; Admin tidak mengedit month/year manual. Contoh `12–13 Desember 2026` menjadi `14–15 Desember 2026`; setelah Save + Publish, public memakai tanggal baru.

Tanggal initial CMC wajib persis dan tidak boleh ada tanggal tambahan:

- `2026-12-12` sampai `2026-12-13`
- `2026-12-21` sampai `2026-12-22`
- `2026-12-23` tanpa `endDate`
- `2026-12-25` tanpa `endDate`

## 10. Destination Card 21st.dev

Gunakan struktur reference berikut sebagai baseline, lalu adapt teks, warna, data, href, icon, dan responsive behavior untuk E-GOTO. Jangan menghapus konsep visual utama.

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface DestinationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  location: string;
  flag: string;
  stats: string;
  href: string;
  themeColor: string;
}

const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  ({ className, imageUrl, location, flag, stats, href, themeColor, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{ "--theme-color": themeColor } as React.CSSProperties}
        className={cn("group w-full h-full", className)}
        {...props}
      >
        <a
          href={href}
          className="relative block w-full h-full rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0_60px_-15px_hsl(var(--theme-color)/0.6)]"
          aria-label={`Explore details for ${location}`}
          style={{ boxShadow: `0 0 40px -15px hsl(var(--theme-color) / 0.5)` }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-110"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(var(--theme-color) / 0.9), hsl(var(--theme-color) / 0.6) 30%, transparent 60%)` }} />
          <div className="relative flex flex-col justify-end h-full p-6 text-white">
            <h3 className="text-3xl font-bold tracking-tight">{location} <span className="text-2xl ml-1">{flag}</span></h3>
            <p className="text-sm text-white/80 mt-1 font-medium">{stats}</p>
            <div className="mt-8 flex items-center justify-between bg-[hsl(var(--theme-color)/0.2)] backdrop-blur-md border border-[hsl(var(--theme-color)/0.3)] rounded-lg px-4 py-3 transition-all duration-300 group-hover:bg-[hsl(var(--theme-color)/0.4)] group-hover:border-[hsl(var(--theme-color)/0.5)]">
              <span className="text-sm font-semibold tracking-wide">Explore Now</span>
              <ArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </a>
      </div>
    );
  }
);

DestinationCard.displayName = "DestinationCard";
export { DestinationCard };
```

Adapt `location` menjadi nama destination, `stats` menjadi durasi + kategori + ringkasan schedule, dan CTA menjadi `Explore Trip` bila sesuai.

## 11. WhatsApp

Pertahankan konsep animated 21st.dev button: button memiliki layer depan yang bergerak saat hover dan layer bayangan di belakang. Adapt ke branding E-GOTO, arah hijau WhatsApp, icon WhatsApp, serta teks `Tanya via WhatsApp` atau `Info Trip via WhatsApp`.

Nomor WhatsApp terpusat melalui `WHATSAPP_NUMBER` atau database configuration. Jangan mengarang nomor bisnis yang belum tersedia. Pesan wajib memuat destination, schedule/tanggal, dan selected price option.

Contoh pesan:

```text
Halo E-GOTO,

saya ingin bertanya tentang trip:

Destinasi:
CMC Pantai 3 Warna - Tumpak Sewu

Tanggal:
12–13 Desember 2026

Titik keberangkatan:
Surabaya

Harga:
Rp 1.090.000

Terima kasih.
```

## 12. Images

Buat centralized `src/data/trip-images.ts` atau abstraction setara. Gunakan sumber legal dengan lisensi/penggunaan jelas, prioritaskan Unsplash, Pexels, Wikimedia Commons, atau sumber legal lain. Prioritas subject: Gunung Merbabu, Via Thekelan, Via Selo, Via Suwanting, Gunung Lawu Via Cetho, Pantai 3 Warna, dan Tumpak Sewu. Hindari watermark, URL random, gambar rusak, tidak relevan, atau AI-looking.

## 13. Data Awal — Jangan Diubah

Data awal harus mengikuti source List Destinasi E-GOTO persis. Jangan mengarang, mengoreksi, atau mengubah harga, durasi, itinerary, include, catatan, atau jadwal. Jika ada kejanggalan, pertahankan source dan beri TODO `VERIFY SOURCE DATA`.

### Gunung Merbabu Via Thekelan

- Category: `Mountain`
- Duration: `3 Hari 2 Malam`
- Schedule: `Jumat - Minggu`
- Prices: Jakarta `Rp 830.000`, Bogor `Rp 870.000`, Basecamp `Rp 549.000`.
- Includes: Transportasi PP; Tiket; Makan selama pendakian; Tour Guide; Porter Team; P3K; Tenda Group; Tenda Toilet; Buah (Sop Buah).
- Itinerary:
  - Day 1: `21.00 Penjemputan Meeting Point Jakarta`; `23.00 Penjemputan Meeting Point One Way`; `00.00 Menuju ke Basecamp`.
  - Day 2: `07.00 Tiba di Basecamp`; `08.30 Persiapan Pendakian`; `09.30 Start Trekking`; `11.00 Tiba di Pos 1`; `14.00 Tiba di Pos 2`; `16.30 Tiba di Pos 3 (Area Camp)`; `18.00 ISHOMA`; `18.30 Makan Malam`; `19.00 Istirahat`.
  - Day 3: `02.30 Persiapan Summit`; `03.00 Menuju Top Merbabu`; `06.30 Menikmati Puncak Syarif`; `07.30 Turun ke Area Camp`; `09.00 Makan`; `10.00 Turun Menuju Basecamp`; `15.00 Tiba di Basecamp`; `17.00 Kembali ke Meeting Point`.

### Gunung Merbabu Via Selo

- Category: `Mountain`
- Duration: `3 Hari 2 Malam`
- Schedule: `Jumat - Minggu`
- Prices: Jakarta `Rp 810.000`, Bogor `Rp 899.000`, Basecamp `Rp 549.000`.
- Includes: sama persis dengan Via Thekelan.
- Itinerary:
  - Day 1: `21.00 Penjemputan Meeting Point Jakarta`; `23.00 Penjemputan Meeting Point One Way`; `00.00 Menuju ke Basecamp`.
  - Day 2: `07.00 Tiba di Basecamp`; `08.30 Persiapan Pendakian`; `09.30 Start Trekking`; `11.00 Tiba di Pos 1`; `14.00 Tiba di Pos 2`; `15.30 Tiba di Pos 3 (ISHOMA)`; `17.00 Tiba di Area Camp (Sabana 1)`; `18.30 Makan Malam`; `19.00 Istirahat`.
  - Day 3: `02.30 Persiapan Summit`; `03.00 Menuju Top Merbabu`; `06.30 Menikmati Puncak Kenteng Songo`; `07.30 Turun ke Area Camp`; `09.00 Makan`; `10.00 Turun Menuju Basecamp`; `15.00 Tiba di Basecamp`; `17.00 Kembali ke Meeting Point`.

### Gunung Merbabu Via Suwanting

- Category: `Mountain`
- Duration: `3 Hari 2 Malam`
- Schedule: `Jumat - Minggu`
- Prices: Jakarta `Rp 850.000`, Bogor `Rp 899.000`, Basecamp `Rp 549.000`.
- Includes: sama persis dengan Via Thekelan.
- Itinerary:
  - Day 1: `21.00 Penjemputan Meeting Point Jakarta`; `23.00 Penjemputan Meeting Point One Way`; `00.00 Menuju ke Basecamp`.
  - Day 2: `07.00 Tiba di Basecamp`; `08.30 Persiapan Pendakian`; `09.30 Start Trekking`; `11.00 Tiba di Pos 1`; `14.00 Tiba di Pos 2`; `16.00 Tiba di Pos 3 (Area Camp)`; `18.00 ISHOMA`; `18.30 Makan Malam`; `19.00 Istirahat`.
  - Day 3: `02.30 Persiapan Summit`; `03.00 Menuju Top Merbabu`; `06.30 Menikmati Puncak Kenteng Songo`; `07.30 Turun ke Area Camp`; `09.00 Makan`; `10.00 Turun Menuju Basecamp`; `15.00 Tiba di Basecamp`; `17.00 Kembali ke Meeting Point`.

### Gunung Lawu Via Cetho

- Category: `Mountain`
- Duration: `3 Hari 2 Malam`
- Schedule: `Jumat - Minggu`
- Prices: Jakarta `Rp 830.000`, Bogor `Rp 899.000`, Basecamp `Rp 549.000`.
- Includes: sama persis dengan Via Thekelan.
- Itinerary:
  - Day 1: `19.00 Penjemputan Meeting Point Jakarta`; `21.00 Penjemputan Meeting Point One Way`; `23.00 Menuju ke Basecamp`.
  - Day 2: `07.00 Tiba di Basecamp`; `08.30 Persiapan Pendakian`; `09.30 Start Trekking`; `10.30 Tiba di Pos 1`; `11.30 Tiba di Pos 2`; `12.30 Tiba di Pos 3 (ISHOMA)`; `14.50 Tiba di Pos 4`; `16.30 Tiba di Pos 5`; `18.30 Tiba di Area Camp`; `19.00 Istirahat`.
  - Day 3: `02.30 Persiapan Summit`; `03.00 Menuju Puncak Hargo Dumilah`; `06.30 Menikmati Puncak Kenteng Songo`; `07.30 Turun ke Area Camp`; `09.00 Makan`; `10.00 Turun Menuju Basecamp`; `15.00 Tiba di Basecamp`; `17.00 Kembali ke Meeting Point`.
- Catatan: data `Puncak Kenteng Songo` dipertahankan sesuai source. TODO: `VERIFY SOURCE DATA`.

### CMC Pantai 3 Warna - Tumpak Sewu

- Category: `Beach & Waterfall`
- Duration: `2 Hari 1 Malam`
- Prices: Malang `Rp 930.000`, Sidoarjo `Rp 1.090.000`, Surabaya `Rp 1.090.000`.
- Includes: Transportasi PP; Tiket; Makan (Minimal kuota 5 pack); Tour Guide; P3K; Penginapan; Snorkeling & Canoeing.
- Itinerary:
  - Day 1: `01.00 Penjemputan Meeting Point Surabaya`; `02.30 Penjemputan Meeting Point Sidoarjo`; `06.00 Penjemputan Meeting Point Malang`; `09.30 Tiba di Parkiran CMC`; `10.30 Pantai 3 Warna (Snorkeling & Canoeing)`; `13.30 Bersih-bersih dan makan siang`; `15.00 Menuju Homestay Tumpak Sewu`; `17.00 Tiba di Homestay`; `19.00 Makan Malam`; `20.00 Istirahat`.
  - Day 2: `06.00 Makan Pagi`; `07.30 Trekking Air Terjun Tumpak Sewu`; `11.30 Kembali ke Homestay`; `12.00 Makan Siang (Check Out)`; `13.00 Perjalanan ke titik Mepo Point`; `16.00 Tiba di Kota Malang`; `18.00 Tiba di Kota Sidoarjo`; `19.00 Tiba di Kota Surabaya`.
- Initial schedules hanya: `2026-12-12..2026-12-13`, `2026-12-21..2026-12-22`, `2026-12-23`, `2026-12-25`.

## 14. Data Model

```ts
type TripDestination = {
  id: string;
  slug: string;
  name: string;
  category: "mountain" | "beach_waterfall";
  description: string;
  duration: string;
  coverImage: string;
  gallery: DestinationImage[];
  prices: Price[];
  schedules: DepartureSchedule[];
  includes: string[];
  excludes: string[];
  notes: string[];
  itinerary: ItineraryDay[];
  publicationStatus: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

type Price = { id: string; destinationId: string; label: string; amount: number; sortOrder: number };
type DepartureScheduleRecord = {
  id: string;
  destinationId: string;
  startDate: string;
  endDate: string | null;
  publicationStatus: "draft" | "published" | "archived";
  availabilityStatus: "available" | "full" | "closed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};
type ItineraryDay = { id: string; destinationId: string; dayNumber: number; title: string; sortOrder: number; items: ItineraryItem[] };
type ItineraryItem = { id: string; itineraryDayId: string; time: string; activity: string; sortOrder: number };
type DestinationImage = { id: string; destinationId: string; url: string; alt: string; type: "cover" | "gallery"; sortOrder: number; createdAt: string };
```

Database tables: `destinations`, `departure_schedules`, `destination_prices`, `itinerary_days`, `itinerary_items`, `destination_includes`, `destination_excludes`, `destination_images`, `users`, `roles`, dan `audit_logs`.

## 15. Admin CMS

Dashboard menampilkan Total Destinasi, Published, Draft, Archived, Jadwal Aktif, dan Update Terakhir. Jangan menampilkan booking, revenue, payment, customer, atau conversion.

Catalog table desktop: Destination, Category, Duration, Price From, Schedule, Status, Updated, Actions. Actions: View, Edit, Duplicate, Archive; Preview optional. Mobile memakai card/list representation, bukan table desktop yang dipaksa kecil.

Form destination: nama, slug, kategori, deskripsi, durasi, cover image, gallery, catatan, publication status. Price editor mendukung add/edit/delete/reorder. Schedule editor mendukung add/edit/archive/duplicate, publish, unpublish, dan field start date, optional end date, publication status, serta availability status. Admin hanya memilih tanggal; system menentukan year/month dan label. Itinerary builder wajib structured: add/edit/delete/reorder day/activity, dengan time dan description. Include/exclude editor mendukung add/edit/delete/reorder. Image manager mendukung upload, replace, delete, dan reorder.

Preview memakai public rendering component yang sama dan menerima konteks year/month yang dipilih. Alur: `Edit → Save Draft → Preview → Publish`. `Unpublish` mengembalikan destination atau schedule ke `Draft`; `Archive` menyembunyikan data secara recoverable. Draft dan archived tidak tampil public; published tampil public. Duplicate membuat struktur mirip tanpa membuat schedule duplicate pada destination sumber maupun destination target secara otomatis.

## 16. Auth, RBAC, Security

Public tidak membutuhkan login. Admin wajib secure login. Jangan simpan password plaintext. Gunakan Supabase Auth jika env tersedia; demo mode hanya fallback development ketika env Supabase kosong. Jangan expose service role key; browser hanya memakai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` bila menggunakan Vite legacy setup.

Roles:

- `ADMIN`: create, read, update, archive, publish, manage users.
- `EDITOR`: create, read, update.
- `VIEWER`: read only.

UI boleh menyembunyikan tombol, tetapi authorization utama wajib di server dan SQL RLS. Terapkan secure session/cookies, input validation, database access control, storage access control, audit logs, secret management, dan rate limiting bila diperlukan.

Audit wajib mencatat `LOGIN`, `CREATE`, `UPDATE`, `PUBLISH`, `UNPUBLISH`, `ARCHIVE`, `RESTORE`, serta `DUPLICATE` bila tersedia. Simpan `before_data`, `after_data`, `user_id`, `entity_type`, `entity_id`, dan timestamp. Update schedule harus menyimpan perubahan tanggal, misalnya `12–13` menjadi `14–15 Oktober`, termasuk perubahan konteks Monthly Catalog bila start date berpindah month/year.

## 17. Services dan API Minimum

`getPublishedMonthlyCatalog({ year, month })`, `getDestinationBySlug({ slug, year, month })`, `getDestinationSchedules({ destinationId, year, month })`, `getDestinationPrices()`, `getDestinationItinerary()`, `createDestination()`, `updateDestination()`, `archiveDestination()`, `publishDestination()`, `unpublishDestination()`, `createSchedule()`, `updateSchedule()`, `archiveSchedule()`, `publishSchedule()`, `unpublishSchedule()`, `createPrice()`, `updatePrice()`, `deletePrice()`, dan `updateItinerary()`.

Validasi Zod wajib mencakup destination, slug, category, duration, price, schedule, dan itinerary. Schedule memerlukan start date, end date optional, end date tidak boleh sebelum start date, dan tidak boleh duplicate.

## 18. Error, SEO, Accessibility, Performance

Sediakan loading, empty, error, success, not found, unauthorized, dan forbidden state. Error menyebutkan perbaikan/next step. Public SEO-friendly dengan dynamic title, description, Open Graph, image, dan semantic HTML. Gunakan image optimization, lazy loading below fold, responsive image, caching, query efisien, pagination/filter/search bila perlu, dan hindari fetch berulang.

Accessibility: keyboard navigation, visible focus, labels, aria-label, alt text, contrast, semantic buttons/links, touch targets nyaman. Gunakan `Intl.DateTimeFormat` dan `Intl.NumberFormat`; jangan hardcode format lokal. Hormati `prefers-reduced-motion`, animasikan transform/opacity, dan hindari `transition: all`.

## 19. Implementation Order

1. Phase 1 — Public Catalog.
2. Phase 2 — Admin CMS + CRUD.
3. Phase 3 — Backend + Database + Auth + RBAC + Responsive integration.
4. Phase 4 — Security + SEO + Performance + Production.

Jangan menghapus reference component 21st.dev, jangan mengubah tujuan project, jangan membuat tanggal fiktif, dan jangan hardcode content yang seharusnya dikelola Admin.

## 20. Acceptance Criteria Phase 1

- Public catalog bekerja.
- 5 destination tampil.
- Destination card bekerja.
- Category filter dan Monthly Catalog Selector bekerja.
- Destination hanya muncul jika memiliki schedule published pada year/month terpilih.
- Setiap card menampilkan schedule chips ringkas milik destination pada year/month tersebut.
- Detail menampilkan schedule lengkap untuk konteks year/month tersebut.
- Schedule tampil dengan December 2026 serta `12–13`, `21–22`, `23`, `25` untuk CMC.
- Detail destination bekerja.
- Price options, itinerary, include, notes, dan WhatsApp CTA tampil.
- Responsive di semua target viewport.

## 21. Acceptance Criteria Phase 2

Admin dapat login, create/edit/archive/publish/unpublish destination, add/edit/delete/reorder price, add/edit/change/archive/publish/unpublish schedule, otomatis mengubah month/label dari tanggal, add/edit/reorder itinerary day/activity, add/edit/delete include/exclude, upload/replace/reorder image, preview, publish confirmation before/after, last updated otomatis, dan duplicate.

## 22. Acceptance Criteria Phase 3

PostgreSQL connected; public read database; admin write database; authentication; RBAC; server-side authorization; audit log; schedule/price/itinerary editing; image storage; responsive public/admin; mobile, tablet, laptop, desktop.

## 23. Acceptance Criteria Phase 4

Security review; env/database/storage policy; validation; authorization; error handling; SEO/metadata; image optimization; performance; accessibility; production build; deployment readiness.

## 24. Final Tests

Jalankan `lint`, `typecheck`, `build`, dan `test`; perbaiki semua error. Uji CRUD Create, Read, Update, Archive, Publish, Duplicate. Uji `12–13 Dec → 14–15 Dec` dan pastikan database, public, serta WhatsApp memakai tanggal baru setelah Save + Publish.

Customer smoke test: buka catalog di HP, pilih Monthly Catalog December 2026, lihat daftar destination, pastikan CMC menampilkan empat schedule chips, pilih salah satu, cek price/itinerary/include/notes, klik WhatsApp, lalu pastikan message memuat destination, date, dan price option.

Admin smoke test: login, buka CMC, ubah `12–13 December` menjadi `14–15 December`, Save, Preview, Publish, buka public, pastikan `14–15 December` tampil.

## 25. Final Guardrails

Hasil akhir harus terasa seperti professional digital travel catalog, bukan template CRUD biasa. Prioritas: correctness, data consistency, responsive UX, maintainability, security, performance, dan visual quality. Customer mencari informasi; Admin memperbarui informasi; database menjadi single source of truth; public menampilkan informasi terbaru setelah publish.

## 26. Hero UI/UX Integration — UI-only Milestone

### Scope

Integrasikan Hero berbasis reference 21st.dev `hero-3.tsx` ke existing E-GOTO Digital Trip Catalog. Ini adalah milestone UI/UX saja. Jangan membuat ulang project, jangan mengganti framework, jangan menghapus komponen existing, dan jangan menyelesaikan final branding sebelum logo, background color, palette, typography, dan design tokens dari creative team tersedia.

Pertahankan reference `DestinationCard`, itinerary timeline, price selector, include/exclude, WhatsApp CTA, Monthly Catalog architecture, dan seluruh business scope. Hero hanya memperkenalkan catalog dan mengarahkan user ke `/catalog`; Hero tidak membuat kalender kedua.

### Component contract

File target: `components/ui/hero-3.tsx` atau lokasi existing yang ekuivalen, dengan import target `@/components/ui/hero-3` bila alias project mendukung. Jangan menduplikasi component di beberapa lokasi.

Install `framer-motion` hanya jika belum tersedia. `AnimatedMarqueeHero` tetap reusable dan menerima data melalui props: `tagline`, `title`, `description`, `ctaText`, `images`, dan `className`. Jangan hardcode business data atau query database dari `hero-3.tsx`.

### Reference implementation — preserve baseline

```tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedMarqueeHeroProps {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText: string;
  images: string[];
  className?: string;
}

const ActionButton = ({ children }: { children: React.ReactNode }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="mt-8 rounded-full bg-red-500 px-8 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
  >
    {children}
  </motion.button>
);

export const AnimatedMarqueeHero: React.FC<AnimatedMarqueeHeroProps> = ({
  tagline,
  title,
  description,
  ctaText,
  images,
  className,
}) => {
  const FADE_IN_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  const duplicatedImages = [...images, ...images];

  return (
    <section
      className={cn(
        "relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 text-center",
        className
      )}
    >
      <div className="z-10 flex flex-col items-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mb-4 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm"
        >
          {tagline}
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="text-5xl font-bold tracking-tighter text-foreground md:text-7xl"
        >
          {typeof title === "string"
            ? title.split(" ").map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  variants={FADE_IN_ANIMATION_VARIANTS}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))
            : title}
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          {description}
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.6 }}
        >
          <ActionButton>{ctaText}</ActionButton>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 h-1/3 w-full [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] md:h-2/5">
        <motion.div
          className="flex gap-4"
          animate={{
            x: ["-100%", "0%"],
            transition: { ease: "linear", duration: 40, repeat: Infinity },
          }}
        >
          {duplicatedImages.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-[3/4] h-48 shrink-0 md:h-64"
              style={{ rotate: `${index % 2 === 0 ? -2 : 5}deg` }}
            >
              <img
                src={src}
                alt={`E-GOTO travel showcase ${index + 1}`}
                className="h-full w-full rounded-2xl object-cover shadow-md"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedMarqueeHero;
```

Adaptations required before implementation: CTA must be a semantic route link to `/catalog`; use theme tokens instead of final hardcoded brand colors; keep marquee, image cards, entrance motion, word stagger, slight rotation, and depth; add reduced-motion behavior; use project image strategy (`next/image` where appropriate); add meaningful destination alt text; retain visible focus; and ensure no horizontal overflow at `360`, `390`, `430`, `768`, `820`, `1024`, `1280`, `1440`, and `1920px`.

### Hero content

- Tagline: `Explore More, Live More`.
- Headline: `Temukan Perjalananmu`.
- Description: `Jelajahi berbagai pilihan perjalanan E-GOTO, temukan destinasi favoritmu, dan lihat jadwal trip yang tersedia.`
- CTA: `Lihat Katalog Trip`.
- CTA route: `/catalog`.

Use centralized travel images for Merbabu, Lawu, Pantai 3 Warna, Tumpak Sewu, mountains, beaches, waterfalls, and nature. Do not use 21st.dev creator/video images as final E-GOTO public imagery. Do not invent a final E-GOTO logo or brand palette. Use existing logo/placeholder only until creative assets arrive.

### Original demo reference

Keep this demo contract available for comparison/testing. Do not use creator/video copy as public E-GOTO content:

```tsx
import { AnimatedMarqueeHero } from "@/components/ui/hero-3";

const DEMO_IMAGES = [
  "https://cdn.21st.dev/assets/mirror/9c/9c0892e59c262cc1da34c88d977221da3f36aaef35ede7924d66b80c219be979.jpg",
  "https://cdn.21st.dev/assets/mirror/cb/cb5e5ebf2a894b2cd0e47b41b1fc76a3021ca1e2d2164e68aedca123cd33144f.jpg",
  "https://cdn.21st.dev/assets/mirror/98/989f6e3fb1763ee781695ca8471c7b5c34ee8162b73cb966a692df7183434dd6.jpg",
  "https://cdn.21st.dev/assets/mirror/d4/d42e2bf7d2616d0f8b7133f77efbc40bfbd042fbe5dd5e2ae3bb0b0cd5bf0b00.jpg",
  "https://cdn.21st.dev/assets/mirror/34/34ec840fc286ece83ac48705cb38c8b7bfae31022d3869530edad1e1b1305933.jpg",
  "https://cdn.21st.dev/assets/mirror/3a/3ad7469aaf0ee239cd4a79d5cbd089e88ee36def81eff12b76288139985a8bea.jpg",
  "https://cdn.21st.dev/assets/mirror/82/82d335fc097e30d74dc1b664327e735c0c2c01f807575623c72e2379f3bb3ae6.jpg",
  "https://cdn.21st.dev/assets/mirror/d5/d55bd9d62a8a40170fdb1bab434888bb28c9f11cf7d20bd6dcbe3befe8077abe.jpg",
  "https://cdn.21st.dev/assets/mirror/9c/9c0892e59c262cc1da34c88d977221da3f36aaef35ede7924d66b80c219be979.jpg",
  "https://cdn.21st.dev/assets/mirror/cb/cb5e5ebf2a894b2cd0e47b41b1fc76a3021ca1e2d2164e68aedca123cd33144f.jpg",
  "https://cdn.21st.dev/assets/mirror/98/989f6e3fb1763ee781695ca8471c7b5c34ee8162b73cb966a692df7183434dd6.jpg",
  "https://cdn.21st.dev/assets/mirror/d4/d42e2bf7d2616d0f8b7133f77efbc40bfbd042fbe5dd5e2ae3bb0b0cd5bf0b00.jpg",
  "https://cdn.21st.dev/assets/mirror/34/34ec840fc286ece83ac48705cb38c8b7bfae31022d3869530edad1e1b1305933.jpg",
  "https://cdn.21st.dev/assets/mirror/3a/3ad7469aaf0ee239cd4a79d5cbd089e88ee36def81eff12b76288139985a8bea.jpg",
  "https://cdn.21st.dev/assets/mirror/82/82d335fc097e30d74dc1b664327e735c0c2c01f807575623c72e2379f3bb3ae6.jpg",
  "https://cdn.21st.dev/assets/mirror/d5/d55bd9d62a8a40170fdb1bab434888bb28c9f11cf7d20bd6dcbe3befe8077abe.jpg",
];

const AnimatedHeroDemo = () => (
  <AnimatedMarqueeHero
    tagline="Join over 100,000 happy creators"
    title={<>Engage Audiences<br />with Stunning Videos</>}
    description="Boost Your Brand with High-Impact Short Videos from our expert content creators. Our team is ready to propel your business forward."
    ctaText="Get Started"
    images={DEMO_IMAGES}
  />
);

export default AnimatedHeroDemo;
```

The demo is reference-only. The production Hero uses E-GOTO copy, travel imagery, theme tokens, and `/catalog` navigation.

## 27. Change Request — Architecture, CMS Safety, and Verification

This addendum strengthens the existing architecture. It does not replace the plan, remove Monthly Catalog, remove 21st.dev references, change business scope, or add booking/reservation/payment/checkout/cart/invoice/quota/seat selection/customer dashboard/revenue/order management. Existing `docs/plan.md` remains the primary source; `docs/todo.md` remains the checklist; `docs/update.md` remains the status log.

### 27.1 Content Version and Published Snapshot

Separate `draft`, `published`, and `archived` content in the data model. Public queries must read only the latest published snapshot/revision. A draft may be previewed, but unsaved or draft data never reaches public. Publish explicitly promotes the draft to published state. Unpublish removes it from public and returns it to Draft; archive remains recoverable.

Use a robust PostgreSQL/Supabase strategy such as a revision table, snapshot record, version number, `publishedAt`, and `publishedVersion`. The exact schema may follow existing architecture, but behavior is fixed:

`Edit → Save Draft → Preview → Change Summary → Publish Confirmation → Published Snapshot → Public Catalog`.

Public `Last Updated` must use published timestamp, never an unsaved admin edit. Tests must prove public remains old (`Rp 810.000`, `12–13`) while draft is new (`Rp 850.000`, `14–15`), then changes only after Publish.

### 27.2 Human-readable Change Summary

Before publishing, show added, changed, and removed values for destination information, name, slug, category, description, duration, prices, schedules, publication status, availability status, itinerary, include, exclude, notes, cover image, gallery, and ordering. Show human-readable before/after labels, not UUIDs or database row names. Publish never happens automatically after Save Draft.

### 27.3 Unsaved Changes Protection

Track dirty/clean form state. Dirty activates after editable fields change and resets after successful Save Draft or discard. Protect internal navigation, destination changes, catalog return, refresh, and browser close where technically appropriate. Warn only when dirty; offer Stay and Continue Editing or Leave Without Saving.

### 27.4 Destination Ordering

Add `sortOrder: number` to destination. Admin can reorder using accessible drag/drop or move up/down. Public orders by `sortOrder` with deterministic fallback. Keep existing ordering for prices, itinerary days/items, images, and include/exclude.

### 27.5 Slug Safety

Slug must be unique, URL-safe, deterministic, validated server-side, collision-safe, and protected by a database unique constraint. Unknown slug returns not-found. If an existing slug changes, preserve URL safety through slug history/redirect when appropriate; do not silently break production URLs. Client validation is insufficient.

### 27.6 Server-side Monthly Catalog Filtering

Support query parameters conceptually like `/catalog?year=2026&month=12`, with optional `category`, `search`, and `duration`. Filter year/month, category, search, and duration in the server/database layer; support pagination; avoid N+1 and unnecessary records. Public query condition remains destination publication published + schedule publication published + schedule startDate in selected year/month. Public receives only renderable published data and never draft/archived/private admin fields.

### 27.7 Migration and Seed Workflow

Provide reproducible install → environment → migration → seed → development workflow using the existing database tooling. Migrations create tables, constraints, indexes, relationships, RLS, and required structures. Seed five initial destinations with source data, sortOrder, statuses, images/reference configuration, and notes. CMC has exactly four initial schedules: `2026-12-12..2026-12-13`, `2026-12-21..2026-12-22`, `2026-12-23`, and `2026-12-25`; no extra CMC dates. Do not invent dates for other destinations. Seed should be deterministic/idempotent or document reset behavior. Protect slug uniqueness, schedule duplicate prevention, foreign keys, valid date range/statuses, ordering, and positive price amounts.

### 27.8 Strict TODO Verification

An implementation TODO is checked only after actual evidence: lint, typecheck, unit/integration/API/database test, build, UI smoke test, responsive inspection, or manual functional verification as appropriate. File existence or generated code is not evidence. Every checked implementation item gets evidence in `docs/update.md`; failed or unverified work stays `[ ]`.

### 27.9 Acceptance Criteria for Change Request

- Draft changes do not affect public; Preview may show draft; published state is separate; Last Updated reflects published state; Unpublish and recoverable Archive work.
- Change Summary identifies added/changed/removed values and Publish requires explicit confirmation.
- Dirty forms warn on unsafe navigation and remain silent when clean; Save Draft resets dirty state.
- Destination has deterministic `sortOrder`, Admin can reorder, and public respects order.
- Slug validation, uniqueness, collision rejection, safe route handling, and not-found behavior work.
- Year/month, category, search, and duration filtering are server-side; public does not load unnecessary draft/archived data or cause avoidable N+1 queries.
- Clean database migration works; seed works safely; CMC has exactly four initial schedules; no invented CMC dates.
- No TODO is marked complete without evidence in `docs/update.md`.

### 27.10 Indexes

Evaluate indexes for `destinations.slug`, `destinations.publication_status`, `destinations.sort_order`, `departure_schedules.destination_id`, `departure_schedules.start_date`, `departure_schedules.publication_status`, and `departure_schedules.availability_status`. Use composite indexes where Monthly Catalog queries benefit; avoid excessive indexes.

### 27.11 Audit Extension

Retain existing audit fields `before_data`, `after_data`, `user_id`, `entity_type`, `entity_id`, and timestamp. Extend actions to draft save, publish, unpublish, archive, restore, duplicate, schedule date changes, price changes, slug changes, and sortOrder changes. Reference the revision/published version where practical.

### 27.12 Monthly Catalog Integrity

Month/year remain derived only from `schedule.startDate`. There is no Month table, CatalogMonth table, or manual stored month field. Changing `2026-10-12` to `2026-11-02` moves the schedule from October 2026 to November 2026 only after the relevant publish operation. Cover this with automated or integration testing.

### 27.13 Implementation Priority and Quality Gate

Preferred order: database migration/schema support; published snapshot; destination sortOrder; slug safety; server-side Monthly Catalog filtering; migration/seed workflow; Change Summary; unsaved changes protection; tests; documentation evidence. Keep implementation simple, clear, maintainable, secure, testable, and scalable without unnecessary enterprise abstraction.

Final gate requires safe draft/published separation, public-only published reads, respected service/repository boundaries, working CMS safety, server-side filters, correct order, clean migration/seed, constraints/indexes, passing lint/typecheck/test/build, relevant UI smoke tests, updated docs, and no falsely checked TODO.
