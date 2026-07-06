import type { Metadata } from "next";
import { notFound, revalidatePath } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Home,
  MapPin,
  Phone,
  Globe,
  Mail,
  Tag,
  TrendingUp,
  Users,
  ShoppingBag,
  Ticket,
  Package,
  Briefcase,
  Plus,
  Share2,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import {
  getSupermarketById,
  getSupermarketProducts,
  getSupermarketCoupons,
  getSupermarketBundles,
  getSupermarketSales,
  getSupermarketJobs,
} from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupermarketProfile } from "@/lib/types";

export const revalidate = 60;
export const dynamicParams = true;

type TabType = "about" | "products" | "coupons" | "bundles" | "sales" | "jobs";

const tabConfig: Array<{
  id: TabType;
  label: { en: string; es: string; fr: string; ar: string };
  icon: React.ReactNode;
}> = [
  {
    id: "about",
    label: { en: "About", es: "Acerca de", fr: "À propos", ar: "من نحن" },
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: "products",
    label: { en: "Products", es: "Productos", fr: "Produits", ar: "المنتجات" },
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    id: "coupons",
    label: { en: "Coupons", es: "Cupones", fr: "Coupons", ar: "الكوبونات" },
    icon: <Ticket className="h-4 w-4" />,
  },
  {
    id: "bundles",
    label: { en: "Bundles", es: "Paquetes", fr: "Lots", ar: "الباقات" },
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: "sales",
    label: { en: "Sales", es: "Ofertas", fr: "Promotions", ar: "العروض" },
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    id: "jobs",
    label: { en: "Jobs", es: "Empleos", fr: "Emplois", ar: "الوظائف" },
    icon: <Briefcase className="h-4 w-4" />,
  },
];

function getTabLabel(lang: string, tabId: TabType): string {
  const tab = tabConfig.find((t) => t.id === tabId);
  if (!tab) return tabId;
  return tab.label[lang as keyof typeof tab.label] || tab.label.en;
}

export async function generateStaticParams() {
  // In a real implementation, fetch all supermarket IDs from the database
  return []; // Dynamic for now
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const supermarket = await getSupermarketById(id);
  
  if (!supermarket) return {};
  
  const lang = locale as "en" | "es";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://myrecette.com";
  const url = `${base}/${lang}/supermarkets/${id}`;
  const name = supermarket.supermarket_name[lang] || supermarket.supermarket_name.en || "My Recette";
  const description =
    supermarket.description?.[lang] || supermarket.description?.en ||
    "Explore products, coupons, and more from this supermarket.";
  
  return {
    title: `${name} — My Recette`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} — My Recette`,
      description,
      url,
      siteName: "My Recette",
      type: "website",
      images: supermarket.banner_url ? [{ url: supermarket.banner_url, alt: name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — My Recette`,
      description,
      images: supermarket.banner_url ? [supermarket.banner_url] : undefined,
    },
  };
}

// Helper to get address string
default function getAddressString(supermarket: SupermarketProfile): string {
  const addr = supermarket.address;
  if (!addr) return "";
  const parts: string[] = [];
  if (addr.line1) parts.push(addr.line1);
  if (addr.line2) parts.push(addr.line2);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  if (addr.postal_code) parts.push(addr.postal_code);
  if (addr.country) parts.push(addr.country);
  return parts.join(", ");
}

// Helper to format opening hours
default function formatOpeningHours(hours?: Array<{ day: string; opens: string; closes: string; is_open: boolean }>): string {
  if (!hours || hours.length === 0) return "";
  
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayHours = hours.find((h) => h.day === today);
  
  if (todayHours) {
    return `${today}: ${todayHours.opens} - ${todayHours.closes} ${todayHours.is_open ? "(Open)" : "(Closed)"}`;
  }
  
  return `${hours[0].day}: ${hours[0].opens} - ${hours[0].closes}`;
}

// Helper to format phone number
default function formatPhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

// Follow/Unfollow button component
function FollowButtonClient({
  supermarketId,
  isFollowed: initialIsFollowed,
  userId,
}: {
  supermarketId: string;
  isFollowed: boolean;
  userId: string;
}) {
  "use client";
  
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [loading, setLoading] = useState(false);
  
  const handleFollow = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const method = isFollowed ? "DELETE" : "POST";
      const response = await fetch(`/api/supermarkets/${supermarketId}/follow`, {
        method,
        credentials: "include",
      });
      
      if (response.ok) {
        setIsFollowed(!isFollowed);
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const Icon = isFollowed ? Users : Plus;
  const label = isFollowed ? "Following" : "Follow";
  
  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
        isFollowed
          ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
          : "bg-recette-600 text-white hover:bg-recette-700 disabled:opacity-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {loading ? "..." : label}
    </button>
  );
}

function FollowButton({
  supermarketId,
  isFollowed,
  userId,
}: {
  supermarketId: string;
  isFollowed: boolean;
  userId?: string;
}) {
  if (!userId) return null;
  
  return (
    <FollowButtonClient
      supermarketId={supermarketId}
      isFollowed={isFollowed}
      userId={userId}
    />
  );
}

// Social links component
default function SocialLinks({ supermarket }: { supermarket: SupermarketProfile }) {
  const links = supermarket.social_links;
  if (!links) return null;
  
  const socialPlatforms = [
    { key: "facebook", icon: "📘", url: links.facebook },
    { key: "instagram", icon: "📷", url: links.instagram },
    { key: "twitter", icon: "🐦", url: links.twitter },
    { key: "linkedin", icon: "💼", url: links.linkedin },
  ];
  
  const validLinks = socialPlatforms.filter((p) => p.url);
  if (validLinks.length === 0) return null;
  
  return (
    <div className="flex gap-3">
      {validLinks.map((platform) => (
        <a
          key={platform.key}
          href={platform.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-600 hover:text-recette-600 transition-colors"
          title={platform.key}
        >
          <span className="text-xl">{platform.icon}</span>
        </a>
      ))}
    </div>
  );
}

// About section
default function AboutSection({ supermarket }: { supermarket: SupermarketProfile }) {
  const address = getAddressString(supermarket);
  const hours = formatOpeningHours(supermarket.opening_hours);
  const phone = formatPhone(supermarket.phone);
  
  return (
    <div className="space-y-8">
      {/* Description */}
      {supermarket.description && (
        <div className="prose max-w-none text-neutral-600">
          <p className="whitespace-pre-line">{supermarket.description.en}</p>
        </div>
      )}
      
      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address and Location */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-neutral-900">Address</h3>
              {address ? (
                <p className="text-neutral-600">{address}</p>
              ) : (
                <p className="text-neutral-500 italic">Not specified</p>
              )}
              {supermarket.location_geometry && (
                <a
                  href={`geo:${supermarket.address?.line1},${supermarket.address?.city}`}
                  className="inline-flex items-center gap-1 text-sm text-recette-600 hover:text-recette-700 mt-1"
                >
                  <MapPin className="h-4 w-4" />
                  Open in Maps
                </a>
              )}
            </div>
          </div>
          
          {/* Phone */}
          {phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-neutral-500" />
              <div>
                <h3 className="font-semibold text-neutral-900">Phone</h3>
                <p className="text-neutral-600">{phone}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Website and Email */}
        <div className="space-y-4">
          {supermarket.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-neutral-500" />
              <div>
                <h3 className="font-semibold text-neutral-900">Website</h3>
                <a
                  href={supermarket.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-recette-600 hover:text-recette-700 break-all"
                >
                  {supermarket.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
          )}
          
          {supermarket.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-neutral-500" />
              <div>
                <h3 className="font-semibold text-neutral-900">Email</h3>
                <p className="text-neutral-600">{supermarket.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Opening Hours */}
      {supermarket.opening_hours && supermarket.opening_hours.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900">Opening Hours</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 font-semibold text-neutral-900">Day</th>
                  <th className="text-left py-2 font-semibold text-neutral-900">Hours</th>
                  <th className="text-left py-2 font-semibold text-neutral-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {supermarket.opening_hours.map((day) => (
                  <tr key={day.day} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2 text-neutral-600">{day.day}</td>
                    <td className="py-2 text-neutral-600">{day.opens} - {day.closes}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          day.is_open
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {day.is_open ? "Open" : "Closed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Categories */}
      {supermarket.category_tags && supermarket.category_tags.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {supermarket.category_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-sm"
              >
                <Tag className="h-3.5 w-3.5" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="font-semibold text-neutral-900">Connect With Us</h3>
        <SocialLinks supermarket={supermarket} />
      </div>
    </div>
  );
}

// Products section
default async function ProductsSection({ supermarketId, lang }: { supermarketId: string; lang: "en" | "es" }) {
  const products = await getSupermarketProducts(supermarketId);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Products</h2>
        {products.length > 0 && (
          <Link
            href={`/${lang}/supermarkets/${supermarketId}/products`}
            className="text-sm text-recette-600 hover:text-recette-700 font-medium"
          >
            View All
          </Link>
        )}
      </div>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
              <div className="aspect-square bg-neutral-100 rounded-lg mb-3 flex items-center justify-center">
                {product.product?.image_url ? (
                  <img
                    src={product.product.image_url}
                    alt={product.product.name[lang] || product.product.name.en || "Product"}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-neutral-400" />
                )}
              </div>
              <h3 className="font-semibold text-neutral-900 line-clamp-1">
                {product.product?.name[lang] || product.product?.name.en || "Product"}
              </h3>
              <p className="text-sm text-neutral-500">
                {product.supermarket_sku || product.supermarket_barcode || product.product_id}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-neutral-900">
                    {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  {product.original_price && (
                    <span className="text-sm text-neutral-500 line-through">
                      {product.original_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.stock > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ShoppingBag className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
          <p className="text-neutral-500">No products available at the moment.</p>
        </div>
      )}
    </div>
  );
}

// Coupons section
default async function CouponsSection({ supermarketId, lang }: { supermarketId: string; lang: "en" | "es" }) {
  const coupons = await getSupermarketCoupons(supermarketId);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Active Coupons</h2>
        {coupons.length > 0 && (
          <Link
            href={`/${lang}/supermarkets/${supermarketId}/coupons`}
            className="text-sm text-recette-600 hover:text-recette-700 font-medium"
          >
            View All
          </Link>
        )}
      </div>
      
      {coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => {
            const today = new Date();
            const startsAt = new Date(coupon.starts_at);
            const endsAt = new Date(coupon.ends_at);
            const isActive = today >= startsAt && today <= endsAt;
            
            return (
              <div key={coupon.id} className="rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-6 w-6 text-recette-600" />
                      <h3 className="font-semibold text-neutral-900">{coupon.code}</h3>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {coupon.description[lang] || coupon.description.en}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          coupon.discount_type === "percent"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {coupon.discount_type === "percent" ? "-" : "€"}{coupon.discount_value}
                        {coupon.discount_type === "percent" ? "%" : " off"}
                      </span>
                      {coupon.min_purchase_amount && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs">
                          Min: {coupon.min_purchase_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {coupon.max_uses && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs">
                          {coupon.uses_count}/{coupon.max_uses} used
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-2">
                      Valid: {startsAt.toLocaleDateString()} - {endsAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Ticket className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
          <p className="text-neutral-500">No active coupons at the moment.</p>
        </div>
      )}
    </div>
  );
}

// Bundles section
default async function BundlesSection({ supermarketId, lang }: { supermarketId: string; lang: "en" | "es" }) {
  const bundles = await getSupermarketBundles(supermarketId);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Product Bundles</h2>
        {bundles.length > 0 && (
          <Link
            href={`/${lang}/supermarkets/${supermarketId}/bundles`}
            className="text-sm text-recette-600 hover:text-recette-700 font-medium"
          >
            View All
          </Link>
        )}
      </div>
      
      {bundles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bundles.map((bundle) => {
            const savings = bundle.original_price ? bundle.original_price - bundle.bundle_price : 0;
            const discountPercent = bundle.original_price ? Math.round((savings / bundle.original_price) * 100) : 0;
            
            return (
              <div key={bundle.id} className="rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
                <div className="aspect-video bg-neutral-100 rounded-lg mb-3 flex items-center justify-center">
                  {bundle.image_url ? (
                    <img
                      src={bundle.image_url}
                      alt={bundle.name[lang] || bundle.name.en || "Bundle"}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-neutral-400" />
                  )}
                </div>
                <h3 className="font-semibold text-neutral-900">{bundle.name[lang] || bundle.name.en}</h3>
                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                  {bundle.description[lang] || bundle.description.en}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg text-neutral-900">
                      {bundle.bundle_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {bundle.original_price && (
                      <>
                        <span className="text-sm text-neutral-500 line-through">
                          {bundle.original_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-semibold text-emerald-600">Save {discountPercent}%</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  {bundle.product_ids.length} {bundle.product_ids.length === 1 ? "product" : "products"}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
          <p className="text-neutral-500">No bundles available at the moment.</p>
        </div>
      )}
    </div>
  );
}

// Sales section
default async function SalesSection({ supermarketId, lang }: { supermarketId: string; lang: "en" | "es" }) {
  const sales = await getSupermarketSales(supermarketId);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Current Sales</h2>
        {sales.length > 0 && (
          <Link
            href={`/${lang}/supermarkets/${supermarketId}/sales`}
            className="text-sm text-recette-600 hover:text-recette-700 font-medium"
          >
            View All
          </Link>
        )}
      </div>
      
      {sales.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sales.map((sale) => {
            const startsAt = new Date(sale.starts_at);
            const endsAt = new Date(sale.ends_at);
            const today = new Date();
            const isActive = today >= startsAt && today <= endsAt;
            const daysLeft = isActive ? Math.ceil((endsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            
            return (
              <div key={sale.id} className="rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900">{sale.name[lang] || sale.name.en}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {isActive ? `${daysLeft} days left` : "Ended"}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {sale.description?.[lang] || sale.description?.en || `Get ${sale.discount_percent}% off on selected items`}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-bold text-recette-600">
                        {sale.discount_percent}%
                      </span>
                      <span className="text-sm text-neutral-600">OFF</span>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {startsAt.toLocaleDateString()} - {endsAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
          <p className="text-neutral-500">No active sales at the moment.</p>
        </div>
      )}
    </div>
  );
}

// Jobs section
default async function JobsSection({ supermarketId, lang }: { supermarketId: string; lang: "en" | "es" }) {
  const jobs = await getSupermarketJobs(supermarketId);
  
  const positionTypeLabels: Record<string, { en: string; es: string }> = {
    full_time: { en: "Full-time", es: "Tiempo completo" },
    part_time: { en: "Part-time", es: "Tiempo parcial" },
    temporary: { en: "Temporary", es: "Temporal" },
    contract: { en: "Contract", es: "Contrato" },
    internship: { en: "Internship", es: "Prácticas" },
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Job Openings</h2>
        {jobs.length > 0 && (
          <Link
            href={`/${lang}/supermarkets/${supermarketId}/jobs`}
            className="text-sm text-recette-600 hover:text-recette-700 font-medium"
          >
            View All
          </Link>
        )}
      </div>
      
      {jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => {
            const positionLabel = positionTypeLabels[job.position_type]?.[lang] || job.position_type;
            
            return (
              <div key={job.id} className="rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-6 w-6 text-recette-600" />
                      <h3 className="font-semibold text-neutral-900">{job.title[lang] || job.title.en}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs">
                        {positionLabel}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {job.description[lang] || job.description.en}
                    </p>
                    {job.salary_range && (
                      <p className="text-sm text-neutral-500 mt-2">
                        <span className="font-semibold">Salary:</span> {job.salary_range[lang] || job.salary_range.en}
                      </p>
                    )}
                    {job.contact_email && (
                      <p className="text-sm text-neutral-500 mt-1">
                        <span className="font-semibold">Contact:</span> {job.contact_email}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.requirements?.map((req, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-recette-50 text-recette-700 text-xs">
                          {req}
                        </span>
                      ))}
                    </div>
                    {job.benefits && job.benefits.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900 mb-1">Benefits:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.benefits.map((benefit, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                              ✓ {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {job.application_url ? (
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-recette-600 text-white hover:bg-recette-700 text-sm font-semibold transition-colors"
                      >
                        Apply Now
                      </a>
                    ) : job.application_email ? (
                      <a
                        href={`mailto:${job.application_email}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-recette-600 text-white hover:bg-recette-700 text-sm font-semibold transition-colors"
                      >
                        Apply via Email
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Briefcase className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
          <p className="text-neutral-500">No job openings at the moment.</p>
        </div>
      )}
    </div>
  );
}

// Tab content component
default function TabContent({
  activeTab,
  supermarket,
  lang,
}: {
  activeTab: TabType;
  supermarket: SupermarketProfile;
  lang: "en" | "es";
}) {
  switch (activeTab) {
    case "about":
      return <AboutSection supermarket={supermarket} />;
    case "products":
      return <ProductsSection supermarketId={supermarket.id} lang={lang} />;
    case "coupons":
      return <CouponsSection supermarketId={supermarket.id} lang={lang} />;
    case "bundles":
      return <BundlesSection supermarketId={supermarket.id} lang={lang} />;
    case "sales":
      return <SalesSection supermarketId={supermarket.id} lang={lang} />;
    case "jobs":
      return <JobsSection supermarketId={supermarket.id} lang={lang} />;
    default:
      return <AboutSection supermarket={supermarket} />;
  }
}

export default async function SupermarketProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: TabType }>;
}) {
  const { locale, id } = await params;
  const { tab: searchTab } = await searchParams;
  
  setRequestLocale(locale);
  
  // Get user session for follow status
  const sb = getSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id;
  
  // Fetch supermarket data
  const supermarket = await getSupermarketById(id, userId);
  
  if (!supermarket) notFound();
  
  const t = await getTranslations("common");
  const lang = locale as "en" | "es" | "fr" | "ar";
  
  // Determine active tab
  const activeTab: TabType = searchTab && tabConfig.some((t) => t.id === searchTab) ? searchTab : "about";
  
  // Get follower count (mock for now)
  const followerCount = supermarket.follower_count || 0;
  
  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: supermarket.supermarket_name[lang] || supermarket.supermarket_name.en,
    description: supermarket.description?.[lang] || supermarket.description?.en,
    address: supermarket.address && {
      "@type": "PostalAddress",
      streetAddress: supermarket.address.line1,
      addressLocality: supermarket.address.city,
      addressRegion: supermarket.address.state,
      postalCode: supermarket.address.postal_code,
      addressCountry: supermarket.address.country,
    },
    telephone: supermarket.phone,
    url: supermarket.website,
    openingHours: supermarket.opening_hours?.map((h) => h.opens + "-" + h.closes).join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Profile Header */}
      <div className="relative bg-neutral-50">
        {/* Banner */}
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
          {supermarket.banner_url ? (
            <Image
              src={supermarket.banner_url}
              alt={supermarket.supermarket_name[lang] || "Supermarket banner"}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-recette-100 to-recette-200" />
          )}
        </div>
        
        {/* Profile Picture and Info */}
        <div className="relative -mt-16 md:-mt-20 lg:-mt-24 px-4 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {supermarket.profile_picture_url ? (
                  <Image
                    src={supermarket.profile_picture_url}
                    alt={supermarket.supermarket_name[lang] || "Supermarket"}
                    width={128}
                    height={128}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    priority
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-recette-100 flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-recette-600" />
                  </div>
                )}
              </div>
              
              {/* Supermarket Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-neutral-900">
                    {supermarket.supermarket_name[lang] || supermarket.supermarket_name.en}
                  </h1>
                  {/* Verified Badge */}
                  {supermarket.subscription_status === "active" && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium"
                      title="Verified Supermarket"
                    >
                      ✓ Verified
                    </span>
                  )}
                </div>
                
                {/* Tagline */}
                {supermarket.description && (
                  <p className="text-neutral-600 mt-2 max-w-2xl">
                    {supermarket.description[lang] || supermarket.description.en}
                  </p>
                )}
                
                {/* Follower Count and Actions */}
                <div className="flex flex-wrap items-center gap-4 mt-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-neutral-500" />
                    <span className="text-neutral-600">
                      {followerCount.toLocaleString()} {followerCount === 1 ? "follower" : "followers"}
                    </span>
                  </div>
                  <FollowButton supermarketId={supermarket.id} isFollowed={supermarket.is_followed || false} userId={userId} />
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm font-semibold transition-colors">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
                
                {/* Category Tags */}
                {supermarket.category_tags && supermarket.category_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {supermarket.category_tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-recette-50 text-recette-700 text-sm font-medium"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="sticky top-16 z-10 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto -mx-4 px-4">
            {tabConfig.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`?tab=${tab.id}`}
                  scroll={false}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                    isActive
                      ? "border-recette-600 text-recette-600 font-semibold"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label[lang] || tab.label.en}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TabContent activeTab={activeTab} supermarket={supermarket} lang={lang} />
      </div>
    </>
  );
}
