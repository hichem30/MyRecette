import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { PWARegister } from "@/components/PWARegister";
import { CartProvider } from "@/lib/cart/CartProvider";
import { isRtl } from "@/lib/i18n/config";

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
      <body className="font-sans bg-white text-neutral-900 antialiased" dir={isRtl ? 'rtl' : 'ltr'}>
        <CartProvider>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
          <CartDrawer />
          <PWARegister />
        </CartProvider>
      </body>
    </html>
  );
}
