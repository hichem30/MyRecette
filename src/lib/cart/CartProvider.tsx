"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartItem, Product } from "../types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const STORAGE_KEY = "redbarn.cart";
const WISHLIST_KEY = "redbarn.wishlist";
const RECENT_KEY = "redbarn.recent";
const RECENT_LIMIT = 8;

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  saveForLater: (productId: string) => void;
  recent: string[];
  recordView: (productId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const hydrated = useRef(false);
  const dbSynced = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      const w = window.localStorage.getItem(WISHLIST_KEY);
      if (w) setWishlist(JSON.parse(w));
      const r = window.localStorage.getItem(RECENT_KEY);
      if (r) setRecent(JSON.parse(r));
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      /* ignore */
    }
  }, [wishlist]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch {
      /* ignore */
    }
  }, [recent]);

  // Auth listener: sync wishlist to DB on sign-in, clear on sign-out.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function applySession(uid: string | null) {
      if (cancelled) return;
      setUserId(uid);
      if (!uid) {
        // Signed out — clear browser-side cart + wishlist so the next
        // person on the same device starts fresh. The DB-side wishlist
        // stays attached to the user's account for when they sign back in.
        dbSynced.current = false;
        setWishlist([]);
        setItems([]);
        try {
          window.localStorage.removeItem(WISHLIST_KEY);
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        return;
      }
      if (dbSynced.current) return;
      dbSynced.current = true;
      try {
        // Read local wishlist (may include items the user added before signing in).
        let local: string[] = [];
        try {
          const raw = window.localStorage.getItem(WISHLIST_KEY);
          if (raw) local = JSON.parse(raw);
        } catch {
          /* ignore */
        }
        if (local.length > 0) {
          const rows = local.map((product_id) => ({ user_id: uid, product_id }));
          await supabase.from("wishlists").upsert(rows, { onConflict: "user_id,product_id" });
        }
        const { data } = await supabase
          .from("wishlists")
          .select("product_id")
          .eq("user_id", uid);
        const merged = (data ?? []).map((r) => r.product_id as string);
        if (cancelled) return;
        setWishlist(Array.from(new Set([...local, ...merged])));
      } catch {
        /* ignore */
      }
    }

    supabase.auth.getUser().then(({ data }) => applySession(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity,
        },
      ];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const has = prev.includes(productId);
        const next = has ? prev.filter((id) => id !== productId) : [...prev, productId];
        if (userId && isSupabaseConfigured()) {
          const supabase = getSupabaseBrowserClient();
          if (has) {
            supabase
              .from("wishlists")
              .delete()
              .eq("user_id", userId)
              .eq("product_id", productId);
          } else {
            supabase
              .from("wishlists")
              .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" });
          }
        }
        return next;
      });
    },
    [userId],
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const saveForLater = useCallback(
    (productId: string) => {
      setWishlist((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      if (userId && isSupabaseConfigured()) {
        const supabase = getSupabaseBrowserClient();
        supabase
          .from("wishlists")
          .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" });
      }
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    },
    [userId],
  );

  const recordView = useCallback((productId: string) => {
    setRecent((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, RECENT_LIMIT);
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      wishlist,
      toggleWishlist,
      isInWishlist,
      saveForLater,
      recent,
      recordView,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      isCartOpen,
      wishlist,
      toggleWishlist,
      isInWishlist,
      saveForLater,
      recent,
      recordView,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
