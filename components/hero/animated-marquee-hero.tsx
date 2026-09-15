import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DestinationImage } from "@/types/catalog";

type AnimatedMarqueeHeroProps = {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText: string;
  images: DestinationImage[];
  className?: string;
};

export function AnimatedMarqueeHero({
  tagline,
  title,
  description,
  ctaText,
  images,
  className,
}: AnimatedMarqueeHeroProps) {
  const duplicatedImages = [...images, ...images];

  return (
    <section
      aria-labelledby="hero-title"
      className={cn(
        "relative isolate flex min-h-[620px] w-full items-center overflow-hidden bg-paper px-5 pb-36 pt-24 text-center text-ink sm:min-h-[680px] sm:px-8 sm:pb-40 lg:min-h-[720px] lg:pb-44",
        className,
      )}
    >
      <div className="hero-brand-background absolute inset-0 -z-20" />
      <div className="hero-brand-overlay absolute inset-0 -z-10" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/70 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink backdrop-blur-md sm:text-xs">
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
          {tagline}
        </p>

        <h1
          id="hero-title"
          className="max-w-4xl text-balance font-serif text-[clamp(3.25rem,9vw,8.25rem)] leading-[0.88] tracking-[-0.065em] text-ink"
        >
          {typeof title === "string"
            ? title.split(" ").map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  className="mr-[0.18em] inline-block"
                >
                  {word}
                </span>
              ))
            : title}
        </h1>

        <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-ink-muted sm:text-lg">
          {description}
        </p>

        <div className="mt-8">
          <Link
            href="/catalog"
            className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-primary-dark px-6 py-3 text-sm font-bold text-white shadow-[0_12px_35px_rgb(6_78_79_/_0.18)] transition-[transform,background-color,box-shadow,color] duration-200 hover:-translate-y-1 hover:bg-primary hover:text-ink hover:shadow-[0_16px_40px_rgb(99_177_176_/_0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            {ctaText}
            <ArrowDownRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-0 h-[220px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)] sm:h-[260px]"
        aria-hidden="true"
      >
        <div className="hero-marquee-track flex w-max gap-4 px-4 sm:gap-5">
          {duplicatedImages.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="hero-marquee-card relative h-44 w-32 shrink-0 overflow-hidden rounded-[1.35rem] border border-ink/15 bg-white/60 shadow-[0_24px_50px_rgba(6,78,79,0.16)] sm:h-52 sm:w-40 lg:h-60 lg:w-48"
              style={{ transform: `rotate(${index % 2 === 0 ? -2 : 2.5}deg)` }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 144px, (max-width: 1024px) 176px, 208px"
                loading={index < 2 ? "eager" : "lazy"}
                quality={70}
                className="hero-marquee-image object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-white/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
