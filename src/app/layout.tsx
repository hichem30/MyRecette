import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Red Barn Western Market — Sand Springs, OK",
    template: "%s · Red Barn Western Market",
  },
  description:
    "Your trusted local market in Sand Springs, OK. Lumber, feed, hardware, building materials, and ranch supplies for working families across Tulsa County.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://redbarnwesternmarket.com"),
  applicationName: "Red Barn Western Market",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    title: "Red Barn Western Market — Sand Springs, OK",
    description: "Lumber, feed, hardware, and ranch supplies since 1987.",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: "#8B2A18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
