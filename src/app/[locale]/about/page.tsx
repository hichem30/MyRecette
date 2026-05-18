import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Award, DollarSign, Hammer, Heart, MapPin, Users } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

// Static content only — pre-render at build time and serve from ASSETS
// binding so the page never invokes the worker.
export const dynamic = "force-static";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const lang = locale as "en" | "es";

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-neutral-900 text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1280&q=70"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/70 to-transparent" />
        </div>
        <div className="container-page py-20">
          <p className="text-xs font-bold tracking-widest text-amber-300">
            {lang === "en" ? "FAMILY OWNED · SAND SPRINGS, OK" : "FAMILIA · SAND SPRINGS, OK"}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-6xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{t("subtitle")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { v: "25+", l: t("yearsStat") },
              { v: "5,000", l: t("productsStat") },
              { v: "Mon–Sat", l: t("hoursStat") },
              { v: "Sand Springs", l: t("locationStat") },
            ].map((s) => (
              <div key={s.v} className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="font-serif text-2xl font-bold text-amber-300">{s.v}</p>
                <p className="text-xs text-white/70">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-widest text-barn-600">{t("story")}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{t("storyTitle")}</h2>
            <p className="mt-4 text-neutral-600 leading-relaxed">{t("storyBody")}</p>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-neutral-100 shadow-card">
            <Image
              src="/about/storefront.jpg"
              alt="Red Barn Western Market storefront, Sand Springs OK"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <span className="absolute left-4 top-4 rounded-md bg-amber-500 px-2 py-1 text-[10px] font-bold text-white">
              Sand Springs, OK
            </span>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-neutral-50 py-16">
        <div className="container-page">
          <div className="text-center">
            <p className="text-xs font-bold tracking-widest text-barn-600">{t("coreValuesLabel")}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{t("coreValues")}</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Award, title: t("value1"), body: t("value1Body") },
              { Icon: DollarSign, title: t("value2"), body: t("value2Body") },
              { Icon: Hammer, title: t("value3"), body: t("value3Body") },
              { Icon: MapPin, title: t("value4"), body: t("value4Body") },
              { Icon: Heart, title: t("value5"), body: t("value5Body") },
              { Icon: Users, title: t("value6"), body: t("value6Body") },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="rounded-xl bg-white p-6 shadow-card">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-barn-50 text-barn-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="container-page py-16">
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-barn-600">{t("milestonesLabel")}</p>
          <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{t("milestones")}</h2>
        </div>
        <ol className="mx-auto mt-10 max-w-3xl space-y-6">
          {[
            { year: "1999", body: t("milestone1999") },
            { year: "2005", body: t("milestone2005") },
            { year: "2012", body: t("milestone2012") },
            { year: "2018", body: t("milestone2018") },
            { year: "2023", body: t("milestone2023") },
            { year: lang === "en" ? "Today" : "Hoy", body: t("milestoneToday") },
          ].map((m) => (
            <li key={m.year} className="flex flex-col gap-2 sm:flex-row sm:gap-5">
              <span className="inline-flex h-7 w-fit flex-none items-center rounded-full bg-barn-600 px-3 text-[11px] font-bold uppercase tracking-wide text-white sm:w-24 sm:justify-center">
                {m.year}
              </span>
              <p className="flex-1 text-sm leading-relaxed text-neutral-700 sm:border-l sm:border-neutral-200 sm:pl-5">
                {m.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Team */}
      <section className="bg-neutral-50 py-16">
        <div className="container-page">
          <div className="text-center">
            <p className="text-xs font-bold tracking-widest text-barn-600">{t("teamLabel")}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{t("team")}</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: t("team1Name"), role: t("team1Role"), body: t("team1Body"), img: "/about/team-1.jpg" },
              { name: t("team2Name"), role: t("team2Role"), body: t("team2Body"), img: "/about/team-2.jpg" },
              { name: t("team3Name"), role: t("team3Role"), body: t("team3Body"), img: "/about/team-3.jpg" },
              { name: t("team4Name"), role: t("team4Role"), body: t("team4Body"), img: "/about/team-4.jpg" },
            ].map((m) => (
              <div key={m.name} className="rounded-xl bg-white p-5 text-center shadow-card">
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-neutral-200">
                  <Image
                    src={m.img}
                    alt={m.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-3 text-sm font-bold">{m.name}</h3>
                <p className="text-xs text-barn-600">{m.role}</p>
                <p className="mt-2 text-xs text-neutral-600">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden bg-neutral-900 py-16 text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1280&q=70"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-neutral-900/70" />
        </div>
        <div className="container-page text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">{t("readyTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">{t("readyBody")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="rounded-full bg-barn-600 px-6 py-3 text-sm font-bold hover:bg-barn-700">
              {t("readyCtaShop")}
            </Link>
            <Link href="/contact" className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold hover:bg-white/20">
              {t("readyCtaContact")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
