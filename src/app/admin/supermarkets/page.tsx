"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Search, TrendingUp, Users, Package, Ticket, Briefcase, MoreVertical, Pencil, Trash2, Eye, Check, X } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SupermarketProfile } from "@/lib/types";

// Mock data for local development
const mockSupermarkets: SupermarketProfile[] = [
  {
    id: "sm-1",
    email: "info@freshmart.com",
    is_supermarket: true,
    supermarket_name: { en: "FreshMart Supermarket", es: "Supermercado FreshMart" },
    description: { en: "Your neighborhood grocery store", es: "Tu tienda de comestibles del barrio" },
    banner_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
    profile_picture_url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=200&q=80",
    address: { line1: "123 Main Street", city: "San Francisco", state: "CA", postal_code: "94102", country: "USA" },
    location_geometry: null,
    phone: "+1-415-555-0123",
    subscription_status: "active",
    follower_count: 1250,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-07-01T00:00:00Z",
  },
  {
    id: "sm-2",
    email: "hello@greengrocer.com",
    is_supermarket: true,
    supermarket_name: { en: "GreenGrocer Market", es: "Mercado GreenGrocer" },
    description: { en: "Organic and sustainable groceries", es: "Productos orgánicos y sostenibles" },
    banner_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?auto=format&fit=crop&w=1200&q=80",
    profile_picture_url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80",
    address: { line1: "456 Oak Avenue", city: "San Francisco", state: "CA", postal_code: "94103", country: "USA" },
    location_geometry: null,
    phone: "+1-415-555-0456",
    subscription_status: "active",
    follower_count: 890,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-07-02T00:00:00Z",
  },
];

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "emerald" },
    inactive: { label: "Inactive", color: "neutral" },
    trialing: { label: "Trialing", color: "amber" },
    past_due: { label: "Past Due", color: "red" },
    canceled: { label: "Canceled", color: "neutral" },
  };
  
  const { label, color } = variants[status] || variants.inactive;
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-800",
    neutral: "bg-neutral-100 text-neutral-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-${color}-600`} />
      {label}
    </span>
  );
}

// Supermarket row component
function SupermarketRow({ supermarket, index }: { supermarket: SupermarketProfile; index: number }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
      <td className="px-4 py-3 text-sm text-neutral-500">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {supermarket.profile_picture_url ? (
            <img
              src={supermarket.profile_picture_url}
              alt={supermarket.supermarket_name.en || "Supermarket"}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-barn-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-barn-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-neutral-900">{supermarket.supermarket_name.en || supermarket.supermarket_name.es}</p>
            <p className="text-xs text-neutral-500">{supermarket.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600">
        {supermarket.address?.city}, {supermarket.address?.state}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={supermarket.subscription_status} />
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600">
        {supermarket.follower_count?.toLocaleString() || "0"}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500">
        {new Date(supermarket.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-neutral-500" />
          </button>
          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-white border border-neutral-200 shadow-lg py-1 z-50">
              <Link
                href={`/admin/supermarkets/${supermarket.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Eye className="h-4 w-4" /> View
              </Link>
              <Link
                href={`/admin/supermarkets/${supermarket.id}/edit`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <Link
                href={`/admin/supermarkets/${supermarket.id}/bulk-upload`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Package className="h-4 w-4" /> Bulk Upload
              </Link>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// Stats cards
function StatsCards({ supermarkets }: { supermarkets: SupermarketProfile[] }) {
  const total = supermarkets.length;
  const active = supermarkets.filter((s) => s.subscription_status === "active").length;
  const inactive = supermarkets.filter((s) => s.subscription_status !== "active").length;
  const totalFollowers = supermarkets.reduce((sum, s) => sum + (s.follower_count || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Total Supermarkets</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-barn-50 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-barn-600" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{active}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Inactive</p>
            <p className="mt-1 text-2xl font-bold text-neutral-600">{inactive}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center">
            <X className="h-5 w-5 text-neutral-600" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Total Followers</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{totalFollowers.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSupermarketsPage() {
  const [supermarkets, setSupermarkets] = useState<SupermarketProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setSupermarkets(mockSupermarkets);
        setLoading(false);
        return;
      }

      const sb = getSupabaseBrowserClient();
      
      try {
        const { data, error } = await sb
          .from("profiles")
          .select(
            "id, email, is_supermarket, supermarket_name, description, banner_url, profile_picture_url, " +
            "address, location_geometry, phone, website, social_links, opening_hours, category_tags, " +
            "subscription_status, subscription_start_date, subscription_end_date, created_at, updated_at"
          )
          .eq("is_supermarket", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Add follower counts
        const withFollowers = await Promise.all(
          (data as any[] || []).map(async (sm: any) => {
            const { count: followers } = await sb
              .from("supermarket_follows")
              .select("*", { count: "exact", head: true })
              .eq("supermarket_id", sm.id);
            return { ...sm, follower_count: followers ?? 0 } as SupermarketProfile;
          })
        );

        setSupermarkets(withFollowers);
      } catch (error) {
        console.error("Error loading supermarkets:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Filter supermarkets
  const filteredSupermarkets = supermarkets.filter((sm) => {
    const matchesSearch = !searchQuery || 
      sm.supermarket_name.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sm.supermarket_name.es?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sm.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || sm.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">Supermarkets</h1>
        <p className="text-sm text-neutral-600">
          Manage all supermarkets on sucre et sel. Supermarkets pay €50/month for their subscription.
        </p>
      </div>

      {/* Stats */}
      <StatsCards supermarkets={supermarkets} />

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search supermarkets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 rounded-lg border border-neutral-300 text-sm bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-barn-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="px-3 py-2 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-barn-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        <Link
          href="/admin/supermarkets/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-barn-600 text-white hover:bg-barn-700 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Supermarket
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Supermarket</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Followers</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">
                  Loading...
                </td>
              </tr>
            ) : filteredSupermarkets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">
                  No supermarkets found
                </td>
              </tr>
            ) : (
              filteredSupermarkets.map((supermarket, index) => (
                <SupermarketRow key={supermarket.id} supermarket={supermarket} index={index} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Empty state for no supermarkets */}
      {supermarkets.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <Building2 className="h-12 w-12 text-neutral-300" />
            <p className="text-sm text-neutral-500">No supermarkets yet</p>
            <Link
              href="/admin/supermarkets/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-barn-600 text-white hover:bg-barn-700 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" /> Add First Supermarket
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
