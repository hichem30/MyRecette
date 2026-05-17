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
    // ?v=2 busts the browser cache for users who saw the old generic favicon.
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icons/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/icons/apple-touch-icon.png?v=2",
  },
  openGraph: {
    type: "website",
    title: "Red Barn Western Market — Sand Springs, OK",
    description: "Lumber, feed, hardware, and ranch supplies since 1987.",
    locale: "en_US",
    images: [
      {
        url: "/icons/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Red Barn Western Market — Sand Springs, OK",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Red Barn Western Market — Sand Springs, OK",
    description: "Lumber, feed, hardware, and ranch supplies since 1987.",
    images: ["/icons/og-image.png?v=2"],
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
