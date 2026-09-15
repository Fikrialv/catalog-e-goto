import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-baru.svg"
      alt="E-GOTO"
      width={220}
      height={220}
      priority
      className={cn("h-full w-full object-contain", className)}
    />
  );
}
