import Image from "next/image";
import { ArrowRight, Award, Clock, Headphones, MapPin, Phone, Search, Star, Truck } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { getAllCategories, getAllProducts } from "@/lib/data";
import { t } from "@/lib/fr";

export const revalidate = 60;

export default async function HomePage() {
  const [cats, products] = await Promise.all([getAllCategories(), getAllProducts()]);
  const newArrivals = products.filter((p) => p.new_arrival).slice(0, 4);
  const deals = products.filter((p) => p.discount).slice(0, 4);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  const productsByCat = (slug: string) =>
    products.filter((p) => p.category_slug === slug).length;

  return (
    <>
      {/* HERO */}
      <section className="relative isolate -mt-16 bg-neutral-900">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1280&q=70"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/30 to-neutral-900/80" />
        </div>

        <div className="container-page pt-32 pb-20 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            {t("home.heroBadge")}
          </span>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">{t("home.heroSubtitle")}</p>

          <form action="/products" method="GET" className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-xl">
            <Search className="ml-3 h-4 w-4 flex-none text-neutral-400" />
            <input
              name="q"
              placeholder={t("common.search") + "..."}
              className="flex-1 bg-transparent px-1 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="rounded-full bg-barn-600 px-5 py-2 text-sm font-medium text-white hover:bg-barn-700"
            >
              {t("common.search")}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-barn-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-barn-700"
            >
              {t("home.heroCtaRecipes")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              {t("home.heroCtaSupermarkets")}
            </Link>
          </div>
        </div>

        {/* Stats banner */}
        <div className="container-page -mb-12 pb-0">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-2xl sm:grid-cols-4 sm:p-6">
            {[
              { v: "25+", l: "Années d'expérience" },
              { v: "5,000+", l: "Produits disponibles" },
              { v: "Lun–Sam", l: "9h–18h · Fermé le dimanche" },
              { v: "Paris", l: "France" },
            ].map((s) => (
              <div key={s.v} className="text-center">
                <p className="font-serif text-2xl font-bold text-barn-700 sm:text-3xl">{s.v}</p>
                <p className="text-xs text-neutral-500 sm:text-sm">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="container-page pt-24 pb-12">
        <SectionHeader title={t("home.newArrivals")} subtitle={t("home.newArrivalsSubtitle")} viewAllHref="/products?filter=new" viewAllLabel={t("home.viewAll")} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* HOT DEALS */}
      <section className="bg-gradient-to-b from-amber-50/60 to-white py-12">
        <div className="container-page">
          <SectionHeader title={t("home.hotDeals")} subtitle={t("home.hotDealsSubtitle")} viewAllHref="/deals" viewAllLabel={t("home.viewAll")} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container-page py-12">
        <SectionHeader title={t("home.shopByCategory")} subtitle={t("home.shopByCategorySubtitle")} viewAllHref="/categories" viewAllLabel={t("home.viewAll")} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cats.slice(0, 8).map((c) => (
            <CategoryCard key={c.id} category={c} productCount={productsByCat(c.slug)} />
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-neutral-50 py-12">
        <div className="container-page">
          <SectionHeader title={t("home.featured")} subtitle={t("home.featuredSubtitle")} viewAllHref="/products" viewAllLabel={t("home.viewAll")} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* VISIT US */}
      <section className="container-page py-16">
        <div className="grid items-stretch gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-barn-600">{t("home.visitUs")}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-neutral-900 sm:text-4xl">{t("home.visitUs")}</h2>
            <p className="mt-3 max-w-md text-neutral-600">{t("home.visitUsSubtitle")}</p>

            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-none text-barn-600" />
                <div>
                  <p className="font-semibold">{t("home.address")}</p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Paris+France"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-barn-600 hover:underline"
                  >
                    {t("home.directions")} →
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 flex-none text-barn-600" />
                <p className="font-semibold">{t("home.hours")}</p>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 flex-none text-barn-600" />
                <a href="tel:+33123456789" className="font-semibold hover:text-barn-700">{t("home.phone")}</a>
              </li>
            </ul>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { Icon: Award, label: "Qualité Fiable" },
                { Icon: Truck, label: "Livraison Rapide" },
                { Icon: Headphones, label: "Support Local" },
                { Icon: Star, label: "Meilleur Noté" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 rounded-lg border border-neutral-200 bg-white p-3 text-center text-xs font-medium text-neutral-700">
                  <Icon className="h-5 w-5 text-barn-600" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-80 overflow-hidden rounded-2xl bg-neutral-100 shadow-card lg:h-auto">
            <iframe
              title="My Recette map"
              src="https://www.google.com/maps?q=Paris+France&output=embed"
              loading="lazy"
              className="h-full w-full"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-neutral-50 py-14">
        <div className="container-page">
          <SectionHeader title={t("home.testimonials")} subtitle={t("home.testimonialsSubtitle")} />
          <div className="grid gap-5 sm:grid-cols-3">
            {(
              [
                {
                  author: "Pierre D.",
                  text: "My Recette a transformé ma façon de cuisiner. Je trouve toujours des recettes inspirantes et les ingrédients dont j'ai besoin.",
                },
                {
                  author: "Marie L.",
                  text: "Service client excellent et les meilleurs prix. Je recommande vivement cette plateforme. Pas seulement des recettes, mais aussi des conseils.",
                },
                {
                  author: "Jean M.",
                  text: "J'adore cette plateforme. Je viens pour une recette et je repars avec des idées pour toute la semaine. On ne sait jamais quel trésor on va trouver.",
                },
              ] as const
            ).map((review) => (
              <figure key={review.author} className="rounded-xl bg-white p-6 shadow-card">
                <div className="mb-2 flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="text-sm text-neutral-700">
                  &ldquo;{review.text}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-xs font-semibold text-neutral-600">
                  {review.author} · Paris, France
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  subtitle: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900 sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      </div>
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-barn-600 hover:text-barn-700"
        >
          {viewAllLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
