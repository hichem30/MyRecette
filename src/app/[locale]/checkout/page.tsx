import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { CreditCard, ArrowLeft, ShieldCheck, Truck, MapPin, Home, CheckCircle } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe/server";

// Mock data for local development
const mockCart = {
  items: [
    {
      product_id: "p-1",
      slug: "organic-tomatoes",
      name: { en: "Organic Tomatoes", es: "Tomates Orgánicos", fr: "Tomates Biologiques", ar: "طماطم عضوية" },
      price: 2.99,
      quantity: 2,
    },
    {
      product_id: "p-2",
      slug: "free-range-eggs",
      name: { en: "Free Range Eggs", es: "Huevos de Gallina Libre", fr: "Œufs de Poules en Liberté", ar: "بيض مزارع حرة" },
      price: 3.50,
      quantity: 1,
    },
  ],
  subtotal: 9.48,
  tax: 0.95,
  shipping: 0, // Free shipping
  total: 10.43,
};

const mockSupermarket = {
  id: "s-1",
  supermarket_name: { en: "Fresh Mart", es: "Fresh Mart", fr: "Fresh Mart", ar: "فريش مارت" },
  address: { en: "123 Main St, Paris", es: "123 Calle Principal, París", fr: "123 Rue Principale, Paris", ar: "123 شارع رئيسي، باريس" },
  profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
  distance_km: 2.5,
};

const mockUser = {
  id: "user-1",
  email: "user@example.com",
  name: { en: "John Doe", es: "John Doe", fr: "John Doe", ar: "جون دو" },
  phone: "+1 234 567 890",
  address: {
    line1: "123 User St",
    line2: "",
    city: "Paris",
    state: "FR",
    postal_code: "75001",
    country: "France",
  },
};

export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CheckoutPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ supermarket?: string; items?: string }>;
}) {
  const { locale } = await params;
  const { supermarket, items } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const tC = await getTranslations("common");

  // Parse items from search params if present
  // In a real implementation, we would get this from the cart context
  const cart = mockCart;
  const selectedSupermarket = mockSupermarket;

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 5; // Free shipping over $50
  const total = subtotal + tax + shipping;

  // Handle checkout submission
  async function handleCheckout(formData: FormData) {
    "use server";
    
    if (!isSupabaseConfigured()) {
      // In local dev, just redirect to success
      redirect(`/${locale}/checkout/success?session_id=mock_session`);
    }
    
    try {
      // In a real implementation:
      // 1. Create order in database
      // 2. Create Stripe checkout session
      // 3. Redirect to Stripe
      
      // For now, redirect to success page
      redirect(`/${locale}/checkout/success?session_id=mock_session`);
    } catch (error) {
      redirect(`/${locale}/checkout/cancel`);
    }
  }

  return (
    <div className="container-page py-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
          <Link href="/cart" className="hover:text-recette-600">
            {tC("cart")}
          </Link>
          <span>&gt;</span>
          <span className="text-neutral-900">{t("title")}</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-bold text-neutral-900">{t("title")}</h1>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm text-recette-600 hover:text-recette-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToCart")}
          </Link>
        </div>

        {/* Checkout Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[t("step1"), t("step2"), t("step3")].map((step, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      index === 0
                        ? "bg-recette-600 text-white"
                        : index === 1
                        ? "bg-recette-600 text-white"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-xs mt-2 ${index <= 1 ? "text-recette-600" : "text-neutral-400"}`}>
                    {step}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`h-0.5 flex-1 mx-2 ${index < 1 ? "bg-recette-600" : "bg-neutral-200"}`} style={{ minWidth: "60px" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Supermarket Selection */}
        <div className="p-6 rounded-lg border border-neutral-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-recette-100 flex items-center justify-center flex-shrink-0">
              <Store className="h-6 w-6 text-recette-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900">{t("selectedSupermarket")}</h3>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={selectedSupermarket.profile_picture_url}
                  alt={selectedSupermarket.supermarket_name.en}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-neutral-900">
                    {selectedSupermarket.supermarket_name[locale as keyof typeof selectedSupermarket.supermarket_name] || 
                     selectedSupermarket.supermarket_name.en}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {selectedSupermarket.address[locale as keyof typeof selectedSupermarket.address] || 
                     selectedSupermarket.address.en} ({selectedSupermarket.distance_km.toFixed(1)} km)
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/cart"
              className="text-sm text-recette-600 hover:text-recette-700 flex-shrink-0"
            >
              {t("change")}
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 rounded-lg border border-neutral-200 mb-8">
          <h3 className="font-serif text-xl font-bold text-neutral-900 mb-4">{t("orderSummary")}</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">{t("subtotal")}</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">{t("tax")}</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">{t("shipping")}</span>
              <span className="font-medium">{shipping === 0 ? t("free") : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-neutral-200 pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>{t("total")}</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items in Order */}
        <div className="p-6 rounded-lg border border-neutral-200 mb-8">
          <h3 className="font-serif text-xl font-bold text-neutral-900 mb-4">{t("itemsInOrder")}</h3>
          
          <div className="space-y-4">
            {cart.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <img
                  src={`https://images.unsplash.com/photo-1592841200221-21e7500398b3?auto=format&fit=crop&w=100&q=80&index=${index}`}
                  alt={item.name.en}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900">
                    {item.name[locale as keyof typeof item.name] || item.name.en}
                  </h4>
                  <p className="text-sm text-neutral-500">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="p-6 rounded-lg border border-neutral-200 mb-8">
          <h3 className="font-serif text-xl font-bold text-neutral-900 mb-4">{t("deliveryInfo")}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50">
              <Truck className="h-6 w-6 text-recette-600 flex-shrink-0" />
              <div>
                <p className="font-medium">{t("deliveryMethod")}</p>
                <p className="text-sm text-neutral-500">{t("inStorePickup")}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50">
              <MapPin className="h-6 w-6 text-recette-600 flex-shrink-0" />
              <div>
                <p className="font-medium">{t("pickupLocation")}</p>
                <p className="text-sm text-neutral-500">
                  {selectedSupermarket.address[locale as keyof typeof selectedSupermarket.address] || 
                   selectedSupermarket.address.en}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50">
              <Home className="h-6 w-6 text-recette-600 flex-shrink-0" />
              <div>
                <p className="font-medium">{t("deliveryAddress")}</p>
                <p className="text-sm text-neutral-500">
                  {mockUser.address.line1}, {mockUser.address.city}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="p-6 rounded-lg border border-neutral-200 mb-8">
          <h3 className="font-serif text-xl font-bold text-neutral-900 mb-4">{t("paymentMethod")}</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 cursor-pointer hover:border-recette-300">
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                className="h-4 w-4 text-recette-600 border-neutral-300 focus:ring-recette-600"
                defaultChecked
              />
              <CreditCard className="h-6 w-6 text-neutral-400" />
              <div>
                <p className="font-medium">{t("creditCard")}</p>
                <p className="text-sm text-neutral-500">{t("securePayment")}</p>
              </div>
              <div className="ml-auto">
                <ShieldCheck className="h-5 w-5 text-recette-600" />
              </div>
            </label>
          </div>
        </div>

        {/* Checkout Form */}
        <form action={handleCheckout} className="p-6 rounded-lg border border-neutral-200">
          <h3 className="font-serif text-xl font-bold text-neutral-900 mb-4">{t("contactInfo")}</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                {t("email")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={mockUser.email}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-recette-600 focus:border-recette-600 outline-none"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                {t("phone")}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                defaultValue={mockUser.phone}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-recette-600 focus:border-recette-600 outline-none"
                required
              />
            </div>
            
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className="h-4 w-4 text-recette-600 border-neutral-300 rounded focus:ring-recette-600 mt-0.5"
                required
              />
              <label htmlFor="terms" className="text-sm text-neutral-600">
                {t("acceptTerms")} <Link href="/terms" className="text-recette-600 hover:underline">{t("termsOfService")}</Link>
              </label>
            </div>
            
            <button
              type="submit"
              className="w-full bg-recette-600 hover:bg-recette-700 text-white font-semibold py-3 rounded-full transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              {t("completeOrder")}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500 flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t("secureNotice")}
          </p>
        </div>
      </div>
    </div>
  );
}
