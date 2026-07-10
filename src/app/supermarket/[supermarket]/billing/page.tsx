import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale, t } from "@/lib/fr";
import { Calendar, CheckCircle, Clock, CreditCard, Crown, Euro, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  monthly_fee: number;
  currency: string;
  created_at: string;
}

interface SupermarketProfile {
  id: string;
  email: string;
  supermarket_name: { en: string; es?: string; fr?: string; ar?: string };
  subscription_status?: string;
  subscription_end_date?: string;
  stripe_customer_id?: string;
  subscription?: Subscription;
}

async function getSupermarketProfile(supermarketId: string, userId: string): Promise<SupermarketProfile | null> {
  const sb = await getSupabaseServerClient();

  if (!isSupabaseConfigured()) {
    // Mock data for local development
    return {
      id: supermarketId,
      email: "demo-supermarket@myrecette.com",
      supermarket_name: { en: "Demo Supermarket", es: "Supermercado Demo", fr: "Supermarché Démo", ar: "سوبر ماركت تجريبي" },
      subscription_status: "active",
      stripe_customer_id: "cus_mock_123",
      subscription: {
        id: "sub_mock_123",
        stripe_subscription_id: "sub_stripe_123",
        stripe_customer_id: "cus_mock_123",
        status: "active",
        current_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        monthly_fee: 50.00,
        currency: "EUR",
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      },
    };
  }

  try {
    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select(
        "id, email, supermarket_name, subscription_status, subscription_end_date, stripe_customer_id"
      )
      .eq("id", supermarketId)
      .eq("is_supermarket", true)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching supermarket:", profileError);
      return null;
    }

    // Get subscription details
    let subscription: Subscription | undefined;
    if (profile.stripe_customer_id) {
      const { data: subData, error: subError } = await sb
        .from("subscriptions")
        .select("*")
        .eq("stripe_customer_id", profile.stripe_customer_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!subError && subData) {
        subscription = subData;
      }
    }

    return {
      ...profile,
      subscription,
    };
  } catch (error) {
    console.error("Database error:", error);
    return null;
  }
}

async function cancelSubscription(supermarketId: string, userId: string) {
  if (!isSupabaseConfigured()) {
    // Mock for local development
    console.log("[MOCK] Canceling subscription for supermarket:", supermarketId);
    return { success: true };
  }

  // In a real implementation, this would:
  // 1. Call Stripe API to cancel the subscription
  // 2. Update the database subscription status
  // 3. Update the profile subscription_status

  return { success: true };
}

async function reactivateSubscription(supermarketId: string, userId: string) {
  if (!isSupabaseConfigured()) {
    // Mock for local development
    console.log("[MOCK] Reactivating subscription for supermarket:", supermarketId);
    return { success: true, checkoutUrl: `/fr/supermarket/${supermarketId}/subscribe` };
  }

  // In a real implementation, this would create a new checkout session
  return { success: true, checkoutUrl: `/fr/supermarket/${supermarketId}/subscribe` };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; supermarket: string }>;
}): Promise<Metadata> {
  const { supermarket: supermarketId } = await params;

  return {
    title: "Facturation - My Recette",
    description: "Gérez votre abonnement et votre facturation pour votre supermarché",
    openGraph: {
      title: "Facturation - My Recette",
      description: "Gérez votre abonnement et votre facturation pour votre supermarché",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/fr/supermarket/${supermarketId}/billing`,
      type: "website",
    },
  };
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fr-FR");
}

function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("fr-FR");
}

function formatCurrency(amount: number | undefined, currency: string | undefined): string {
  if (amount === undefined) return "-";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "EUR" }).format(amount);
}

function SubscriptionCard({ supermarket }: { supermarket: SupermarketProfile }) {
  const subscription = supermarket.subscription;
  const status = subscription?.status || supermarket.subscription_status || "inactive";

  // Get status display info
  const getStatusInfo = () => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          color: "emerald",
          icon: <CheckCircle className="h-5 w-5" />,
        };
      case "trialing":
        return {
          label: "Essai",
          color: "amber",
          icon: <Clock className="h-5 w-5" />,
        };
      case "past_due":
        return {
          label: "En retard",
          color: "red",
          icon: <XCircle className="h-5 w-5" />,
        };
      case "canceled":
        return {
          label: "Annulée",
          color: "neutral",
          icon: <XCircle className="h-5 w-5" />,
        };
      case "incomplete":
        return {
          label: "Incomplète",
          color: "amber",
          icon: <Clock className="h-5 w-5" />,
        };
      default:
        return {
          label: status,
          color: "neutral",
          icon: <Clock className="h-5 w-5" />,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="bg-gradient-to-r from-recette-600 to-recette-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Mon Abonnement
            </h2>
            <p className="text-recette-100 text-sm mt-1">
              {supermarket.supermarket_name.fr || supermarket.supermarket_name.en}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${statusInfo.color}-500/20 text-${statusInfo.color}-100`}>
            {statusInfo.icon}
            <span className="text-sm font-medium">{statusInfo.label}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-500">
              Plan
            </p>
            <p className="font-semibold text-neutral-900">
              Premium
            </p>
          </div>
          <div>
            <p className="text-neutral-500">
              Prix
            </p>
            <p className="font-semibold text-neutral-900">
              {formatCurrency(subscription?.monthly_fee || 50, subscription?.currency || "EUR")} / mois
            </p>
          </div>
          <div>
            <p className="text-neutral-500">
              Début
            </p>
            <p className="font-semibold text-neutral-900">
              {formatDate(subscription?.current_period_start || supermarket.subscription_end_date)}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">
              Renouvellement
            </p>
            <p className="font-semibold text-neutral-900">
              {formatDate(subscription?.current_period_end)}
            </p>
          </div>
        </div>

        {status === "active" && (
          <div className="mt-6 pt-6 border-t border-neutral-100 flex gap-4">
            <Link
              href="/?update_payment=1"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-recette-600 text-recette-600 font-semibold hover:bg-recette-50 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Mettre à jour le paiement
            </Link>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Annuler
            </button>
          </div>
        )}

        {status !== "active" && (
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <Link
              href={`/supermarket/${supermarket.id}/subscribe`}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Réactiver l'abonnement
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function BillingHistory({ subscriptions }: { subscriptions: any[] }) {
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
        <p className="text-neutral-500">
          Aucun historique de facturation
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-900">
          Historique de facturation
        </h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {subscriptions.map((sub, index) => (
          <div key={sub.id || index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-neutral-900">
                  {formatDateTime(sub.created_at)}
                </p>
                <p className="text-sm text-neutral-500">
                  {sub.stripe_subscription_id}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-neutral-900">
                  {formatCurrency(sub.monthly_fee, sub.currency)}
                </p>
                <p className="text-sm text-neutral-500">
                  {sub.status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentMethods({ stripeCustomerId }: { stripeCustomerId?: string }) {
  // Mock payment methods for now
  const paymentMethods = [
    {
      id: "pm_mock_1",
      type: "card",
      brand: "visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2026,
      default: true,
    },
  ];

  if (!stripeCustomerId) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
        <p className="text-neutral-500 mb-4">
          Aucune méthode de paiement
        </p>
        <Link
          href="/?add_payment=1"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
        >
          <CreditCard className="h-4 w-4" />
          Ajouter une méthode de paiement
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-900">
          Méthodes de paiement
        </h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {paymentMethods.map((method) => (
          <div key={method.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 rounded bg-neutral-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-neutral-600">
                    {method.brand.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    •••• {method.last4}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Expire {method.exp_month}/{method.exp_year}
                  </p>
                </div>
              </div>
              {method.default && (
                <span className="text-xs bg-recette-100 text-recette-700 px-2 py-1 rounded-full font-medium">
                  Par défaut
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border-t border-neutral-100">
        <Link
          href="/?add_payment=1"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-recette-600 text-recette-600 font-semibold hover:bg-recette-50 transition-colors"
        >
          <CreditCard className="h-4 w-4" />
          Ajouter une méthode de paiement
        </Link>
      </div>
    </div>
  );
}

export default async function SupermarketBillingPage({
  params,
}: {
  params: Promise<{ locale: string; supermarket: string }>;
}) {
  const { supermarket: supermarketId } = await params;

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

  // Get subscription history
  const subscriptions: any[] = [];
  if (supermarket.stripe_customer_id && (await isSupabaseConfigured())) {
    const { data, error } = await sb
      .from("subscriptions")
      .select("*")
      .eq("stripe_customer_id", supermarket.stripe_customer_id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      subscriptions.push(...data);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
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
              Facturation
            </span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-bold text-neutral-900 mb-2">
              Facturation
            </h1>
            <p className="text-neutral-600">
              Gérez votre abonnement et votre facturation
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscription Card */}
          <div className="lg:col-span-2">
            <SubscriptionCard supermarket={supermarket} />
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">
                Actions rapides
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/fr/supermarket/${supermarket.id}/subscribe`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <Crown className="h-5 w-5 text-recette-600" />
                  <span className="text-neutral-700">Voir les plans</span>
                </Link>
                <Link
                  href="/?invoices=1"
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-recette-600" />
                  <span className="text-neutral-700">Factures</span>
                </Link>
                <Link
                  href="/?support=1"
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <CreditCard className="h-5 w-5 text-recette-600" />
                  <span className="text-neutral-700">Support de facturation</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentMethods stripeCustomerId={supermarket.stripe_customer_id} />
          <BillingHistory subscriptions={subscriptions} />
        </div>

        {/* Support */}
        <div className="mt-8 bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-2">
            Besoin d'aide ?
          </h3>
          <p className="text-neutral-600 mb-4">
            Contactez-nous si vous avez des questions concernant votre abonnement ou votre facturation.
          </p>
          <Link
            href="/fr/contact"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  );
}