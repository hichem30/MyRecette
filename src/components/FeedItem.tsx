"use client";

import { ShoppingBag, TrendingUp, Tag, Ticket, Package, Briefcase } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { SupermarketFeedItem } from "@/lib/types";

// Feed item icon mapping
const feedIcons: Record<string, React.ReactNode> = {
  new_product: <ShoppingBag className="h-5 w-5" />,
  price_change: <TrendingUp className="h-5 w-5" />,
  sale_start: <Tag className="h-5 w-5" />,
  coupon_added: <Ticket className="h-5 w-5" />,
  bundle_added: <Package className="h-5 w-5" />,
  job_posted: <Briefcase className="h-5 w-5" />,
};

// Feed item label mapping
const feedLabels: Record<string, { en: string; es: string }> = {
  new_product: { en: "New Product", es: "Producto Nuevo" },
  price_change: { en: "Price Change", es: "Cambio de Precio" },
  sale_start: { en: "Sale Started", es: "Oferta Iniciada" },
  coupon_added: { en: "New Coupon", es: "Nuevo Cupón" },
  bundle_added: { en: "New Bundle", es: "Nuevo Paquete" },
  job_posted: { en: "Job Posted", es: "Empleo Publicado" },
};

// Format date relative to now
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "just now";
  }
}

// Feed item component
export default function FeedItem({ item, lang }: { item: SupermarketFeedItem; lang: "en" | "es" }) {
  const type = item.type;
  const icon = feedIcons[type] || <ShoppingBag className="h-5 w-5" />;
  const label = feedLabels[type]?.[lang] || type;
  
  return (
    <article className="flex gap-4 p-4 rounded-lg border border-neutral-200 hover:shadow-sm transition-shadow">
      {/* Supermarket Avatar */}
      <div className="flex-shrink-0">
        {item.supermarket?.profile_picture_url ? (
          <img
            src={item.supermarket.profile_picture_url}
            alt={item.supermarket.supermarket_name[lang] || "Supermarket"}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-barn-100 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-barn-600" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-neutral-900">
            {item.supermarket?.supermarket_name?.[lang] || item.supermarket?.supermarket_name?.en || "Supermarket"}
          </span>
          <span className="flex items-center gap-1 text-neutral-500 text-sm">
            {icon}
            <span>{label}</span>
          </span>
          <span className="text-neutral-500 text-sm">
            {formatRelativeDate(item.created_at)}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="font-semibold text-neutral-900 mt-1">
          {item.title[lang] || item.title.en}
        </h3>
        
        {/* Description */}
        {item.description && (
          <p className="text-neutral-600 text-sm mt-1">
            {item.description[lang] || item.description.en}
          </p>
        )}
        
        {/* Image */}
        {item.image_url && (
          <div className="mt-3">
            <img
              src={item.image_url}
              alt={item.title[lang] || item.title.en || ""}
              className="w-full max-w-md rounded-lg object-cover aspect-video"
            />
          </div>
        )}
        
        {/* Action Button */}
        <div className="mt-3">
          <Link
            href={item.action_url}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-barn-50 text-barn-700 hover:bg-barn-100 text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}