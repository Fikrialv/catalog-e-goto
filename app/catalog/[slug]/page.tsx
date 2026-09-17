import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getDestinationBySlug } from "@/services/catalog";
import { TripDetail } from "@/components/catalog/trip-detail";
import { SiteHeader } from "@/components/site/site-header";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  return destination
    ? {
        title: `${destination.name} | E-GOTO`,
        description:
          destination.description ||
          `Informasi trip ${destination.name} dari E-GOTO.`,
        openGraph: {
          title: `${destination.name} | E-GOTO`,
          description:
            destination.description ||
            `Informasi trip ${destination.name} dari E-GOTO.`,
          images: [destination.coverImage.src],
        },
      }
    : { title: "Trip tidak ditemukan | E-GOTO" };
}

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  return (
    <main>
      <SiteHeader />
      <div className="absolute left-5 top-24 z-30 sm:left-8 lg:left-12">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold text-ink backdrop-blur-md transition-colors hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke katalog
        </Link>
      </div>
      <TripDetail
        destination={destination}
        highlightId={
          typeof query.highlight === "string" ? query.highlight : undefined
        }
      />
    </main>
  );
}
