import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { PWARegister } from "@/components/PWARegister";
import { CartProvider } from "@/lib/cart/CartProvider";
import { ToastProvider } from "@/components/Toast";
import { AppProvider } from "@/components/AppProvider";
import { isRtl } from "@/lib/i18n/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = "fr";

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#F57A30" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#F57A30" />
      </head>
      <body className="font-sans bg-white text-neutral-900 antialiased" dir={isRtl ? 'rtl' : 'ltr'}>
        <CartProvider>
          <ToastProvider>
            <Header />
            <main className="min-h-[calc(100vh-4rem)]">
              <AppProvider>{children}</AppProvider>
            </main>
            <Footer />
            <CartDrawer />
            <PWARegister />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
