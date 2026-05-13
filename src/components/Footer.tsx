import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { getAllCategories } from "@/lib/data";

export async function Footer() {
  const tF = await getTranslations("footer");
  const tN = await getTranslations("nav");
  const locale = (await getLocale()) as "en" | "es";
  const cats = await getAllCategories();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <Logo variant="light" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">{tF("tagline")}</p>
          <div className="mt-5 flex gap-2">
            {[
              { href: "https://facebook.com/redbarnwesternmarket", label: "Facebook", Icon: Facebook },
              { href: "#", label: "Instagram", Icon: Instagram },
              { href: "#", label: "Twitter", Icon: Twitter },
              { href: "#", label: "YouTube", Icon: Youtube },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-barn-600 hover:text-white transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold tracking-widest text-white">{tF("quickLinks")}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">{tN("home")}</Link></li>
            <li><Link href="/products" className="hover:text-white">{tN("products")}</Link></li>
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
                  {c.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold tracking-widest text-white">{tF("contactUs")}</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 flex-none text-barn-400" />
              <a href="tel:+19182458112" className="hover:text-white">+1 (918) 245‑8112</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 flex-none text-barn-400" />
              <a href="mailto:redbarnwesternmarket@gmail.com" className="hover:text-white break-all">
                redbarnwesternmarket@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-none text-barn-400" />
              <span>308 S. 209th W. Ave., Sand Springs, OK</span>
            </li>
          </ul>

          <h3 className="mb-3 mt-6 text-xs font-bold tracking-widest text-white">{tF("stayInLoop")}</h3>
          <p className="mb-3 text-xs text-neutral-400">{tF("stayInLoopBody")}</p>
          <NewsletterForm placeholder={tF("emailPlaceholder")} subscribe={tF("subscribe")} thanks={tF("thanks")} />
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-neutral-500 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Red Barn Western Market · Sand Springs, OK · {tF("rights")}</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">{tF("privacy")}</Link>
            <Link href="/terms" className="hover:text-white">{tF("terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
