"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/CartProvider";

export function RecordProductView({ productId }: { productId: string }) {
  const { recordView } = useCart();
  useEffect(() => {
    recordView(productId);
  }, [productId, recordView]);
  return null;
}
