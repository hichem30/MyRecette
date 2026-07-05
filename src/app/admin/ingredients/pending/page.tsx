"use client";

import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  MoreVertical,
  Search,
  Sparkles,
  Tag,
  Trash2,
  XCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface PendingMapping {
  id: string;
  product_id: string;
  product_name: string;
  supermarket_id: string | null;
  supermarket_name: string | null;
  suggested_ingredient_id: string | null;
  suggested_ingredient_name: string;
  confidence: number;
  status: "pending" | "approved" | "rejected" | "ignored";
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  notes: string | null;
}

interface Ingredient {
  id: string;
  canonical_name: string;
  display_name: Record<string, string>;
  category: string;
  subcategory: string | null;
}

interface Product {
  id: string;
  name: Record<string, string>;
  slug: string;
}

export default function AdminIngredientsPendingPage() {
  const [pendingMappings, setPendingMappings] = useState<PendingMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [ingredients, setIngredients] = useState<Record<string, Ingredient>>({});
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    const pending = pendingMappings.filter((m) => m.status === "pending").length;
    const approved = pendingMappings.filter((m) => m.status === "approved").length;
    const rejected = pendingMappings.filter((m) => m.status === "rejected").length;
    const ignored = pendingMappings.filter((m) => m.status === "ignored").length;
    return { pending, approved, rejected, ignored, total: pending + approved + rejected + ignored };
  }, [pendingMappings]);

  // Categories from ingredients
  const categories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(ingredients).forEach((i) => cats.add(i.category));
    return Array.from(cats).sort();
  }, [ingredients]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const sb = getSupabaseBrowserClient();
    
    Promise.all([
      // Fetch pending mappings
      sb
        .from("pending_ingredient_mappings")
        .select(
          `id, product_id, supermarket_id, suggested_ingredient_id, suggested_ingredient_name, confidence, status, created_at, resolved_by, resolved_at, notes, 
           products:product_id(id, name, slug),
           supermarkets:supermarket_id(id, supermarket_name), 
           ingredients:suggested_ingredient_id(id, canonical_name, display_name, category, subcategory)`
        )
        .order("created_at", { ascending: false }),
      // Fetch all ingredients
      sb.from("ingredients").select("id, canonical_name, display_name, category, subcategory"),
      // Fetch all products
      sb.from("products").select("id, name, slug"),
    ]).then(([mappingsRes, ingredientsRes, productsRes]) => {
      const mappings = (mappingsRes.data as unknown as Array<{
        id: string;
        product_id: string;
        supermarket_id: string | null;
        suggested_ingredient_id: string | null;
        suggested_ingredient_name: string;
        confidence: number;
        status: string;
        created_at: string;
        resolved_by: string | null;
        resolved_at: string | null;
        notes: string | null;
        products: Product | null;
        supermarkets: { id: string; supermarket_name: Record<string, string> } | null;
        ingredients: Ingredient | null;
      }>) ?? [];

      const ingredientsMap: Record<string, Ingredient> = {};
      ((ingredientsRes.data as Ingredient[]) ?? []).forEach((i) => {
        ingredientsMap[i.id] = i;
      });

      const productsMap: Record<string, Product> = {};
      ((productsRes.data as Product[]) ?? []).forEach((p) => {
        productsMap[p.id] = p;
      });

      const processedMappings: PendingMapping[] = mappings.map((m) => ({
        id: m.id,
        product_id: m.product_id,
        product_name: m.products?.name?.en ?? "Unknown Product",
        supermarket_id: m.supermarket_id,
        supermarket_name: m.supermarkets?.supermarket_name?.en ?? null,
        suggested_ingredient_id: m.suggested_ingredient_id,
        suggested_ingredient_name: m.suggested_ingredient_name ?? m.ingredients?.canonical_name ?? "Unknown",
        confidence: m.confidence,
        status: m.status as "pending" | "approved" | "rejected" | "ignored",
        created_at: m.created_at,
        resolved_by: m.resolved_by,
        resolved_at: m.resolved_at,
        notes: m.notes,
      }));

      setPendingMappings(processedMappings);
      setIngredients(ingredientsMap);
      setProducts(productsMap);
      setLoading(false);
    });
  }, []);

  const filteredMappings = useMemo(() => {
    return pendingMappings.filter((m) => {
      // Status filter
      if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const productName = m.product_name.toLowerCase();
        const ingredientName = m.suggested_ingredient_name.toLowerCase();
        const supermarketName = m.supermarket_name?.toLowerCase() ?? "";
        
        if (!productName.includes(query) && 
            !ingredientName.includes(query) && 
            !supermarketName.includes(query)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && m.suggested_ingredient_id) {
        const ingredient = ingredients[m.suggested_ingredient_id];
        if (ingredient?.category !== categoryFilter) {
          return false;
        }
      }

      return true;
    });
  }, [pendingMappings, searchQuery, statusFilter, categoryFilter, ingredients]);

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMappings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMappings.map((m) => m.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Individual actions
  async function handleApprove(id: string) {
    if (!isSupabaseConfigured()) {
      setPendingMappings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "approved" } : m))
      );
      return;
    }

    setActionInProgress(id);
    const sb = getSupabaseBrowserClient();
    
    try {
      // First, create the product_ingredients mapping
      const mappingToApprove = pendingMappings.find((m) => m.id === id);
      if (mappingToApprove?.suggested_ingredient_id && mappingToApprove.product_id) {
        const { error: mappingError } = await sb
          .from("product_ingredients")
          .insert([
            {
              product_id: mappingToApprove.product_id,
              ingredient_id: mappingToApprove.suggested_ingredient_id,
              mapping_method: "admin",
              confidence: 1.0,
              is_primary: false,
            },
          ]);

        if (mappingError) {
          throw mappingError;
        }
      }

      // Update the pending mapping status
      const { error } = await sb
        .from("pending_ingredient_mappings")
        .update({
          status: "approved",
          resolved_by: (await sb.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setPendingMappings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "approved" } : m))
      );
    } catch (error) {
      alert(`Failed to approve: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleReject(id: string, reason?: string) {
    if (!isSupabaseConfigured()) {
      setPendingMappings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "rejected", notes: reason ?? m.notes } : m))
      );
      return;
    }

    setActionInProgress(id);
    const sb = getSupabaseBrowserClient();
    
    try {
      const { error } = await sb
        .from("pending_ingredient_mappings")
        .update({
          status: "rejected",
          resolved_by: (await sb.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
          notes: reason,
        })
        .eq("id", id);

      if (error) throw error;

      setPendingMappings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "rejected", notes: reason ?? m.notes } : m))
      );
    } catch (error) {
      alert(`Failed to reject: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleIgnore(id: string) {
    if (!isSupabaseConfigured()) {
      setPendingMappings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "ignored" } : m))
      );
      return;
    }

    setActionInProgress(id);
    const sb = getSupabaseBrowserClient();
    
    try {
      const { error } = await sb
        .from("pending_ingredient_mappings")
        .update({
          status: "ignored",
          resolved_by: (await sb.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setPendingMappings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "ignored" } : m))
      );
    } catch (error) {
      alert(`Failed to ignore: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionInProgress(null);
    }
  }

  // Bulk actions
  async function handleBulkAction(action: "approve" | "reject" | "ignore") {
    if (selectedIds.size === 0) {
      alert("Please select at least one mapping");
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedIds.size} selected mapping(s)?`)) {
      return;
    }

    if (!isSupabaseConfigured()) {
      setPendingMappings((prev) =>
        prev.map((m) => ({
          ...m,
          status: selectedIds.has(m.id) ? action : m.status,
        }))
      );
      setSelectedIds(new Set());
      return;
    }

    setActionInProgress("bulk");
    const sb = getSupabaseBrowserClient();
    const userId = (await sb.auth.getUser()).data.user?.id;
    
    try {
      // Handle each selected mapping
      for (const id of Array.from(selectedIds)) {
        const mapping = pendingMappings.find((m) => m.id === id);
        
        if (action === "approve" && mapping?.suggested_ingredient_id && mapping.product_id) {
          // Create product_ingredients mapping
          await sb
            .from("product_ingredients")
            .insert([
              {
                product_id: mapping.product_id,
                ingredient_id: mapping.suggested_ingredient_id,
                mapping_method: "admin",
                confidence: 1.0,
                is_primary: false,
              },
            ]);
        }

        // Update pending mapping status
        await sb
          .from("pending_ingredient_mappings")
          .update({
            status: action,
            resolved_by: userId,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", id);
      }

      // Refresh all data
      const [mappingsRes] = await Promise.all([
        sb
          .from("pending_ingredient_mappings")
          .select(
            `id, product_id, supermarket_id, suggested_ingredient_id, suggested_ingredient_name, confidence, status, created_at, resolved_by, resolved_at, notes, 
             products:product_id(id, name, slug),
             supermarkets:supermarket_id(id, supermarket_name), 
             ingredients:suggested_ingredient_id(id, canonical_name, display_name, category, subcategory)`
          )
          .order("created_at", { ascending: false }),
      ]);

      const processedMappings: PendingMapping[] = (mappingsRes.data as unknown as Array<{
        id: string;
        product_id: string;
        supermarket_id: string | null;
        suggested_ingredient_id: string | null;
        suggested_ingredient_name: string;
        confidence: number;
        status: string;
        created_at: string;
        resolved_by: string | null;
        resolved_at: string | null;
        notes: string | null;
        products: Product | null;
        supermarkets: { id: string; supermarket_name: Record<string, string> } | null;
        ingredients: Ingredient | null;
      }>)?.map((m) => ({
        id: m.id,
        product_id: m.product_id,
        product_name: m.products?.name?.en ?? "Unknown Product",
        supermarket_id: m.supermarket_id,
        supermarket_name: m.supermarkets?.supermarket_name?.en ?? null,
        suggested_ingredient_id: m.suggested_ingredient_id,
        suggested_ingredient_name: m.suggested_ingredient_name ?? m.ingredients?.canonical_name ?? "Unknown",
        confidence: m.confidence,
        status: m.status as "pending" | "approved" | "rejected" | "ignored",
        created_at: m.created_at,
        resolved_by: m.resolved_by,
        resolved_at: m.resolved_at,
        notes: m.notes,
      })) ?? [];

      setPendingMappings(processedMappings);
      setSelectedIds(new Set());
    } catch (error) {
      alert(`Failed to ${action}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionInProgress(null);
    }
  }

  // Get ingredient info for a mapping
  const getIngredientInfo = (mapping: PendingMapping) => {
    if (mapping.suggested_ingredient_id) {
      return ingredients[mapping.suggested_ingredient_id];
    }
    return null;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-emerald-50 text-emerald-700";
    if (confidence >= 0.7) return "bg-amber-50 text-amber-700";
    if (confidence >= 0.5) return "bg-orange-50 text-orange-700";
    return "bg-red-50 text-red-700";
  };

  // Get confidence label
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Medium";
    if (confidence >= 0.5) return "Low";
    return "Very Low";
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700";
      case "rejected":
        return "bg-red-50 text-red-700";
      case "ignored":
        return "bg-neutral-100 text-neutral-500";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "rejected":
        return <XCircle className="h-3.5 w-3.5" />;
      case "ignored":
        return <Eye className="h-3.5 w-3.5" />;
      default:
        return <Clock className="h-3.5 w-3.5" />;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Toggle expanded row
  const toggleExpanded = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-neutral-500">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Loading pending ingredient mappings...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Pending Ingredient Mappings</h1>
          <p className="text-sm text-neutral-500">
            Review and manage ingredient mappings that need approval
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700">
          <Clock className="h-4 w-4" />
          <span className="font-bold">{stats.pending}</span>
          <span className="text-xs uppercase tracking-wide">Pending</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          <span className="font-bold">{stats.approved}</span>
          <span className="text-xs uppercase tracking-wide">Approved</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700">
          <XCircle className="h-4 w-4" />
          <span className="font-bold">{stats.rejected}</span>
          <span className="text-xs uppercase tracking-wide">Rejected</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-neutral-500">
          <Eye className="h-4 w-4" />
          <span className="font-bold">{stats.ignored}</span>
          <span className="text-xs uppercase tracking-wide">Ignored</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-1 gap-2">
          <label htmlFor="search" className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Search className="h-3.5 w-3.5" /> Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search products, ingredients, or supermarkets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-recette-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="status" className="text-xs text-neutral-500">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-recette-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="category" className="text-xs text-neutral-500">
            Category
          </label>
          <select
            id="category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-recette-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-md border border-recette-200 bg-recette-50 px-3 py-2 text-recette-700">
            <span className="text-xs font-bold">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs hover:text-recette-900"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleBulkAction("approve")}
              disabled={actionInProgress === "bulk"}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve All
            </button>
            <button
              onClick={() => handleBulkAction("reject")}
              disabled={actionInProgress === "bulk"}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject All
            </button>
            <button
              onClick={() => handleBulkAction("ignore")}
              disabled={actionInProgress === "bulk"}
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5" />
              Ignore All
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="mb-4 text-sm text-neutral-500">
        Showing {filteredMappings.length} of {stats.total} mappings
        {searchQuery && ` matching "${searchQuery}"`}
        {statusFilter !== "all" && ` with status "${statusFilter}"`}
        {categoryFilter !== "all" && ` in category "${categoryFilter}"`}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredMappings.length && filteredMappings.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-neutral-300 text-recette-600 focus:ring-recette-500"
                  disabled={filteredMappings.length === 0}
                />
              </th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Suggested Ingredient</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredMappings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-400">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 text-neutral-300" />
                    <span>No mappings found matching your criteria</span>
                    <span className="text-xs text-neutral-500">
                      Try adjusting your filters or search query
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMappings.map((mapping) => {
                const ingredient = getIngredientInfo(mapping);
                const isSelected = selectedIds.has(mapping.id);
                const isExpanded = expandedRow === mapping.id;
                const isDisabled = actionInProgress === mapping.id || actionInProgress === "bulk";

                return (
                  <tr
                    key={mapping.id}
                    className={isSelected ? "bg-recette-50" : "hover:bg-neutral-50"}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(mapping.id)}
                        className="h-4 w-4 rounded border-neutral-300 text-recette-600 focus:ring-recette-500"
                        disabled={mapping.status !== "pending"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{mapping.product_name}</div>
                      {mapping.supermarket_name && (
                        <div className="text-xs text-neutral-500">
                          {mapping.supermarket_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="font-medium">{mapping.suggested_ingredient_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {ingredient?.category ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${getConfidenceColor(
                          mapping.confidence
                        )}`}
                      >
                        {(mapping.confidence * 100).toFixed(0)}% {getConfidenceLabel(mapping.confidence)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${getStatusColor(
                          mapping.status
                        )}`}
                      >
                        {getStatusIcon(mapping.status)}
                        {mapping.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(mapping.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                        {mapping.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(mapping.id)}
                              disabled={isDisabled}
                              title="Approve mapping"
                              className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("Reason for rejection (optional):");
                                if (reason !== null) {
                                  handleReject(mapping.id, reason || undefined);
                                }
                              }}
                              disabled={isDisabled}
                              title="Reject mapping"
                              className="rounded-md p-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleIgnore(mapping.id)}
                              disabled={isDisabled}
                              title="Ignore mapping"
                              className="rounded-md p-1.5 text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {mapping.notes && (
                          <button
                            onClick={() => toggleExpanded(mapping.id)}
                            title="View notes"
                            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                        {products[mapping.product_id] && (
                          <a
                            href={`/en/products/${products[mapping.product_id]?.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View product"
                            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded row details */}
      {expandedRow && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-800">Notes</h3>
            <button
              onClick={() => setExpandedRow(null)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">
            {pendingMappings.find((m) => m.id === expandedRow)?.notes ?? "No notes"}
          </p>
        </div>
      )}

      {/* Empty state for no pending items */}
      {filteredMappings.length === 0 && stats.pending === 0 && statusFilter === "pending" && (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="mt-3 text-sm font-bold text-emerald-800">All caught up!</h3>
          <p className="mt-1 text-sm text-emerald-700">
            No pending ingredient mappings require your attention.
          </p>
          <p className="mt-2 text-xs text-emerald-600">
            New mappings will appear here as supermarkets upload products.
          </p>
        </div>
      )}

      {!isSupabaseConfigured() && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Read‑only mode.</strong> Mappings cannot be approved or rejected without Supabase.
        </div>
      )}
    </div>
  );
}
