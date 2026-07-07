"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ShoppingBag, Plus, Trash2, Edit2, CheckSquare, Square, MoreVertical } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  product_id: string | null;
  ingredient_id: string | null;
  custom_name: string | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  is_checked: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: Record<string, string>;
    image_url: string | null;
    price: number;
    category_slug: string;
  };
  ingredient?: {
    id: string;
    canonical_name: string;
    display_name: Record<string, string>;
    category: string;
  };
}

// Mock data for local development
const mockShoppingLists: ShoppingList[] = [
  {
    id: "sl-1",
    user_id: "user-1",
    name: "Weekly Groceries",
    description: "Essential items for this week's meals",
    is_public: false,
    share_token: null,
    created_at: "2024-07-01T09:00:00Z",
    updated_at: "2024-07-05T14:30:00Z",
    item_count: 8
  },
  {
    id: "sl-2",
    user_id: "user-1",
    name: "BBQ Party",
    description: "Ingredients for weekend BBQ",
    is_public: false,
    share_token: null,
    created_at: "2024-07-02T10:00:00Z",
    updated_at: "2024-07-04T11:00:00Z",
    item_count: 12
  },
  {
    id: "sl-3",
    user_id: "user-1",
    name: "Baking Supplies",
    description: "Flour, sugar, and other baking essentials",
    is_public: false,
    share_token: null,
    created_at: "2024-06-28T15:00:00Z",
    updated_at: "2024-06-28T15:00:00Z",
    item_count: 5
  }
];

const mockShoppingListItems: Record<string, ShoppingListItem[]> = {
  "sl-1": [
    {
      id: "sli-1",
      shopping_list_id: "sl-1",
      product_id: "p-tomato",
      ingredient_id: "i-tomato",
      custom_name: null,
      quantity: 5,
      unit: "kg",
      notes: "Organic if available",
      is_checked: true,
      position: 1,
      created_at: "2024-07-01T09:00:00Z",
      updated_at: "2024-07-05T10:00:00Z",
      product: {
        id: "p-tomato",
        name: { en: "Organic Tomatoes", es: "Tomates Orgánicos" },
        image_url: "https://images.unsplash.com/photo-1592841200221-21e7500398b3?auto=format&fit=crop&w=100&q=80",
        price: 2.99,
        category_slug: "produce"
      },
      ingredient: {
        id: "i-tomato",
        canonical_name: "tomato",
        display_name: { en: "Tomato", es: "Tomate" },
        category: "vegetable"
      }
    },
    {
      id: "sli-2",
      shopping_list_id: "sl-1",
      product_id: null,
      ingredient_id: "i-onion",
      custom_name: null,
      quantity: 3,
      unit: "kg",
      notes: "Yellow onions",
      is_checked: false,
      position: 2,
      created_at: "2024-07-01T09:00:00Z",
      updated_at: "2024-07-01T09:00:00Z",
      ingredient: {
        id: "i-onion",
        canonical_name: "onion",
        display_name: { en: "Onion", es: "Cebolla" },
        category: "vegetable"
      }
    }
  ],
  "sl-2": [
    {
      id: "sli-3",
      shopping_list_id: "sl-2",
      product_id: null,
      ingredient_id: null,
      custom_name: "Chicken breasts",
      quantity: 2,
      unit: "kg",
      notes: "Boneless, skinless",
      is_checked: false,
      position: 1,
      created_at: "2024-07-02T10:00:00Z",
      updated_at: "2024-07-02T10:00:00Z"
    },
    {
      id: "sli-4",
      shopping_list_id: "sl-2",
      product_id: null,
      ingredient_id: "i-bbq-sauce",
      custom_name: null,
      quantity: 1,
      unit: "bottle",
      notes: "Sweet & spicy",
      is_checked: true,
      position: 2,
      created_at: "2024-07-02T10:00:00Z",
      updated_at: "2024-07-04T14:00:00Z",
      ingredient: {
        id: "i-bbq-sauce",
        canonical_name: "bbq sauce",
        display_name: { en: "BBQ Sauce", es: "Salsa Barbacoa" },
        category: "condiment"
      }
    }
  ]
};

// Format date for display
function formatDate(dateString: string | null | undefined, lang: string): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return lang === "en" ? "Today" : lang === "es" ? "Hoy" : lang === "fr" ? "Aujourd'hui" : "اليوم";
  } else if (diffDays === 1) {
    return lang === "en" ? "Yesterday" : lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : "أمس";
  } else if (diffDays < 7) {
    return lang === "en" 
      ? `${diffDays} days ago` 
      : lang === "es" 
        ? `hace ${diffDays} días` 
        : lang === "fr" 
          ? `il y a ${diffDays} jours` 
          : `قبل ${diffDays} أيام`;
  }
  
  return date.toLocaleDateString(lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-EG" : lang === "es" ? "es-ES" : "en-US");
}

export default function ShoppingListsPage() {
  const locale = useLocale();
  const t = useTranslations("ShoppingLists");
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingNewList, setCreatingNewList] = useState(false);
  const [newListName, setNewListName] = useState("");

  const sb = getSupabaseBrowserClient();

  // Fetch shopping lists
  useEffect(() => {
    fetchShoppingLists();
  }, []);

  // Fetch items when a list is selected
  useEffect(() => {
    if (selectedList) {
      fetchShoppingListItems(selectedList.id);
    }
  }, [selectedList]);

  async function fetchShoppingLists() {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        setShoppingLists(mockShoppingLists);
        setLoading(false);
        return;
      }

      const { data: { user }, error: userError } = await sb.auth.getUser();

      if (userError || !user) {
        setError(t("pleaseSignIn"));
        setLoading(false);
        return;
      }

      const { data, error } = await sb
        .from("shopping_lists")
        .select(
          "id, user_id, name, description, is_public, share_token, created_at, updated_at"
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Add item counts
      const listsWithCounts = data?.map(list => ({
        ...list,
        item_count: 0 // Will be populated when items are fetched
      })) || [];

      setShoppingLists(listsWithCounts);
    } catch (err) {
      console.error("Error fetching shopping lists:", err);
      setError(t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchShoppingListItems(listId: string) {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        setItems(mockShoppingListItems[listId] || []);
        setLoading(false);
        return;
      }

      const { data: { user }, error: userError } = await sb.auth.getUser();

      if (userError || !user) {
        setError(t("pleaseSignIn"));
        setLoading(false);
        return;
      }

      const { data, error } = await sb
        .from("shopping_list_items")
        .select(
          "id, shopping_list_id, product_id, ingredient_id, custom_name, quantity, unit, notes, is_checked, position, created_at, updated_at," +
          "products:product_id(id, name, image_url, price, category_slug)," +
          "ingredients:ingredient_id(id, canonical_name, display_name, category)"
        )
        .eq("shopping_list_id", listId)
        .order("position", { ascending: true });

      if (error) throw error;

      setItems(data || []);
    } catch (err) {
      console.error("Error fetching shopping list items:", err);
      setError(t("failedToLoadItems"));
    } finally {
      setLoading(false);
    }
  }

  async function createNewList() {
    if (!newListName.trim()) return;

    try {
      if (!isSupabaseConfigured()) {
        const newList: ShoppingList = {
          id: `sl-${Date.now()}`,
          user_id: "user-1",
          name: newListName,
          description: null,
          is_public: false,
          share_token: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setShoppingLists([newList, ...shoppingLists]);
        setCreatingNewList(false);
        setNewListName("");
        return;
      }

      const { data: { user }, error: userError } = await sb.auth.getUser();

      if (userError || !user) {
        setError(t("pleaseSignIn"));
        return;
      }

      const { data, error } = await sb
        .from("shopping_lists")
        .insert({
          user_id: user.id,
          name: newListName,
          description: null,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      setShoppingLists([data, ...shoppingLists]);
      setCreatingNewList(false);
      setNewListName("");
    } catch (err) {
      console.error("Error creating shopping list:", err);
      setError(t("failedToCreate"));
    }
  }

  async function deleteList(listId: string) {
    if (!window.confirm(t("confirmDeleteList"))) return;

    try {
      if (!isSupabaseConfigured()) {
        setShoppingLists(shoppingLists.filter(l => l.id !== listId));
        if (selectedList?.id === listId) {
          setSelectedList(null);
          setItems([]);
        }
        return;
      }

      const { data: { user }, error: userError } = await sb.auth.getUser();

      if (userError || !user) {
        setError(t("pleaseSignIn"));
        return;
      }

      const { error } = await sb
        .from("shopping_lists")
        .delete()
        .eq("id", listId)
        .eq("user_id", user.id);

      if (error) throw error;

      setShoppingLists(shoppingLists.filter(l => l.id !== listId));
      if (selectedList?.id === listId) {
        setSelectedList(null);
        setItems([]);
      }
    } catch (err) {
      console.error("Error deleting shopping list:", err);
      setError(t("failedToDelete"));
    }
  }

  async function toggleItemChecked(itemId: string, currentChecked: boolean) {
    try {
      if (!isSupabaseConfigured()) {
        setItems(items.map(item => 
          item.id === itemId ? { ...item, is_checked: !currentChecked } : item
        ));
        return;
      }

      const { error } = await sb
        .from("shopping_list_items")
        .update({ is_checked: !currentChecked })
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId ? { ...item, is_checked: !currentChecked } : item
      ));
    } catch (err) {
      console.error("Error toggling item:", err);
      setError(t("failedToUpdate"));
    }
  }

  if (loading && shoppingLists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-recette-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">{t("loading")}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{t("title")}</h1>
          <p className="text-neutral-600 mt-2">{t("subtitle")}</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          {!creatingNewList ? (
            <button
              onClick={() => setCreatingNewList(true)}
              className="flex items-center gap-2 bg-recette-600 text-white px-4 py-2 rounded-lg hover:bg-recette-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>{t("newList")}</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder={t("listNamePlaceholder") as string}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-recette-500 flex-1"
              />
              <button
                onClick={createNewList}
                className="bg-recette-600 text-white px-4 py-2 rounded-lg hover:bg-recette-700 transition-colors"
              >
                {t("create")}
              </button>
              <button
                onClick={() => {
                  setCreatingNewList(false);
                  setNewListName("");
                }}
                className="text-neutral-500 hover:text-neutral-700"
              >
                {t("cancel")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shopping Lists Sidebar / List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lists Sidebar */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">{t("myLists")}</h2>
          
          {shoppingLists.length === 0 ? (
            <p className="text-neutral-500">{t("noLists")}</p>
          ) : (
            <div className="space-y-2">
              {shoppingLists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => setSelectedList(list)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedList?.id === list.id
                      ? "border-recette-600 bg-recette-50"
                      : "border-neutral-200 hover:border-recette-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{list.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{list.item_count || 0} {t("items")}</p>
                      <p className="text-xs text-neutral-400 mt-1">{formatDate(list.updated_at, locale)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteList(list.id);
                      }}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items Display */}
        <div className="lg:col-span-2">
          {selectedList ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">{selectedList.name}</h2>
                <Link
                  href={`/account/shopping-lists/${selectedList.id}/edit`}
                  className="flex items-center gap-2 text-recette-600 hover:text-recette-700"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>{t("edit")}</span>
                </Link>
              </div>

              {selectedList.description && (
                <p className="text-neutral-600 mb-6">{selectedList.description}</p>
              )}

              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-recette-600"></div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
                  <ShoppingBag className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">{t("emptyList")}</p>
                  <p className="text-sm text-neutral-400 mt-1">{t("addItemsPrompt")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItemChecked(item.id, item.is_checked)}
                        className="flex-shrink-0 h-6 w-6 rounded border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                      >
                        {item.is_checked ? (
                          <CheckSquare className="h-4 w-4 text-recette-600" />
                        ) : (
                          <Square className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>

                      {/* Image (if available) */}
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name?.en || ""}
                          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-neutral-900">
                              {item.product?.name?.en || item.ingredient?.display_name?.en || item.custom_name || "Unknown"}
                            </h3>
                            {item.notes && (
                              <p className="text-sm text-neutral-500 mt-1">{item.notes}</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-neutral-500">
                            {item.quantity}{item.unit && ` ${item.unit}`}
                            {item.product?.price && (
                              <span className="ml-2 text-recette-600 font-medium">${item.product.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Category / Type */}
                        <div className="flex gap-2 mt-2">
                          {item.product?.category_slug && (
                            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                              {item.product.category_slug}
                            </span>
                          )}
                          {item.ingredient?.category && !item.product && (
                            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                              {item.ingredient.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <button className="text-neutral-400 hover:text-neutral-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
              <ShoppingBag className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">{t("selectList")}</p>
              <p className="text-sm text-neutral-400 mt-1">{t("clickToView")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
