import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "@/lib/fr";
import { t } from "@/lib/fr";
import { CheckCircle, Clock, Crown, Euro, Store, XCircle } from "lucide-react";
import Link from "next/link";
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
  const sb = await getSupabaseServerClient();

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

async function createSubscriptionCheckout(supermarketId: string, userId: string) {
  if (!isSupabaseConfigured()) {
    // Mock redirect for local development
    console.log("[MOCK] Creating Stripe checkout session for supermarket:", supermarketId);
    return `/fr/supermarket/${supermarketId}/subscribe/success?session_id=mock_session_123`;
  }

  try {
    // Create checkout session via Stripe
    // TODO: Implement Stripe integration with proper parameters
    const checkoutUrl = null; // await createStripeCheckoutSession();

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
  const { supermarket: supermarketId } = await params;

  return {
    title: "S'abonner à My Recette Premium",
    description: "Rejoignez le plan Premium pour débloquer toutes les fonctionnalités pour votre supermarché",
    openGraph: {
      title: "S'abonner à My Recette Premium",
      description: "Rejoignez le plan Premium pour débloquer toutes les fonctionnalités pour votre supermarché",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/fr/supermarket/${supermarketId}/subscribe`,
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

function getFeatureText(feature: typeof subscriptionFeatures[0]) {
  return {
    title: feature.title.fr || feature.title.en,
    description: feature.description.fr || feature.description.en,
  };
}

function SubscriptionFeature({ feature }: { feature: typeof subscriptionFeatures[0] }) {
  const { title, description } = getFeatureText(feature);

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

function SubscriptionStatus({ status, endDate }: { status?: string; endDate?: string }) {
  if (!status || status === "inactive" || status === "canceled") {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <XCircle className="h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="font-semibold text-neutral-900">
          Abonnement inactif
        </h3>
        <p className="text-neutral-600 mt-2">
          Vous n'avez actuellement aucun abonnement actif
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
          Abonné
        </h3>
        <p className="text-neutral-600 mt-2">
          Votre abonnement est actif
        </p>
        {endDate && (
          <p className="text-sm text-neutral-500 mt-2">
            Expire: {new Date(endDate).toLocaleDateString("fr-FR")}
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
        Votre abonnement est en attente
      </p>
    </div>
  );
}

function PricingCard() {

  return (
    <div className="bg-white rounded-2xl border-2 border-recette-600 p-8 shadow-lg">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-recette-50 mb-6">
          <Crown className="h-10 w-10 text-recette-600" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-neutral-900">
          Abonnement Premium
        </h2>
        <div className="my-6">
          <span className="font-serif text-5xl font-bold text-recette-600">€50</span>
          <span className="text-neutral-600">
            /mois
          </span>
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <h3 className="font-semibold text-neutral-900 mb-4">
          Ce que vous obtenez :
        </h3>
        <div className="space-y-3">
          {subscriptionFeatures.map((feature) => (
            <SubscriptionFeature key={feature.id} feature={feature} />
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
            S'abonner maintenant
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-3">
          Annulez à tout moment
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
  const { supermarket: supermarketId } = await params;
  const { success, canceled, error } = await searchParams;

  setRequestLocale("fr");

  // Get user session
  const sb = await getSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    // User must be logged in
    redirect("/fr/login");
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
            Abonnement réussi
          </h1>
          <p className="text-xl text-neutral-600 mb-8">
            Bienvenue sur My Recette, {supermarket.supermarket_name.fr || supermarket.supermarket_name.en} !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/fr/supermarket/${supermarketId}/billing`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
            >
              Gérer mon abonnement
            </Link>
            <Link
              href="/fr/account"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-recette-600 text-recette-600 font-semibold hover:bg-recette-50 transition-colors"
            >
              Aller à mon compte
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
            Abonnement annulé
          </h1>
          <p className="text-xl text-neutral-600 mb-8">
            Aucun frais ne vous a été facturé
          </p>
          <Link
            href={`/fr/supermarket/${supermarketId}/subscribe`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
          >
            Réessayer
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
            <Link href="/fr/" className="hover:text-recette-600">
              Accueil
            </Link>
            <span>/</span>
            <Link href="/fr/account" className="hover:text-recette-600">
              Compte
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">
              S'abonner
            </span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              Rejoignez le plan Premium
            </h1>
            <p className="text-xl text-neutral-600">
              Découvrez toutes les fonctionnalités premium pour {supermarket.supermarket_name.fr || supermarket.supermarket_name.en}
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
              />
            </div>
          </div>

          {/* Pricing Card */}
          <div className="lg:col-span-2">
            <PricingCard />
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-3">
              Pourquoi 50€ par mois ?
            </h3>
            <p className="text-neutral-600 text-sm">
              sucre et sel est votre plateforme tout-en-un pour gérer votre supermarché en ligne. Ce prix couvre tous les services y compris les listages de produits, les outils promotionnels et le support dédié.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-3">
              Que se passe-t-il si j'annule ?
            </h3>
            <p className="text-neutral-600 text-sm">
              Vous pouvez annuler votre abonnement à tout moment. Vous aurez un accès complet jusqu'à la fin de votre période de facturation actuelle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server actions
