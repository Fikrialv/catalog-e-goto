import type { DestinationImage } from "@/types/catalog";

export const tripImages = {
  bromo: "/images/bromo mountain.avif",
  ijen: "/images/kawah ijen.avif",
  wurung: "/images/kawah wurung.avif",
  lawu: "/images/lawu mountain.avif",
  merbabu: "/images/merbabu mountain.avif",
  pantaiTigaWarna: "/images/pantai 3 warna.avif",
  pantaiGatra: "/images/pantai gatra.avif",
  pantaiTanjungPenyu: "/images/pantai tanjung penyu.avif",
  pantaiTelukAsmara: "/images/pantai teluk asmara.avif",
  ranuKumbolo: "/images/ranu kumbolo.avif",
  tumpakSewu: "/images/tumpak sewu.avif",
} as const;

export const heroImages: DestinationImage[] = [
  {
    src: tripImages.merbabu,
    alt: "Mountain landscape of Merbabu",
    sortOrder: 1,
  },
  { src: tripImages.lawu, alt: "Gunung Lawu mountain landscape", sortOrder: 2 },
  {
    src: tripImages.pantaiTigaWarna,
    alt: "Pantai Tiga Warna coastline",
    sortOrder: 3,
  },
  {
    src: tripImages.tumpakSewu,
    alt: "Tumpak Sewu waterfall landscape",
    sortOrder: 4,
  },
  {
    src: tripImages.ranuKumbolo,
    alt: "Ranu Kumbolo mountain lake",
    sortOrder: 5,
  },
  { src: tripImages.ijen, alt: "Kawah Ijen volcanic landscape", sortOrder: 6 },
];
