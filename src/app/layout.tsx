import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "My Recette — Recipes & Groceries",
    template: "%s · My Recette",
  },
  description:
    "Discover recipes based on ingredients you have. Shop ingredients from local supermarkets. Connect with your community.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://myrecette.com"),
  applicationName: "My Recette",
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
    title: "My Recette — Recipes & Groceries",
    description: "Discover recipes based on ingredients you have. Shop ingredients from local supermarkets.",
    locale: "en_US",
    images: [
      {
        url: "/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "My Recette — Recipes & Groceries",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Recette — Recipes & Groceries",
    description: "Discover recipes and shop ingredients from local supermarkets.",
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
