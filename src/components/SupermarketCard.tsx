"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { SupermarketProfile } from "@/lib/types";

// Supermarket card component
export default function SupermarketCard({
  supermarket,
  lang,
}: {
  supermarket: SupermarketProfile;
  lang: "en" | "es";
}) {
  const name = supermarket.supermarket_name[lang] || supermarket.supermarket_name.en || "Supermarket";
  const description = supermarket.description?.[lang] || supermarket.description?.en || "";
  const address = supermarket.address ? [
    supermarket.address.line1,
    supermarket.address.city,
    supermarket.address.state,
  ].filter(Boolean).join(", ") : "";
  
  const categoryTags = supermarket.category_tags || [];
  const followerCount = supermarket.follower_count || 0;
  const isVerified = supermarket.subscription_status === "active";

  return (
    <Link
      href={`/${lang}/supermarkets/${supermarket.id}`}
      className="block rounded-xl overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow"
    >
      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        {supermarket.banner_url ? (
          <img
            src={supermarket.banner_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-recette-100 to-recette-200" />
        )}
        
        {/* Profile Picture */}
        <div className="absolute -bottom-6 left-4">
          {supermarket.profile_picture_url ? (
            <img
              src={supermarket.profile_picture_url}
              alt={name}
              className="w-16 h-16 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-white bg-recette-100 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-recette-600" />
            </div>
          )}
        </div>
        
        {/* Verified Badge */}
        {isVerified && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
              ✓ Verified
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 pt-8">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900">{name}</h3>
            {description && (
              <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{description}</p>
            )}
            {address && (
              <p className="text-sm text-neutral-500 mt-1">{address}</p>
            )}
          </div>
        </div>
        
        {/* Tags */}
        {categoryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {categoryTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-recette-50 text-recette-700 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <ShoppingBag className="h-4 w-4" />
            <span>{followerCount.toLocaleString()} followers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}