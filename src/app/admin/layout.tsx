import "../globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AdminShell } from "@/components/admin/AdminShell";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Admin · My Recette",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans bg-neutral-50 text-neutral-900 antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
