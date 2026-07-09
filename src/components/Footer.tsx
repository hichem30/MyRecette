import { Facebook, Mail, MapPin, Phone } from "lucide-react";
import { getTranslations, getLocale } from "@/lib/fr";
import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { getAllCategories } from "@/lib/data";

export async function Footer() {
  const { t: tF } = getTranslations("footer");
  const { t: tN } = getTranslations("nav");
  const locale = getLocale();
  const cats = await getAllCategories();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <Logo variant="light" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">{tF("tagline")}</p>
          <div className="mt-5 flex gap-2">
            <a
              href="https://facebook.com/myrecetteapp"
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-recette-600 hover:text-white transition"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold tracking-widest text-white">{tF("quickLinks")}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">{tN("home")}</Link></li>
            <li><Link href="/recipes" className="hover:text-white">{tN("recipes")}</Link></li>
            <li><Link href="/products" className="hover:text-white">{tN("products")}</Link></li>
            <li><Link href="/supermarkets" className="hover:text-white">{tN("supermarkets")}</Link></li>
            <li><Link href="/videos" className="hover:text-white">{tN("videos")}</Link></li>
            <li><Link href="/deals" className="hover:text-white">{tN("deals")}</Link></li>
            <li><Link href="/about" className="hover:text-white">{tN("about")}</Link></li>
            <li><Link href="/contact" className="hover:text-white">{tN("contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold tracking-widest text-white">{tF("categoriesHeading")}</h3>
          <ul className="space-y-2 text-sm">
            {cats.slice(0, 7).map((c) => (
              <li key={c.id}>
                <Link href={`/categories/${c.slug}`} className="hover:text-white">
                  {c.name.fr}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold tracking-widest text-white">{tF("contactUs")}</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 flex-none text-recette-400" />
              <a href="tel:+19182458112" className="hover:text-white">+1 (918) 245‑8112</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 flex-none text-recette-400" />
              <a href="mailto:hello@myrecette.com" className="hover:text-white break-all">
                hello@myrecette.com
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-none text-recette-400" />
              <span>Global Community Platform</span>
            </li>
          </ul>

          <h3 className="mb-3 mt-6 text-xs font-bold tracking-widest text-white">{tF("stayInLoop")}</h3>
          <p className="mb-3 text-xs text-neutral-400">{tF("stayInLoopBody")}</p>
          <NewsletterForm placeholder={tF("emailPlaceholder")} subscribe={tF("subscribe")} thanks={tF("thanks")} />
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-neutral-500 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} sucre et sel · {tF("rights")}</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">{tF("privacy")}</Link>
            <Link href="/terms" className="hover:text-white">{tF("terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
