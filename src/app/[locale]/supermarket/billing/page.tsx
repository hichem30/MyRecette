import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Calendar, CheckCircle, Clock, CreditCard, Crown, Euro, RotateCcw, XCircle } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
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

async function reactivateSubscription(supermarketId: string, userId: string, lang: string) {
  if (!isSupabaseConfigured()) {
    // Mock for local development
    console.log("[MOCK] Reactivating subscription for supermarket:", supermarketId);
    return { success: true, checkoutUrl: `/${lang}/supermarket/subscribe` };
  }

  // In a real implementation, this would create a new checkout session
  return { success: true, checkoutUrl: `/${lang}/supermarket/subscribe` };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; supermarket: string }>;
}): Promise<Metadata> {
  const { locale, supermarket: supermarketId } = await params;
  const t = await getTranslations({ locale, namespace: "subscriptions" });

  return {
    title: t("billingTitle"),
    description: t("billingDescription"),
    openGraph: {
      title: t("billingTitle"),
      description: t("billingDescription"),
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://myrecette.com"}/${locale}/supermarket/billing`,
      type: "website",
    },
  };
}

function formatDate(dateString: string | undefined, lang: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString(lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "ar" ? "ar-SA" : "en-US");
}

function formatDateTime(dateString: string | undefined, lang: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString(lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "ar" ? "ar-SA" : "en-US");
}

function formatCurrency(amount: number | undefined, currency: string | undefined, lang: string): string {
  if (amount === undefined) return "-";
  return new Intl.NumberFormat(
    lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "ar" ? "ar-SA" : "en-US",
    { style: "currency", currency: currency || "EUR" }
  ).format(amount);
}

function SubscriptionCard({ supermarket, lang }: { supermarket: SupermarketProfile; lang: string }) {
  const subscription = supermarket.subscription;
  const status = subscription?.status || supermarket.subscription_status || "inactive";

  // Get status display info
  const getStatusInfo = () => {
    switch (status) {
      case "active":
        return {
          label: lang === "es" ? "Activa" : lang === "fr" ? "Active" : lang === "ar" ? "نشط" : "Active",
          color: "emerald",
          icon: <CheckCircle className="h-5 w-5" />,
        };
      case "trialing":
        return {
          label: lang === "es" ? "En prueba" : lang === "fr" ? "Essai" : lang === "ar" ? "تجريبي" : "Trialing",
          color: "amber",
          icon: <Clock className="h-5 w-5" />,
        };
      case "past_due":
        return {
          label: lang === "es" ? "Vencida" : lang === "fr" ? "En retard" : lang === "ar" ? "متأخرة" : "Past Due",
          color: "red",
          icon: <XCircle className="h-5 w-5" />,
        };
      case "canceled":
        return {
          label: lang === "es" ? "Cancelada" : lang === "fr" ? "Annulée" : lang === "ar" ? "ملغية" : "Canceled",
          color: "neutral",
          icon: <XCircle className="h-5 w-5" />,
        };
      case "incomplete":
        return {
          label: lang === "es" ? "Incompleta" : lang === "fr" ? "Incomplète" : lang === "ar" ? "غير مكتملة" : "Incomplete",
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
              {lang === "es" ? "Mi Suscripción" :
               lang === "fr" ? "Mon Abonnement" :
               lang === "ar" ? "اشتراكي" :
               "My Subscription"}
            </h2>
            <p className="text-recette-100 text-sm mt-1">
              {supermarket.supermarket_name[lang as keyof typeof supermarket.supermarket_name] || supermarket.supermarket_name.en}
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
              {lang === "es" ? "Plan" : lang === "fr" ? "Plan" : lang === "ar" ? "الخطة" : "Plan"}
            </p>
            <p className="font-semibold text-neutral-900">
              {lang === "es" ? "Premium" : lang === "fr" ? "Premium" : lang === "ar" ? "مميز" : "Premium"}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">
              {lang === "es" ? "Precio" : lang === "fr" ? "Prix" : lang === "ar" ? "السعر" : "Price"}
            </p>
            <p className="font-semibold text-neutral-900">
              {formatCurrency(subscription?.monthly_fee || 50, subscription?.currency || "EUR", lang)} / {lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ar" ? "شهر" : "month"}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">
              {lang === "es" ? "Iniciado" : lang === "fr" ? "Début" : lang === "ar" ? "ابدأ" : "Started"}
            </p>
            <p className="font-semibold text-neutral-900">
              {formatDate(subscription?.current_period_start || supermarket.subscription_end_date, lang)}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">
              {lang === "es" ? "Renovación" : lang === "fr" ? "Renouvellement" : lang === "ar" ? "تجديد" : "Renewal"}
            </p>
            <p className="font-semibold text-neutral-900">
              {formatDate(subscription?.current_period_end, lang)}
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
              {lang === "es" ? "Actualizar pago" : lang === "fr" ? "Mettre à jour le paiement" : lang === "ar" ? "تحديث الدفع" : "Update Payment"}
            </Link>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
          </div>
        )}

        {status !== "active" && (
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <Link
              href="/supermarket/subscribe"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              {lang === "es" ? "Reactivar suscripción" : lang === "fr" ? "Réactiver l'abonnement" : lang === "ar" ? "إعادة تفعيل الاشتراك" : "Reactivate Subscription"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function BillingHistory({ subscriptions, lang }: { subscriptions: any[]; lang: string }) {
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
        <p className="text-neutral-500">
          {lang === "es" ? "No hay historial de facturación" :
           lang === "fr" ? "Aucun historique de facturation" :
           lang === "ar" ? "لا يوجد سجل فواتير" :
           "No billing history"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-900">
          {lang === "es" ? "Historial de facturación" :
           lang === "fr" ? "Historique de facturation" :
           lang === "ar" ? "سجل الفواتير" :
           "Billing History"}
        </h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {subscriptions.map((sub, index) => (
          <div key={sub.id || index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-neutral-900">
                  {formatDateTime(sub.created_at, lang)}
                </p>
                <p className="text-sm text-neutral-500">
                  {sub.stripe_subscription_id}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-neutral-900">
                  {formatCurrency(sub.monthly_fee, sub.currency, lang)}
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

function PaymentMethods({ stripeCustomerId, lang }: { stripeCustomerId?: string; lang: string }) {
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
          {lang === "es" ? "No hay métodos de pago" :
           lang === "fr" ? "Aucune méthode de paiement" :
           lang === "ar" ? "لا توجد طرق دفع" :
           "No payment methods"}
        </p>
        <Link
          href="/?add_payment=1"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
        >
          <CreditCard className="h-4 w-4" />
          {lang === "es" ? "Añadir método de pago" : lang === "fr" ? "Ajouter une méthode de paiement" : lang === "ar" ? "إضافة طريقة دفع" : "Add Payment Method"}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-900">
          {lang === "es" ? "Métodos de pago" : lang === "fr" ? "Méthodes de paiement" : lang === "ar" ? "طرق الدفع" : "Payment Methods"}
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
                    {lang === "es" ? "Vence" : lang === "fr" ? "Expire" : lang === "ar" ? "تنتهي" : "Expires"} {method.exp_month}/{method.exp_year}
                  </p>
                </div>
              </div>
              {method.default && (
                <span className="text-xs bg-recette-100 text-recette-700 px-2 py-1 rounded-full font-medium">
                  {lang === "es" ? "Predeterminado" : lang === "fr" ? "Par défaut" : lang === "ar" ? "افتراضي" : "Default"}
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
          {lang === "es" ? "Añadir método de pago" : lang === "fr" ? "Ajouter une méthode de paiement" : lang === "ar" ? "إضافة طريقة دفع" : "Add Payment Method"}
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
  const { locale, supermarket: supermarketId } = await params;

  setRequestLocale(locale);
  const t = await getTranslations("subscriptions");
  const tC = await getTranslations("common");

  const lang = locale as "en" | "es" | "fr" | "ar";

  // Get user session
  const sb = await getSupabaseServerClient();
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
            <Link href={`/${lang}/`} className="hover:text-recette-600">
              {tC("home")}
            </Link>
            <span>/</span>
            <Link href={`/${lang}/account`} className="hover:text-recette-600">
              {tC("account")}
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">
              {t("billing")}
            </span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-bold text-neutral-900 mb-2">
              {t("billing")}
            </h1>
            <p className="text-neutral-600">
              {t("manageSubscription")}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscription Card */}
          <div className="lg:col-span-2">
            <SubscriptionCard supermarket={supermarket} lang={lang} />
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">
                {lang === "es" ? "Acciones rápidas" :
                 lang === "fr" ? "Actions rapides" :
                 lang === "ar" ? "الإجراءات السريعة" :
                 "Quick Actions"}
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/${lang}/supermarket/subscribe`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <Crown className="h-5 w-5 text-recette-600" />
                  <span className="text-neutral-700">{lang === "es" ? "Ver planes" : lang === "fr" ? "Voir les plans" : lang === "ar" ? "عرض الخطط" : "View Plans"}</span>
                </Link>
                <Link
                  href="/?invoices=1"
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-recette-600" />
                  <span className="text-neutral-700">{lang === "es" ? "Facturas" : lang === "fr" ? "Factures" : lang === "ar" ? "الفواتير" : "Invoices"}</span>
                </Link>
                <Link
                  href="/?support=1"
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <CreditCard className="h-5 w-5 text-recette-600" />
                  <span className="text-neutral-700">{lang === "es" ? "Soporte de facturación" : lang === "fr" ? "Support de facturation" : lang === "ar" ? "دعم الفواتير" : "Billing Support"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentMethods stripeCustomerId={supermarket.stripe_customer_id} lang={lang} />
          <BillingHistory subscriptions={subscriptions} lang={lang} />
        </div>

        {/* Support */}
        <div className="mt-8 bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-2">
            {lang === "es" ? "¿Necesitas ayuda?" :
             lang === "fr" ? "Besoin d'aide ?" :
             lang === "ar" ? "هل تحتاج إلى مساعدة؟" :
             "Need help?"}
          </h3>
          <p className="text-neutral-600 mb-4">
            {lang === "es" ? "Contáctanos si tienes alguna pregunta sobre tu suscripción o facturación." :
             lang === "fr" ? "Contactez-nous si vous avez des questions concernant votre abonnement ou votre facturation." :
             lang === "ar" ? "اتصل بنا إذا كان لديك أي أسئلة حول الاشتراك أو الفواتير." :
             "Contact us if you have any questions about your subscription or billing."}
          </p>
          <Link
            href={`/${lang}/contact`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-recette-600 text-white font-semibold hover:bg-recette-700 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            {lang === "es" ? "Contactar soporte" : lang === "fr" ? "Contacter le support" : lang === "ar" ? "اتصل بالدعم" : "Contact Support"}
          </Link>
        </div>
      </div>
    </div>
  );
}