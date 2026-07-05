import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { SupermarketIngredientAvailability } from "@/lib/types";

// Mock data for local development
const mockAvailability: SupermarketIngredientAvailability[] = [
  {
    supermarket_id: "sm-1",
    supermarket_name: { en: "FreshMart Supermarket", es: "Supermercado FreshMart" },
    location_geometry: null,
    distance_meters: 1200,
    ingredient_count: 5,
    total_price: 12.49,
    available_ingredients: [
      { ingredient: "Spaghetti", price: 2.99, in_stock: true },
      { ingredient: "Ground Beef", price: 5.99, in_stock: true },
      { ingredient: "Onion", price: 0.99, in_stock: true },
      { ingredient: "Carrot", price: 1.49, in_stock: true },
      { ingredient: "Tomato", price: 1.03, in_stock: true },
    ],
    missing_ingredients: [],
  },
  {
    supermarket_id: "sm-2",
    supermarket_name: { en: "GreenGrocer Market", es: "Mercado GreenGrocer" },
    location_geometry: null,
    distance_meters: 2500,
    ingredient_count: 4,
    total_price: 13.75,
    available_ingredients: [
      { ingredient: "Spaghetti", price: 3.25, in_stock: true },
      { ingredient: "Ground Beef", price: 6.50, in_stock: true },
      { ingredient: "Onion", price: 1.00, in_stock: true },
      { ingredient: "Carrot", price: 1.50, in_stock: true },
    ],
    missing_ingredients: [{ ingredient: "Tomato" }],
  },
];

export async function POST(request: NextRequest) {
  const sb = getSupabaseServerClient();
  
  if (!isSupabaseConfigured()) {
    // Return mock data for local development
    return NextResponse.json(mockAvailability);
  }

  try {
    const { ingredients, userLocation, radiusKm = 50 } = await request.json();
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one ingredient" },
        { status: 400 }
      );
    }

    // For now, return mock availability
    // In production, this would:
    // 1. Map ingredient names to ingredient IDs
    // 2. Find supermarkets within radius of userLocation
    // 3. Check which ingredients are available at each supermarket
    // 4. Calculate total price and completion percentage
    // 5. Return sorted by distance and completion
    
    return NextResponse.json(mockAvailability);
  } catch (error) {
    console.error("Error checking ingredient availability:", error);
    return NextResponse.json(
      { error: "Failed to check ingredient availability" },
      { status: 500 }
    );
  }
}
