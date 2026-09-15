import type {
  DepartureSchedule,
  ItineraryDay,
  TripDestination,
} from "@/types/catalog";
import { tripImages } from "@/data/trip-images";

const merbabuIncludes = [
  "Transportasi PP",
  "Tiket",
  "Makan selama pendakian",
  "Tour Guide",
  "Porter Team",
  "P3K",
  "Tenda Group",
  "Tenda Toilet",
  "Buah (Sop Buah)",
];

const mountaineeringDayOne: ItineraryDay = {
  dayNumber: 1,
  title: "Perjalanan menuju basecamp",
  sortOrder: 1,
  items: [
    {
      time: "21.00",
      activity: "Penjemputan Meeting Point Jakarta",
      sortOrder: 1,
    },
    {
      time: "23.00",
      activity: "Penjemputan Meeting Point One Way",
      sortOrder: 2,
    },
    { time: "00.00", activity: "Menuju ke Basecamp", sortOrder: 3 },
  ],
};

const thekelanItinerary: ItineraryDay[] = [
  mountaineeringDayOne,
  {
    dayNumber: 2,
    title: "Pendakian menuju area camp",
    sortOrder: 2,
    items: [
      { time: "07.00", activity: "Tiba di Basecamp", sortOrder: 1 },
      { time: "08.30", activity: "Persiapan Pendakian", sortOrder: 2 },
      { time: "09.30", activity: "Start Trekking", sortOrder: 3 },
      { time: "11.00", activity: "Tiba di Pos 1", sortOrder: 4 },
      { time: "14.00", activity: "Tiba di Pos 2", sortOrder: 5 },
      { time: "16.30", activity: "Tiba di Pos 3 (Area Camp)", sortOrder: 6 },
      { time: "18.00", activity: "ISHOMA", sortOrder: 7 },
      { time: "18.30", activity: "Makan Malam", sortOrder: 8 },
      { time: "19.00", activity: "Istirahat", sortOrder: 9 },
    ],
  },
  {
    dayNumber: 3,
    title: "Summit dan perjalanan pulang",
    sortOrder: 3,
    items: [
      { time: "02.30", activity: "Persiapan Summit", sortOrder: 1 },
      { time: "03.00", activity: "Menuju Top Merbabu", sortOrder: 2 },
      { time: "06.30", activity: "Menikmati Puncak Syarif", sortOrder: 3 },
      { time: "07.30", activity: "Turun ke Area Camp", sortOrder: 4 },
      { time: "09.00", activity: "Makan", sortOrder: 5 },
      { time: "10.00", activity: "Turun Menuju Basecamp", sortOrder: 6 },
      { time: "15.00", activity: "Tiba di Basecamp", sortOrder: 7 },
      { time: "17.00", activity: "Kembali ke Meeting Point", sortOrder: 8 },
    ],
  },
];

const seloItinerary: ItineraryDay[] = [
  mountaineeringDayOne,
  {
    dayNumber: 2,
    title: "Pendakian menuju area camp",
    sortOrder: 2,
    items: [
      { time: "07.00", activity: "Tiba di Basecamp", sortOrder: 1 },
      { time: "08.30", activity: "Persiapan Pendakian", sortOrder: 2 },
      { time: "09.30", activity: "Start Trekking", sortOrder: 3 },
      { time: "11.00", activity: "Tiba di Pos 1", sortOrder: 4 },
      { time: "14.00", activity: "Tiba di Pos 2", sortOrder: 5 },
      { time: "15.30", activity: "Tiba di Pos 3 (ISHOMA)", sortOrder: 6 },
      { time: "17.00", activity: "Tiba di Area Camp (Sabana 1)", sortOrder: 7 },
      { time: "18.30", activity: "Makan Malam", sortOrder: 8 },
      { time: "19.00", activity: "Istirahat", sortOrder: 9 },
    ],
  },
  {
    dayNumber: 3,
    title: "Summit dan perjalanan pulang",
    sortOrder: 3,
    items: [
      { time: "02.30", activity: "Persiapan Summit", sortOrder: 1 },
      { time: "03.00", activity: "Menuju Top Merbabu", sortOrder: 2 },
      {
        time: "06.30",
        activity: "Menikmati Puncak Kenteng Songo",
        sortOrder: 3,
      },
      { time: "07.30", activity: "Turun ke Area Camp", sortOrder: 4 },
      { time: "09.00", activity: "Makan", sortOrder: 5 },
      { time: "10.00", activity: "Turun Menuju Basecamp", sortOrder: 6 },
      { time: "15.00", activity: "Tiba di Basecamp", sortOrder: 7 },
      { time: "17.00", activity: "Kembali ke Meeting Point", sortOrder: 8 },
    ],
  },
];

const suwantingItinerary: ItineraryDay[] = [
  mountaineeringDayOne,
  {
    dayNumber: 2,
    title: "Pendakian menuju area camp",
    sortOrder: 2,
    items: [
      { time: "07.00", activity: "Tiba di Basecamp", sortOrder: 1 },
      { time: "08.30", activity: "Persiapan Pendakian", sortOrder: 2 },
      { time: "09.30", activity: "Start Trekking", sortOrder: 3 },
      { time: "11.00", activity: "Tiba di Pos 1", sortOrder: 4 },
      { time: "14.00", activity: "Tiba di Pos 2", sortOrder: 5 },
      { time: "16.00", activity: "Tiba di Pos 3 (Area Camp)", sortOrder: 6 },
      { time: "18.00", activity: "ISHOMA", sortOrder: 7 },
      { time: "18.30", activity: "Makan Malam", sortOrder: 8 },
      { time: "19.00", activity: "Istirahat", sortOrder: 9 },
    ],
  },
  {
    dayNumber: 3,
    title: "Summit dan perjalanan pulang",
    sortOrder: 3,
    items: [
      { time: "02.30", activity: "Persiapan Summit", sortOrder: 1 },
      { time: "03.00", activity: "Menuju Top Merbabu", sortOrder: 2 },
      {
        time: "06.30",
        activity: "Menikmati Puncak Kenteng Songo",
        sortOrder: 3,
      },
      { time: "07.30", activity: "Turun ke Area Camp", sortOrder: 4 },
      { time: "09.00", activity: "Makan", sortOrder: 5 },
      { time: "10.00", activity: "Turun Menuju Basecamp", sortOrder: 6 },
      { time: "15.00", activity: "Tiba di Basecamp", sortOrder: 7 },
      { time: "17.00", activity: "Kembali ke Meeting Point", sortOrder: 8 },
    ],
  },
];

const lawuItinerary: ItineraryDay[] = [
  {
    dayNumber: 1,
    title: "Perjalanan menuju basecamp",
    sortOrder: 1,
    items: [
      {
        time: "19.00",
        activity: "Penjemputan Meeting Point Jakarta",
        sortOrder: 1,
      },
      {
        time: "21.00",
        activity: "Penjemputan Meeting Point One Way",
        sortOrder: 2,
      },
      { time: "23.00", activity: "Menuju ke Basecamp", sortOrder: 3 },
    ],
  },
  {
    dayNumber: 2,
    title: "Pendakian menuju area camp",
    sortOrder: 2,
    items: [
      { time: "07.00", activity: "Tiba di Basecamp", sortOrder: 1 },
      { time: "08.30", activity: "Persiapan Pendakian", sortOrder: 2 },
      { time: "09.30", activity: "Start Trekking", sortOrder: 3 },
      { time: "10.30", activity: "Tiba di Pos 1", sortOrder: 4 },
      { time: "11.30", activity: "Tiba di Pos 2", sortOrder: 5 },
      { time: "12.30", activity: "Tiba di Pos 3 (ISHOMA)", sortOrder: 6 },
      { time: "14.50", activity: "Tiba di Pos 4", sortOrder: 7 },
      { time: "16.30", activity: "Tiba di Pos 5", sortOrder: 8 },
      { time: "18.30", activity: "Tiba di Area Camp", sortOrder: 9 },
      { time: "19.00", activity: "Istirahat", sortOrder: 10 },
    ],
  },
  {
    dayNumber: 3,
    title: "Summit dan perjalanan pulang",
    sortOrder: 3,
    items: [
      { time: "02.30", activity: "Persiapan Summit", sortOrder: 1 },
      { time: "03.00", activity: "Menuju Puncak Hargo Dumilah", sortOrder: 2 },
      {
        time: "06.30",
        activity: "Menikmati Puncak Kenteng Songo",
        sortOrder: 3,
      },
      { time: "07.30", activity: "Turun ke Area Camp", sortOrder: 4 },
      { time: "09.00", activity: "Makan", sortOrder: 5 },
      { time: "10.00", activity: "Turun Menuju Basecamp", sortOrder: 6 },
      { time: "15.00", activity: "Tiba di Basecamp", sortOrder: 7 },
      { time: "17.00", activity: "Kembali ke Meeting Point", sortOrder: 8 },
    ],
  },
];

const cmcItinerary: ItineraryDay[] = [
  {
    dayNumber: 1,
    title: "Pantai 3 Warna dan perjalanan ke homestay",
    sortOrder: 1,
    items: [
      {
        time: "01.00",
        activity: "Penjemputan Meeting Point Surabaya",
        sortOrder: 1,
      },
      {
        time: "02.30",
        activity: "Penjemputan Meeting Point Sidoarjo",
        sortOrder: 2,
      },
      {
        time: "06.00",
        activity: "Penjemputan Meeting Point Malang",
        sortOrder: 3,
      },
      { time: "09.30", activity: "Tiba di Parkiran CMC", sortOrder: 4 },
      {
        time: "10.30",
        activity: "Pantai 3 Warna (Snorkeling & Canoeing)",
        sortOrder: 5,
      },
      {
        time: "13.30",
        activity: "Bersih-bersih dan makan siang",
        sortOrder: 6,
      },
      { time: "15.00", activity: "Menuju Homestay Tumpak Sewu", sortOrder: 7 },
      { time: "17.00", activity: "Tiba di Homestay", sortOrder: 8 },
      { time: "19.00", activity: "Makan Malam", sortOrder: 9 },
      { time: "20.00", activity: "Istirahat", sortOrder: 10 },
    ],
  },
  {
    dayNumber: 2,
    title: "Tumpak Sewu dan perjalanan pulang",
    sortOrder: 2,
    items: [
      { time: "06.00", activity: "Makan Pagi", sortOrder: 1 },
      {
        time: "07.30",
        activity: "Trekking Air Terjun Tumpak Sewu",
        sortOrder: 2,
      },
      { time: "11.30", activity: "Kembali ke Homestay", sortOrder: 3 },
      { time: "12.00", activity: "Makan Siang (Check Out)", sortOrder: 4 },
      {
        time: "13.00",
        activity: "Perjalanan ke titik Mepo Point",
        sortOrder: 5,
      },
      { time: "16.00", activity: "Tiba di Kota Malang", sortOrder: 6 },
      { time: "18.00", activity: "Tiba di Kota Sidoarjo", sortOrder: 7 },
      { time: "19.00", activity: "Tiba di Kota Surabaya", sortOrder: 8 },
    ],
  },
];

const schedule = (
  id: string,
  startDate: string,
  endDate: string | null,
): DepartureSchedule => ({
  id,
  startDate,
  endDate,
  publicationStatus: "published",
  availabilityStatus: "available",
});

const destination = (
  data: Omit<TripDestination, "publicationStatus">,
): TripDestination => ({
  ...data,
  publicationStatus: "published",
});

export const destinations: TripDestination[] = [
  destination({
    id: "merbabu-thekelan",
    slug: "gunung-merbabu-via-thekelan",
    name: "Gunung Merbabu Via Thekelan",
    category: "mountain",
    duration: "3 Hari 2 Malam",
    description: "",
    coverImage: {
      src: tripImages.merbabu,
      alt: "Gunung Merbabu landscape",
      sortOrder: 1,
    },
    gallery: [
      {
        src: tripImages.ranuKumbolo,
        alt: "Mountain lake landscape",
        sortOrder: 1,
      },
      { src: tripImages.merbabu, alt: "Jalur Gunung Merbabu", sortOrder: 2 },
      {
        src: tripImages.ijen,
        alt: "Lanskap pegunungan pagi hari",
        sortOrder: 3,
      },
    ],
    prices: [
      {
        id: "thekelan-jakarta",
        label: "Jakarta",
        amount: 830000,
        sortOrder: 1,
      },
      { id: "thekelan-bogor", label: "Bogor", amount: 870000, sortOrder: 2 },
      {
        id: "thekelan-basecamp",
        label: "Basecamp",
        amount: 549000,
        sortOrder: 3,
      },
    ],
    schedules: [
      schedule("thekelan-2026-10-10", "2026-10-10", "2026-10-12"),
      schedule("thekelan-2026-11-14", "2026-11-14", "2026-11-16"),
    ],
    includes: merbabuIncludes,
    excludes: [],
    notes: ["Jadwal: hari Jumat - Minggu"],
    itinerary: thekelanItinerary,
    highlights: [
      {
        id: "thekelan-october",
        enabled: true,
        label: "Promo Oktober Thekelan",
        scheduleId: "thekelan-2026-10-10",
        priceId: "thekelan-jakarta",
        discountAmount: 749000,
        discountType: "fixed",
        discountValue: 81000,
      },
      {
        id: "thekelan-november",
        enabled: true,
        label: "Promo November Thekelan",
        scheduleId: "thekelan-2026-11-14",
        priceId: "thekelan-bogor",
        discountAmount: 789000,
        discountType: "fixed",
        discountValue: 81000,
      },
    ],
    updatedAt: "2026-09-06",
  }),
  destination({
    id: "merbabu-selo",
    slug: "gunung-merbabu-via-selo",
    name: "Gunung Merbabu Via Selo",
    category: "mountain",
    duration: "3 Hari 2 Malam",
    description: "",
    coverImage: {
      src: tripImages.merbabu,
      alt: "Gunung Merbabu Via Selo landscape",
      sortOrder: 1,
    },
    gallery: [
      {
        src: tripImages.ranuKumbolo,
        alt: "Mountain lake landscape",
        sortOrder: 1,
      },
      { src: tripImages.merbabu, alt: "Jalur Gunung Merbabu", sortOrder: 2 },
      { src: tripImages.bromo, alt: "Panorama gunung saat pagi", sortOrder: 3 },
    ],
    prices: [
      { id: "selo-jakarta", label: "Jakarta", amount: 810000, sortOrder: 1 },
      { id: "selo-bogor", label: "Bogor", amount: 899000, sortOrder: 2 },
      { id: "selo-basecamp", label: "Basecamp", amount: 549000, sortOrder: 3 },
    ],
    schedules: [
      schedule("selo-2026-10-17", "2026-10-17", "2026-10-19"),
      schedule("selo-2026-11-21", "2026-11-21", "2026-11-23"),
    ],
    includes: merbabuIncludes,
    excludes: [],
    notes: ["Jadwal: hari Jumat - Minggu"],
    itinerary: seloItinerary,
    highlights: [
      {
        id: "selo-october",
        enabled: true,
        label: "Promo Oktober Selo",
        scheduleId: "selo-2026-10-17",
        priceId: "selo-jakarta",
        discountAmount: 729000,
        discountType: "fixed",
        discountValue: 81000,
      },
      {
        id: "selo-november",
        enabled: true,
        label: "Promo November Selo",
        scheduleId: "selo-2026-11-21",
        priceId: "selo-bogor",
        discountAmount: 809000,
        discountType: "fixed",
        discountValue: 90000,
      },
    ],
    updatedAt: "2026-09-06",
  }),
  destination({
    id: "merbabu-suwanting",
    slug: "gunung-merbabu-via-suwanting",
    name: "Gunung Merbabu Via Suwanting",
    category: "mountain",
    duration: "3 Hari 2 Malam",
    description: "",
    coverImage: {
      src: tripImages.merbabu,
      alt: "Gunung Merbabu Via Suwanting landscape",
      sortOrder: 1,
    },
    gallery: [
      {
        src: tripImages.ranuKumbolo,
        alt: "Mountain lake landscape",
        sortOrder: 1,
      },
      { src: tripImages.merbabu, alt: "Jalur Gunung Merbabu", sortOrder: 2 },
      { src: tripImages.wurung, alt: "Lanskap gunung terbuka", sortOrder: 3 },
    ],
    prices: [
      {
        id: "suwanting-jakarta",
        label: "Jakarta",
        amount: 850000,
        sortOrder: 1,
      },
      { id: "suwanting-bogor", label: "Bogor", amount: 899000, sortOrder: 2 },
      {
        id: "suwanting-basecamp",
        label: "Basecamp",
        amount: 549000,
        sortOrder: 3,
      },
    ],
    schedules: [
      schedule("suwanting-2026-10-24", "2026-10-24", "2026-10-26"),
      schedule("suwanting-2026-11-28", "2026-11-28", "2026-11-30"),
    ],
    includes: merbabuIncludes,
    excludes: [],
    notes: ["Jadwal: hari Jumat - Minggu"],
    itinerary: suwantingItinerary,
    highlights: [
      {
        id: "suwanting-october",
        enabled: true,
        label: "Promo Oktober Suwanting",
        scheduleId: "suwanting-2026-10-24",
        priceId: "suwanting-jakarta",
        discountAmount: 765000,
        discountType: "fixed",
        discountValue: 85000,
      },
      {
        id: "suwanting-november",
        enabled: true,
        label: "Promo November Suwanting",
        scheduleId: "suwanting-2026-11-28",
        priceId: "suwanting-basecamp",
        discountAmount: 499000,
        discountType: "fixed",
        discountValue: 50000,
      },
    ],
    updatedAt: "2026-09-06",
  }),
  destination({
    id: "lawu-cetho",
    slug: "gunung-lawu-via-cetho",
    name: "Gunung Lawu Via Cetho",
    category: "mountain",
    duration: "3 Hari 2 Malam",
    description: "",
    coverImage: {
      src: tripImages.lawu,
      alt: "Gunung Lawu Via Cetho landscape",
      sortOrder: 1,
    },
    gallery: [
      { src: tripImages.wurung, alt: "Volcanic landscape", sortOrder: 1 },
      { src: tripImages.lawu, alt: "Jalur Gunung Lawu", sortOrder: 2 },
      {
        src: tripImages.ijen,
        alt: "Lanskap pegunungan pagi hari",
        sortOrder: 3,
      },
    ],
    prices: [
      { id: "lawu-jakarta", label: "Jakarta", amount: 830000, sortOrder: 1 },
      { id: "lawu-bogor", label: "Bogor", amount: 899000, sortOrder: 2 },
      { id: "lawu-basecamp", label: "Basecamp", amount: 549000, sortOrder: 3 },
    ],
    schedules: [
      schedule("lawu-2026-10-29", "2026-10-29", "2026-10-31"),
      schedule("lawu-2026-11-07", "2026-11-07", "2026-11-09"),
    ],
    includes: merbabuIncludes,
    excludes: [],
    notes: [
      "Jadwal: hari Jumat - Minggu",
      "VERIFY SOURCE DATA: Puncak Kenteng Songo dipertahankan sesuai source.",
    ],
    itinerary: lawuItinerary,
    highlights: [
      {
        id: "lawu-october",
        enabled: true,
        label: "Promo Oktober Lawu",
        scheduleId: "lawu-2026-10-29",
        priceId: "lawu-jakarta",
        discountAmount: 749000,
        discountType: "fixed",
        discountValue: 81000,
      },
      {
        id: "lawu-november",
        enabled: true,
        label: "Promo November Lawu",
        scheduleId: "lawu-2026-11-07",
        priceId: "lawu-bogor",
        discountAmount: 809000,
        discountType: "fixed",
        discountValue: 90000,
      },
    ],
    updatedAt: "2026-09-06",
  }),
  destination({
    id: "cmc-tumpak-sewu",
    slug: "cmc-pantai-3-warna-tumpak-sewu",
    name: "CMC Pantai 3 Warna - Tumpak Sewu",
    category: "beach_waterfall",
    duration: "2 Hari 1 Malam",
    description: "",
    coverImage: {
      src: tripImages.pantaiTigaWarna,
      alt: "Pantai 3 Warna coastline",
      sortOrder: 1,
    },
    gallery: [
      {
        src: tripImages.tumpakSewu,
        alt: "Tumpak Sewu waterfall",
        sortOrder: 1,
      },
      {
        src: tripImages.pantaiGatra,
        alt: "Pantai Gatra coastline",
        sortOrder: 2,
      },
      {
        src: tripImages.pantaiTanjungPenyu,
        alt: "Pantai Tanjung Penyu",
        sortOrder: 3,
      },
    ],
    prices: [
      { id: "cmc-malang", label: "Malang", amount: 930000, sortOrder: 1 },
      { id: "cmc-sidoarjo", label: "Sidoarjo", amount: 1090000, sortOrder: 2 },
      { id: "cmc-surabaya", label: "Surabaya", amount: 1090000, sortOrder: 3 },
    ],
    schedules: [
      schedule("cmc-2026-10-10", "2026-10-10", "2026-10-11"),
      schedule("cmc-2026-10-24", "2026-10-24", "2026-10-25"),
      schedule("cmc-2026-11-14", "2026-11-14", "2026-11-15"),
      schedule("cmc-2026-11-28", "2026-11-28", "2026-11-29"),
    ],
    includes: [
      "Transportasi PP",
      "Tiket",
      "Makan (Minimal kuota 5 pack)",
      "Tour Guide",
      "P3K",
      "Penginapan",
      "Snorkeling & Canoeing",
    ],
    excludes: [],
    notes: [],
    itinerary: cmcItinerary,
    highlights: [
      {
        id: "cmc-october",
        enabled: true,
        label: "Promo Oktober CMC",
        scheduleId: "cmc-2026-10-10",
        priceId: "cmc-malang",
        discountAmount: 849000,
        discountType: "fixed",
        discountValue: 81000,
      },
      {
        id: "cmc-november",
        enabled: true,
        label: "Promo November CMC",
        scheduleId: "cmc-2026-11-14",
        priceId: "cmc-malang",
        discountAmount: 849000,
        discountType: "fixed",
        discountValue: 81000,
      },
    ],
    updatedAt: "2026-09-06",
  }),
];
