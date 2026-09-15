"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { BrandLogo } from "@/components/site/brand-logo";
import { CustomerPreferenceToggle } from "@/components/site/customer-preferences";

const socialLinks = [
  {
    label: "Instagram",
    src: "/brand/instagram.png",
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  },
  {
    label: "TikTok",
    src: "/brand/tiktok.png",
    href: process.env.NEXT_PUBLIC_TIKTOK_URL,
  },
] as const;

function SocialIcon({ label, src, href }: (typeof socialLinks)[number]) {
  const content = (
    <span className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5">
      <Image
        src={src}
        alt=""
        width={30}
        height={30}
        className="h-[30px] w-[30px]"
      />
    </span>
  );

  if (!href) {
    return (
      <span
        title={`Link ${label} belum diatur`}
        className="cursor-not-allowed opacity-90"
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Buka ${label} E-GOTO`}
      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#d5e5e5]"
    >
      {content}
    </a>
  );
}

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 bg-[#d5e5e5] px-5 py-2.5 text-ink shadow-[0_8px_30px_rgba(6,78,79,0.08)] sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
        <Link
          href="/"
          className="group inline-flex min-h-11 items-center rounded-full px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="E-GOTO beranda"
        >
          <span className="block h-14 w-24 transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-16 sm:w-28">
            <BrandLogo />
          </span>
        </Link>
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label="Media sosial E-GOTO"
        >
          <CustomerPreferenceToggle />
          {socialLinks.map((social, index) => (
            <Fragment key={social.label}>
              {index > 0 ? (
                <span aria-hidden="true" className="mx-1 h-6 w-px bg-ink/20" />
              ) : null}
              <SocialIcon {...social} />
            </Fragment>
          ))}
        </div>
      </div>
    </header>
  );
}
