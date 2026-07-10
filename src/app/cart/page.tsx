import type { Metadata } from "next";
import { setRequestLocale } from "@/lib/fr";
import { t } from "@/lib/fr";
import { notFound } from "next/navigation";
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus, MapPin, Store } from "lucide-react";
import Link from "next/link";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import type { CartItem, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ErrorBoundary";

// Mock data for local development
const mockCartItems: CartItem[] = [
  {
    product_id: "p-1",
    slug: "organic-tomatoes",
    name: { en: "Organic Tomatoes", es: "Tomates Orgánicos", fr: "Tomates Biologiques", ar: "طماطم عضوية" },
    price: 2.99,
    image_url: "https://images.unsplash.com/photo-1592841200221-21e7500398b3?auto=format&fit=crop&w=200&q=80",
    quantity: 2,
  },
  {
    product_id: "p-2",
    slug: "free-range-eggs",
    name: { en: "Free Range Eggs", es: "Huevos de Gallina Libre", fr: "Œufs de Poules en Liberté", ar: "بيض مزارع حرة" },
    price: 3.50,
    image_url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=200&q=80",
    quantity: 1,
  },
  {
    product_id: "p-3",
    slug: "whole-wheat-bread",
    name: { en: "Whole Wheat Bread", es: "Pan Integral", fr: "Pain Complet", ar: "خبز القمح الكامل" },
    price: 4.50,
    image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80",
    quantity: 1,
  },
];

const mockSupermarkets = [
  {
    id: "s-1",
    supermarket_name: { en: "Fresh Mart", es: "Fresh Mart", fr: "Fresh Mart", ar: "فريش مارت" },
    profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
    address: { en: "123 Main St, Paris", es: "123 Calle Principal, París", fr: "123 Rue Principale, Paris", ar: "123 شارع رئيسي، باريس" },
    distance_km: 2.5,
  },
  {
    id: "s-2",
    supermarket_name: { en: "Green Grocer", es: "Verdulero Verde", fr: "Épicerie Verte", ar: "بقال أخضر" },
    profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    address: { en: "456 Oak Ave, Paris", es: "456 Avenida Roble, París", fr: "456 Avenue Chêne, Paris", ar: "456 شارع البلوط، باريس" },
    distance_km: 5.2,
  },
];

export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata(): Promise<Metadata> {
  // In single language mode, no locale needed
  
  return {
    title: t("cart.title"),
    description: t("cart.description"),
  };
}

export default async function CartPage() {
  // In single language mode, no locale needed
  // Use t("cart.key") and t("common.key") directly
  const locale = "fr";
  
  // Check if Supabase is configured
  const isConfigured = isSupabaseConfigured();
  
  // In a real implementation, we would fetch from Supabase
  // For now, use mock data for local development
  const cartItems = mockCartItems;
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 5; // Free shipping over $50
  const total = subtotal + tax + shipping;
  
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (itemCount === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10 text-recette-600" />}
          title={t("cart.emptyTitle")}
          description={t("cart.emptyDescription")}
          action={
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-recette-600 px-6 py-3 text-sm font-semibold text-white hover:bg-recette-700 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.continueShopping")}
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center gap-2 rounded-full border border-recette-600 px-6 py-3 text-sm font-semibold text-recette-600 hover:bg-recette-50 transition"
              >
                {t("cart.browseRecipes")}
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-3xl font-bold text-neutral-900">{t("title")}</h1>
              <p className="text-sm text-neutral-500">{itemCount} {itemCount === 1 ? t("cart.item") : t("cart.items")}</p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-recette-600 hover:text-recette-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.continueShopping")}
            </Link>
          </div>

          {/* Cart Items List */}
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200">
                <div className="relative">
                  <img
                    src={item.image_url}
                    alt={item.name[locale as keyof typeof item.name] }
                    className="h-20 w-20 rounded-md object-cover"
                  />
                  <span className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-recette-600 text-xs font-bold text-white">
                    {item.quantity}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 truncate">
                    {item.name[locale as keyof typeof item.name] }
                  </h3>
                  <p className="text-sm text-neutral-500">
                    ${item.price.toFixed(2)} {t("cart.each")}
                  </p>
                  
                  {/* Supermarket selector (for sucre et sel) */}
                  <div className="mt-2">
                    <select className="text-xs border border-neutral-300 rounded-md px-2 py-1 bg-white">
                      {mockSupermarkets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.supermarket_name[locale as keyof typeof s.supermarket_name] }
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-neutral-500 ml-2">
                      {mockSupermarkets[0].distance_km.toFixed(1)} km
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <p className="font-semibold text-neutral-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="h-8 w-8 flex items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-50">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                    <button className="h-8 w-8 flex items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-50">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                    <Trash2 className="h-3 w-3" />
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Availability Notice */}
          <div className="mt-6 p-4 rounded-lg bg-recette-50 border border-recette-200">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-recette-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-recette-800">{t("cart.availabilityTitle")}</p>
                <p className="text-sm text-recette-600 mt-1">
                  {t("cart.availabilityDescription")}
                </p>
                <button className="mt-2 text-sm text-recette-700 font-medium hover:text-recette-800">
                  {t("cart.checkAvailability")} →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h2 className="font-serif text-xl font-bold text-neutral-900 mb-4">{t("cart.orderSummary")}</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">{t("cart.subtotal")}</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">{t("cart.tax")}</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">{t("cart.shipping")}</span>
                <span className="font-medium">{shipping === 0 ? t("cart.free") : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-neutral-200 pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("total")}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Supermarket Selection */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">{t("selectSupermarket")}</h3>
              <div className="space-y-2">
                {mockSupermarkets.map((supermarket) => (
                  <label
                    key={supermarket.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:border-recette-300"
                  >
                    <input
                      type="radio"
                      name="supermarket"
                      className="h-4 w-4 text-recette-600 border-neutral-300 focus:ring-recette-600"
                      defaultChecked={supermarket.id === "s-1"}
                    />
                    <img
                      src={supermarket.profile_picture_url}
                      alt={supermarket.supermarket_name.en}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {supermarket.supermarket_name[locale as keyof typeof supermarket.supermarket_name] }
                      </p>
                      <p className="text-xs text-neutral-500">
                        {supermarket.address[locale as keyof typeof supermarket.address] }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">{supermarket.distance_km.toFixed(1)} km</p>
                      <p className="text-sm font-semibold text-neutral-900">${(total).toFixed(2)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              type="button"
              className="w-full mt-6 bg-recette-600 hover:bg-recette-700 text-white font-semibold py-3 rounded-full transition"
            >
              {t("proceedToCheckout")}
            </Button>

            {/* Price Comparison */}
            <div className="mt-4 text-center">
              <button className="text-xs text-recette-600 hover:text-recette-700">
                {t("comparePrices")} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
