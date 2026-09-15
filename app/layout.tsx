import type { Metadata } from "next";
import "./globals.css";
import { getPublicSiteUrl } from "@/lib/config";
import { CustomerPreferencesProvider } from "@/components/site/customer-preferences";

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: "E-GOTO — Temukan Perjalananmu",
  description:
    "Katalog digital perjalanan E-GOTO: destinasi, jadwal, harga, dan informasi trip.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <CustomerPreferencesProvider>{children}</CustomerPreferencesProvider>
      </body>
    </html>
  );
}
