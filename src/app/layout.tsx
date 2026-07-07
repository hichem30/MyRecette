import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "sucre et sel — Recettes & Courses",
    template: "%s · sucre et sel",
  },
  description:
    "Découvrez des recettes basées sur les ingrédients que vous avez. Achetez des ingrédients auprès des supermarchés locaux. Connectez-vous avec votre communauté.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sucre-et-sel.com"),
  applicationName: "sucre et sel",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    title: "sucre et sel — Recettes & Courses",
    description: "Découvrez des recettes basées sur les ingrédients que vous avez. Achetez des ingrédients auprès des supermarchés locaux.",
    locale: "fr_FR",
    images: [
      {
        url: "/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "sucre et sel — Recettes & Courses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "sucre et sel — Recettes & Courses",
    description: "Découvrez des recettes et achetez des ingrédients auprès des supermarchés locaux.",
    images: ["/icons/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F57A30",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
