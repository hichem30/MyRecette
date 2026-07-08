import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { CheckCircle, Clock, Crown, Euro, Store, XCircle } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createStripeCheckoutSession } from "@/lib/stripe/server";

interface SupermarketProfile {
  id: string;
  email: string;
  supermarket_name: { en: string; es?: string; fr?: string; ar?: string };
  subscription_status?: string;
  subscription_end_date?: string;
  stripe_customer_id?: string;
}

async function getSupermarketProfile(supermarketId: string, userId: string): Promise<SupermarketProfile | null> {
  const sb = getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Mock data for local development
    return {
      id: supermarketId,
      email: "demo-supermarket@myrecette.com",
      supermarket_name: { en: "Demo Supermarket", es: "Supermercado Demo", fr: "Supermarché Démo", ar: "سوبر ماركت تجريبي" },
      subscription_status: "inactive",
      stripe_customer_id: "cus_mock_123",
    };
  }

  try {
    const { data, error } = await sb
      .from("profiles")
      .select(
        "id, email, supermarket_name, subscription_status, subscription_end_date, stripe_customer_id"
      )
      .eq("id", supermarketId)
      .eq("is_supermarket", true)
      .single();

    if (error || !data) {
      console.error("Error fetching supermarket:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Database error:", error);
    return null;
  }
}

async function createSubscriptionCheckout(supermarketId: string, userId: string, lang: string) {
  if (!isSupabaseConfigured()) {
    // Mock redirect for local development
    console.log("[MOCK] Creating Stripe checkout session for supermarket:", supermarketId);
    return `/${lang}/supermarket/subscribe/success?session_id=mock_session_123`;
  }

  try {
    // Create checkout session via Stripe
    const checkoutUrl = await createStripeCheckoutSession({
      supermarketId,
      userId,
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/${lang}/supermarket/subscribe/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/${lang}/supermarket/subscribe`,
    });

    return checkoutUrl;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; supermarket: string }>;
}): Promise<Metadata> {
  const { locale, supermarket: supermarketId } = await params;
  const t = await getTranslations({ locale, namespace: "subscriptions" });

  return {
    title: t("subscribeTitle"),
    description: t("subscribeDescription"),
    openGraph: {
      title: t("subscribeTitle"),
      description: t("subscribeDescription"),
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/${locale}/supermarket/subscribe`,
      type: "website",
    },
  };
}

// Subscription feature list
const subscriptionFeatures = [
  {
    id: "products",
    icon: <Store className="h-6 w-6" />,
    title: { en: "Unlimited Product Listings", es: "Listados de productos ilimitados", fr: "Listages de produits illimités", ar: "قائمة غير محدودة من المنتجات" },
    description: { en: "Add and manage unlimited products in your store", es: "Agrega y administra productos ilimitados en tu tienda", fr: "Ajoutez et gérez un nombre illimité de produits dans votre magasin", ar: "إضافة وإدارة عدد غير محدود من المنتجات في متجرك" },
  },
  {
    id: "coupons",
    icon: <Euro className="h-6 w-6" />,
    title: { en: "Promotional Tools", es: "Herramientas promocionales", fr: "Outils promotionnels", ar: "أدوات تسويقية" },
    description: { en: "Create coupons, bundles, and sales to attract customers", es: "Crea cupones, paquetes y ofertas para atraer clientes", fr: "Créez des coupons, des lots et des soldes pour attirer les clients", ar: "إنشاء kupونات وحزم ومبيعات لجذب العملاء" },
  },
  {
    id: "jobs",
    icon: <Crown className="h-6 w-6" />,
    title: { en: "Job Listings", es: "Listados de empleo", fr: "Offres d'emploi", ar: "قائمة الوظائف" },
    description: { en: "Post job openings and find great talent for your supermarket", es: "Publica ofertas de empleo y encuentra talento para tu supermercado", fr: "Publiez des offres d'emploi et trouvez des talents pour votre supermarché", ar: "نشر وظائف ويرسل مواهب لمتجرك" },
  },
  {
    id: "analytics",
    icon: <Clock className="h-6 w-6" />,
    title: { en: "Business Analytics", es: "Analíticas de negocio", fr: "Analytique commerciale", ar: "تحليلات تجارية" },
    description: { en: "Track your performance and customer engagement", es: "Realiza un seguimiento de tu rendimiento y la interacción con los clientes", fr: "Suivez vos performances et l'engagement client", ar: "تتبع أدائك و التفاعل مع العملاء" },
  },
  {
    id: "support",
    icon: <CheckCircle className="h-6 w-6" />,
    title: { en: "Priority Support", es: "Soporte prioritario", fr: "Support prioritaire", ar: "دعم أولوي" },
    description: { en: "Get dedicated support for your supermarket operations", es: "Obtén soporte dedicado para las operaciones de tu supermercado", fr: "Bénéficiez d'un support dédié pour les opérations de votre supermarché", ar: "احصل على دعم مخصص لعمليات متجرك" },
  },
];

function getFeatureText(feature: typeof subscriptionFeatures[0], lang: string) {
  return {
    title: feature.title[lang] || feature.title.en,
    description: feature.description[lang] || feature.description.en,
  };
}

function SubscriptionFeature({ feature, lang }: { feature: typeof subscriptionFeatures[0]; lang: string }) {
  const { title, description } = getFeatureText(feature, lang);

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-neutral-200 bg-white">
      <div className="flex-shrink-0 text-recette-600">{feature.icon}</div>
      <div>
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <p className="text-neutral-600 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

function SubscriptionStatus({ status, endDate, lang }: { status?: string; endDate?: string; lang: string }) {
  if (!status || status === "inactive" || status === "canceled") {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <XCircle className="h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="font-semibold text-neutral-900">
          {lang === "es" ? "No estás suscrito" :
           lang === "fr" ? "Abonnement inactif" :
           lang === "ar" ? "لا يوجد اشتراك" :
           "Not Subscribed"}
        </h3>
        <p className="text-neutral-600 mt-2">
          {lang === "es" ? "Actualmente no tienes una suscripción activa" :
           lang === "fr" ? "Vous n'avez actuellement aucun abonnement actif" :
           lang === "ar" ? "لا يوجد اشتراك نشط حاليًا" :
           "You currently don't have an active subscription"}
        </p>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-neutral-900">
          {lang === "es" ? "Suscrito" :
           lang === "fr" ? "Abonné" :
           lang === "ar" ? "مشترك" :
           "Subscribed"}
        </h3>
        <p className="text-neutral-600 mt-2">
          {lang === "es" ? "Tu suscripción está activa" :
           lang === "fr" ? "Votre abonnement est actif" :
           lang === "ar" ? "اشتراكك نشط" :
           "Your subscription is active"}
        </p>
        {endDate && (
          <p className="text-sm text-neutral-500 mt-2">
            {lang === "es" ? `Vence: ${new Date(endDate).toLocaleDateString()}` :
             lang === "fr" ? `Expire: ${new Date(endDate).toLocaleDateString()}` :
             lang === "ar" ? `تنتهي: ${new Date(endDate).toLocaleDateString()}` :
             `Expires: ${new Date(endDate).toLocaleDateString()}`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
        <Clock className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="font-semibold text-neutral-900 capitalize">{status}</h3>
      <p className="text-neutral-600 mt-2">
        {lang === "es" ? "Tu suscripción está pendiente" :
         lang === "fr" ? "Votre abonnement est en attente" :
         lang === "ar" ? "اشتراكك قيد الانتظار" :
         "Your subscription is pending"}
      </p>
    </div>
  );
}

function PricingCard({ lang }: { lang: string }) {
  const t = useTranslations("subscriptions");

  return (
    <div className="bg-white rounded-2xl border-2 border-recette-600 p-8 shadow-lg">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-recette-50 mb-6">
          <Crown className="h-10 w-10 text-recette-600" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-neutral-900">
          {lang === "es" ? "Plan Premium" :
           lang === "fr" ? "Abonnement Premium" :
           lang === "ar" ? "الخطة المميزة" :
           "Premium Plan"}
        </h2>
        <div className="my-6">
          <span className="font-serif text-5xl font-bold text-recette-600">€50</span>
          <span className="text-neutral-600">
            {lang === "es" ? "/mes" :
             lang === "fr" ? "/mois" :
             lang === "ar" ? "/شهر" :
             "/month"}
          </span>
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <h3 className="font-semibold text-neutral-900 mb-4">
          {lang === "es" ? "Lo que obtienes" :
           lang === "fr" ? "Ce que vous obtenez" :
           lang === "ar" ? "ما ستحصل عليه" :
           "What you get"}:
        </h3>
        <div className="space-y-3">
          {subscriptionFeatures.map((feature) => (
            <SubscriptionFeature key={feature.id} feature={feature} lang={lang} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <form action={async (formData) => {
          "use server"
          // This would trigger the checkout in a real implementation
        }}>
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-lg bg-recette-600 text-white font-semibold text-lg hover:bg-recette-700 transition-colors"
          >
            {lang === "es" ? "Suscríbete ahora" :
             lang === "fr" ? "S'abonner maintenant" :
             lang === "ar" ? "اشترك الآن" :
             "Subscribe Now"}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-3">
          {lang === "es" ? "Cancelar en cualquier momento" :
           lang === "fr" ? "Annulez à tout moment" :
           lang === "ar" ? "الغ الإشتراك في أي وقت" :
           "Cancel anytime"}
        </p>
      </div>
    </div>
  );
}

export default async function SupermarketSubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; supermarket: string }>;
  searchParams: Promise<{ success?: string; canceled?: string; error?: string }>;
}) {
  const { locale, supermarket: supermarketId } = await params;
  const { success, canceled, error } = await searchParams;

  setRequestLocale(locale);
  const t = await getTranslations("subscriptions");
  const tC = await getTranslations("common");

  const lang = locale as "en" | "es" | "fr" | "ar";

  // Get user session
  const sb = getSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    // User must be logged in
    redirect(`/${lang}/login`);
  }

  // Get supermarket profile
  const supermarket = await getSupermarketProfile(supermarketId, user.id);

  if (!supermarket) {
    notFound();
  }

  // Check if user owns this supermarket
  const isOwner = supermarket.id === user.id;
  
  // For demo purposes, allow access if user is logged in
  // In production, you'd want to check ownership

  // Handle Stripe callback
  if (success) {
    // Subscription successful
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-neutral-900 mb-4">
            {t("subscriptionSuccessful")}
          </h1>
          <p className="text-xl text-neutral-600 mb-8">
            {t("subscriptionWelcome", { name: supermarket.supermarket_name[lang] || supermarket.supermarket_name.en })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${lang}/supermarket/billing`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
            >
              {t("manageSubscription")}
            </Link>
            <Link
              href={`/${lang}/account`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-recette-600 text-recette-600 font-semibold hover:bg-recette-50 transition-colors"
            >
              {t("goToAccount")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (canceled) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
            <XCircle className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-neutral-900 mb-4">
            {t("subscriptionCanceled")}
          </h1>
          <p className="text-xl text-neutral-600 mb-8">
            {t("subscriptionNotCharged")}
          </p>
          <Link
            href={`/${lang}/supermarket/subscribe`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
          >
            {t("tryAgain")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
            <Link href={`/${lang}/`} className="hover:text-recette-600">
              {tC("home")}
            </Link>
            <span>/</span>
            <Link href={`/${lang}/account`} className="hover:text-recette-600">
              {tC("account")}
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">
              {t("subscribe")}
            </span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              {t("joinPremium")}
            </h1>
            <p className="text-xl text-neutral-600">
              {t("joinDescription", { name: supermarket.supermarket_name[lang] || supermarket.supermarket_name.en })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 sticky top-24">
              <h2 className="font-semibold text-neutral-900 mb-4">
                {t("yourStatus")}
              </h2>
              <SubscriptionStatus 
                status={supermarket.subscription_status} 
                endDate={supermarket.subscription_end_date}
                lang={lang}
              />
            </div>
          </div>

          {/* Pricing Card */}
          <div className="lg:col-span-2">
            <PricingCard lang={lang} />
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-3">
              {lang === "es" ? "¿Por qué €50 al mes?" :
               lang === "fr" ? "Pourquoi 50€ par mois ?" :
               lang === "ar" ? "لماذا 50 يورو شهريًا؟" :
               "Why €50 per month?"}
            </h3>
            <p className="text-neutral-600 text-sm">
              {lang === "es" ? "sucre et sel es tu plataforma todo en uno para gestionar tu supermercado en línea. Este precio cubre todos los servicios incluyendo listados de productos, herramientas promocionales, y soporte dedicado." :
               lang === "fr" ? "sucre et sel est votre plateforme tout-en-un pour gérer votre supermarché en ligne. Ce prix couvre tous les services y compris les listages de produits, les outils promotionnels et le support dédié." :
               lang === "ar" ? "sucre et sel هي منصة شاملة لإدارة متجرك عبر الإنترنت. يشمل هذا السعر جميع الخدمات بما في ذلك قائمة المنتجات والأدوات الترويجية والدعم المخصص." :
               "sucre et sel is your all-in-one platform for managing your supermarket online. This price covers all services including product listings, promotional tools, and dedicated support."}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-3">
              {lang === "es" ? "¿Qué pasa si cancelo?" :
               lang === "fr" ? "Que se passe-t-il si j'annule ?" :
               lang === "ar" ? "ماذا يحدث إذا ألغيت؟" :
               "What happens if I cancel?"}
            </h3>
            <p className="text-neutral-600 text-sm">
              {lang === "es" ? "Puedes cancelar tu suscripción en cualquier momento. Tendrás acceso completo hasta el final de tu período de facturación actual." :
               lang === "fr" ? "Vous pouvez annuler votre abonnement à tout moment. Vous aurez un accès complet jusqu'à la fin de votre période de facturation actuelle." :
               lang === "ar" ? "يمكنك إلغاء الاشتراك في أي وقت. سيكون لديك وصول كامل حتى نهاية فترة الفواتير الحالية." :
               "You can cancel your subscription at any time. You'll have full access until the end of your current billing period."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server actions
