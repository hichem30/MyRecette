# My Recette - Implementation Plan (Updated)

## Overview
Based on your refined requirements, this is a **focused implementation plan** for My Recette.

**Key Changes:**
- ✅ NO content moderation (comments auto-approved)
- ✅ NO map API (use browser geolocation + redirect to device maps)
- ✅ Supercook-like search: Users **select ingredients** → get matching recipes
- ✅ **Priority: CSV bulk upload for supermarket inventory in admin panel**

---

## Phase Structure

### Phase 1: Foundation & CSV Upload (Week 1-3) ⭐ HIGHEST PRIORITY
**Focus: Get supermarkets able to upload inventory via CSV**

#### Tasks:
1. **Database Schema**
   - Create `supermarket_products` table
   - Extend `profiles` table with supermarket fields
   - Create indexes for performance

2. **CSV Upload Feature**
   - Admin UI: `/admin/products/bulk-upload`
   - CSV parser (Papa Parse)
   - Validation logic
   - Backend API: `POST /api/admin/supermarket/bulk-upload`
   - Batch processing (50-100 rows)
   - Error handling & reporting

3. **Admin Enhancements**
   - Update admin dashboard with supermarket section
   - Add supermarket management pages
   - Update existing product pages to show supermarket-specific data

#### Deliverables:
- [ ] Supermarkets can upload CSV files
- [ ] System matches to existing products or creates new ones
- [ ] Supermarket-specific pricing and stock stored
- [ ] Admin can preview before importing

---

### Phase 2: Recipe System (Week 4-5)
**Focus: Supercook-like ingredient-based recipe search**

#### Tasks:
1. **Database**
   - Create `recipes` table
   - Create `ingredients` table
   - Create `recipe_ingredients` table
   - Create `dietary_tags` and `meal_types` tables
   - Create `user_favorites`, `comments`, `ratings` tables

2. **Ingredient Normalization**
   - Normalization function (lowercase, singular/plural)
   - Aliases for common variations (tomato/tomatoes)

3. **Search Algorithm**
   - Denormalized `recipes_ingredients_denormalized` table
   - Ingredient-based search (not text search)
   - Ranking: match count → rating → popularity
   - Filters: dietary, meal type, time, difficulty

4. **UI Components**
   - Ingredient autocomplete
   - Ingredient selection interface
   - Recipe card with match count
   - Recipe detail page
   - Comment section (no moderation)
   - Rating display

#### Deliverables:
- [ ] Users can select ingredients they have
- [ ] System returns recipes containing those ingredients
- [ ] Users can filter and sort results
- [ ] Users can view recipe details
- [ ] Users can comment and rate recipes

---

### Phase 3: Supermarket Profiles (Week 6-7)
**Focus: Facebook/LinkedIn style profiles with tabs**

#### Tasks:
1. **Database**
   - Extend `profiles` with supermarket details
   - Create `supermarket_coupons` table
   - Create `supermarket_jobs` table
   - Create `user_follows` table

2. **Profile Pages**
   - `/supermarkets/[id]` - Main profile
   - Tabs: About, Products, Coupons, Bundles, Jobs, Reviews
   - Banner + profile picture layout
   - Follow button
   - "Get Directions" button (redirects to device maps)

3. **Tab Implementation**
   - About: Description, hours, contact, location
   - Products: Grid/list view, add to cart
   - Coupons: List with copy codes
   - Bundles: Existing bundles with supermarket filter
   - Jobs: Job listings with apply buttons
   - Reviews: Aggregate rating + individual reviews

#### Deliverables:
- [ ] Users can view supermarket profiles
- [ ] Users can follow supermarkets
- [ ] Users can browse supermarket products
- [ ] Users can view coupons, jobs, bundles
- [ ] "Get Directions" redirects to device map app

---

### Phase 4: Availability & Shopping (Week 8)
**Focus: Check ingredient availability at nearby supermarkets**

#### Tasks:
1. **Geolocation**
   - Browser Geolocation API
   - PostGIS distance queries
   - NO Google Maps API needed

2. **Availability Check**
   - "Check Availability" button on recipes
   - Modal with List and Map view
   - List view: Supermarkets sorted by distance/match count
   - Map view: Redirect to Google Maps
   - Show: distance, matching ingredients, total price

3. **Shopping**
   - "Add All to Cart" from availability modal
   - Shopping list feature
   - Integration with existing Stripe checkout

#### Deliverables:
- [ ] Users can check which supermarkets have recipe ingredients
- [ ] Users can see distance and pricing
- [ ] Users can add available items to cart
- [ ] Users can create shopping lists

---

### Phase 5: Feed System (Week 9)
**Focus: User feed from followed supermarkets**

#### Tasks:
1. **Database**
   - Create `feed_items` table
   - Create `user_feed` table
   - Triggers to auto-populate feed on supermarket actions

2. **Feed Page**
   - `/feed` - User's personalized feed
   - Infinite scroll
   - Filter by type (All, Products, Coupons, Jobs, Recipes)
   - Mark as read

3. **Feed Triggers**
   - New product → feed item
   - New coupon → feed item
   - New job → feed item
   - New bundle → feed item

#### Deliverables:
- [ ] Users see updates from followed supermarkets
- [ ] Feed updates in real-time
- [ ] Users can filter and interact with feed items

---

### Phase 6: Monetization (Week 10)
**Focus: €50/month supermarket subscriptions**

#### Tasks:
1. **Database**
   - Create `subscriptions` table
   - Create `subscription_history` table
   - Extend `profiles` with subscription status

2. **Stripe Integration**
   - Create Stripe product (€50/month)
   - Checkout flow for subscriptions
   - Webhook for subscription events
   - Sync subscription status with database

3. **Admin Gating**
   - Middleware to check subscription
   - Redirect non-subscribed supermarkets to subscribe page
   - Admin view of all subscriptions

4. **Subscription Pages**
   - `/supermarket/subscribe` - Signup
   - `/supermarket/billing` - Manage subscription
   - `/admin/supermarkets` - View all supermarkets

#### Deliverables:
- [ ] Supermarkets pay €50/month
- [ ] Features locked for non-subscribed supermarkets
- [ ] Admin can manage subscriptions

---

### Phase 7: Polish & Launch (Week 11-12)
**Focus: Testing, performance, SEO**

#### Tasks:
1. **Testing**
   - Unit tests for all utilities
   - Integration tests for API routes
   - E2E tests for critical flows
   - Manual testing

2. **Performance**
   - Next.js Image optimization
   - Caching strategies
   - Database query optimization
   - Bundle analysis

3. **SEO**
   - Recipe schema.org markup
   - Meta tags on all pages
   - Sitemap generation
   - Robots.txt

4. **Branding**
   - Final color scheme
   - Logo
   - Favicon
   - PWA configuration

#### Deliverables:
- [ ] All tests passing
- [ ] Performance metrics met
- [ ] SEO optimized
- [ ] Production ready

---

## Detailed Task Breakdown by Phase

### Phase 1: Foundation & CSV Upload (Week 1-3)

#### Week 1: Database & Backend
- [ ] Add `supermarket_products` table to schema.sql
- [ ] Extend `profiles` table with supermarket fields
- [ ] Create indexes for supermarket_products
- [ ] Create CSV upload API route
- [ ] Implement CSV parsing and validation
- [ ] Implement product matching logic
- [ ] Implement batch import logic
- [ ] Add RLS policies

#### Week 2: Admin UI
- [ ] Create `/admin/products/bulk-upload/page.tsx`
- [ ] File upload component with drag & drop
- [ ] CSV template download
- [ ] Preview table with validation status
- [ ] Confirm import button
- [ ] Success/error messaging
- [ ] Update admin dashboard with supermarket section

#### Week 3: Testing & Integration
- [ ] Test CSV upload with various formats
- [ ] Test product matching (barcode, SKU, name)
- [ ] Test error handling
- [ ] Test large file processing
- [ ] Integrate with existing product pages

---

### Phase 2: Recipe System (Week 4-5)

#### Week 4: Database & Search
- [ ] Add all recipe-related tables to schema.sql
- [ ] Create ingredient normalization function
- [ ] Create recipes_ingredients_denormalized table
- [ ] Create search algorithm
- [ ] Create ingredient autocomplete function
- [ ] Create recipe API routes (CRUD)

#### Week 5: UI
- [ ] Create `/recipes/page.tsx` - Recipe listing
- [ ] Create `/recipes/new/page.tsx` - Create recipe
- [ ] Create `/recipes/[slug]/page.tsx` - Recipe detail
- [ ] Create IngredientSearch component
- [ ] Create RecipeCard component
- [ ] Create CommentSection component (no moderation)
- [ ] Create Rating component
- [ ] Integrate YouTube embed

---

### Phase 3: Supermarket Profiles (Week 6-7)

#### Week 6: Database & Backend
- [ ] Extend profiles table
- [ ] Add supermarket_coupons table
- [ ] Add supermarket_jobs table
- [ ] Add user_follows table
- [ ] Create supermarket profile API routes
- [ ] Create geolocation helper

#### Week 7: UI
- [ ] Create `/supermarkets/[id]/page.tsx` - Profile
- [ ] Create SupermarketHeader component
- [ ] Create SupermarketTabs component
- [ ] Create SupermarketProductsTab
- [ ] Create SupermarketCouponsTab
- [ ] Create SupermarketJobsTab
- [ ] Create SupermarketAboutTab
- [ ] Create SupermarketReviewsTab
- [ ] Add FollowButton component
- [ ] Add DirectionsButton component (redirect)

---

### Phase 4: Availability & Shopping (Week 8)

#### Week 8: All Tasks
- [ ] Create useCurrentLocation hook
- [ ] Create checkAvailability function
- [ ] Create AvailabilityModal component
- [ ] Add "Check Availability" button to recipe detail
- [ ] Create shopping list pages
- [ ] Integrate with existing cart
- [ ] Test geolocation flow
- [ ] Test availability check flow

---

### Phase 5: Feed System (Week 9)

#### Week 9: All Tasks
- [ ] Add feed_items table
- [ ] Add user_feed table
- [ ] Create feed triggers for supermarket actions
- [ ] Create feed API routes
- [ ] Create `/feed/page.tsx`
- [ ] Create Feed component
- [ ] Create FeedItem component
- [ ] Add infinite scroll
- [ ] Test feed updates

---

### Phase 6: Monetization (Week 10)

#### Week 10: All Tasks
- [ ] Add subscriptions table
- [ ] Create Stripe product (€50/month)
- [ ] Create subscription API routes
- [ ] Create middleware for subscription gating
- [ ] Create `/supermarket/subscribe/page.tsx`
- [ ] Create `/supermarket/billing/page.tsx`
- [ ] Create `/admin/supermarkets/page.tsx`
- [ ] Test subscription flow

---

### Phase 7: Polish & Launch (Week 11-12)

#### Week 11: Testing & Performance
- [ ] Write unit tests for all utilities
- [ ] Write integration tests for API routes
- [ ] Write E2E tests for critical flows
- [ ] Manual testing of all features
- [ ] Performance optimization
- [ ] Bundle analysis

#### Week 12: SEO & Launch
- [ ] Add recipe schema.org markup
- [ ] Add meta tags to all pages
- [ ] Generate sitemap
- [ ] Configure robots.txt
- [ ] Final branding
- [ ] Production deployment
- [ ] Launch

---

## File Structure

### New/Modified Files

```
/src/
├── app/
│   ├── [locale]/
│   │   ├── recipes/
│   │   │   ├── page.tsx              # Recipe listing
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create recipe
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Recipe detail
│   │   ├── supermarkets/
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Supermarket profile
│   │   │       ├── SupermarketProductsTab.tsx
│   │   │       ├── SupermarketCouponsTab.tsx
│   │   │       ├── SupermarketJobsTab.tsx
│   │   │       ├── SupermarketAboutTab.tsx
│   │   │       └── SupermarketReviewsTab.tsx
│   │   ├── feed/
│   │   │   └── page.tsx              # User feed
│   │   └── shopping-lists/
│   │       └── page.tsx              # Shopping lists
│   ├── supermarket/
│   │   ├── subscribe/
│   │   │   └── page.tsx              # Subscribe page
│   │   └── billing/
│   │       └── page.tsx              # Billing page
│   └── admin/
│       ├── page.tsx                  # Dashboard (updated)
│       ├── products/
│       │   ├── page.tsx              # Products (updated)
│       │   └── bulk-upload/
│       │       └── page.tsx          # NEW: Bulk upload
│       └── supermarket/
│           ├── page.tsx              # NEW: Supermarket list
│           ├── profile/
│           │   └── page.tsx          # NEW: Edit profile
│           └── billing/
│               └── page.tsx          # NEW: Subscription management
│
├── components/
│   ├── search/
│   │   └── IngredientSearch.tsx     # NEW: Ingredient selection
│   ├── recipes/
│   │   ├── RecipeCard.tsx            # NEW: Recipe card
│   │   ├── RecipeDetail.tsx          # NEW: Recipe detail
│   │   ├── CommentSection.tsx       # NEW: Comments
│   │   └── Rating.tsx               # NEW: Rating display
│   ├── availability/
│   │   └── AvailabilityModal.tsx    # NEW: Availability check
│   ├── supermarkets/
│   │   ├── SupermarketHeader.tsx    # NEW: Profile header
│   │   ├── SupermarketTabs.tsx      # NEW: Tab navigation
│   │   ├── SupermarketCard.tsx      # NEW: Supermarket card
│   │   └── DirectionsButton.tsx      # NEW: Map redirect button
│   └── shopping/
│       └── ShoppingList.tsx          # NEW: Shopping list
│
├── lib/
│   ├── ingredients/
│   │   ├── normalizer.ts             # NEW: Normalization
│   │   └── autocomplete.ts           # NEW: Autocomplete
│   ├── recipes/
│   │   ├── search.ts                 # NEW: Search algorithm
│   │   └── types.ts                 # NEW: Recipe types
│   ├── availability/
│   │   └── check.ts                 # NEW: Availability check
│   ├── supermarket/
│   │   └── bulk-upload.ts           # NEW: CSV processing
│   └── subscriptions/
│       └── api.ts                   # NEW: Subscription logic
│
├── hooks/
│   ├── useCurrentLocation.ts         # NEW: Geolocation hook
│   └── useIngredentSearch.ts         # NEW: Ingredient search hook
│
└── app/api/
    ├── admin/
    │   └── supermarket/
    │       └── bulk-upload/
    │           └── route.ts          # NEW: CSV upload API
    ├── recipes/
    │   ├── route.ts                  # NEW: Recipe API
    │   └── [id]/
    │       └── route.ts              # NEW: Recipe detail API
    ├── supermarket/
    │   ├── subscribe/
    │   │   └── route.ts              # NEW: Subscribe API
    │   └── billing/
    │       └── route.ts              # NEW: Billing API
    └── availability/
        └── route.ts                  # NEW: Availability API
```

---

## CSV Bulk Upload - Detailed Implementation

### 1. Database Table (`supabase/schema.sql`)

```sql
-- Supermarket-specific products
CREATE TABLE IF NOT EXISTS public.supermarket_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  supermarket_sku TEXT,
  supermarket_barcode TEXT,
  location_in_store TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supermarket_id, product_id),
  UNIQUE (supermarket_id, supermarket_sku),
  UNIQUE (supermarket_id, supermarket_barcode)
);

-- Index for fast supermarket queries
CREATE INDEX IF NOT EXISTS idx_supermarket_products_supermarket 
  ON public.supermarket_products(supermarket_id);

-- Index for availability checks
CREATE INDEX IF NOT EXISTS idx_supermarket_products_availability 
  ON public.supermarket_products(supermarket_id, is_available) 
  WHERE is_available = TRUE;

-- Index for supermarket SKU/barcode lookups
CREATE INDEX IF NOT EXISTS idx_supermarket_products_sku 
  ON public.supermarket_products(supermarket_id, supermarket_sku);
CREATE INDEX IF NOT EXISTS idx_supermarket_products_barcode 
  ON public.supermarket_products(supermarket_id, supermarket_barcode);
```

### 2. CSV Format

**Required fields (at least one):** `sku`, `barcode`, or `name`
**Required fields:** `price`, `stock`

```csv
sku,barcode,name,category,price,stock,description,brand,unit,location_in_store
PROD001,12345678,Organic Tomatoes,produce,2.99,50,Vine ripened organic tomatoes,Acme Farm,kg,
PROD002,87654321,Free Range Eggs,produce,3.50,100,Large free range eggs,Happy Farms,dozen,
PROD003,,Whole Wheat Bread,bakery,4.50,25,Artisan whole wheat bread,Local Bakery,loaf,Aisle 3
```

### 3. Admin UI Component (`/admin/products/bulk-upload/page.tsx`)

See FEATURE_ANALYSIS.md for complete component code.

### 4. Backend API (`/api/admin/supermarket/bulk-upload/route.ts`)

See FEATURE_ANALYSIS.md for complete API implementation.

### 5. Validation Rules

```typescript
// /lib/supermarket/bulk-upload.ts

const REQUIRED_FIELDS = ['price', 'stock'];
const AT_LEAST_ONE_IDENTIFIER = ['sku', 'barcode', 'name'];

const FIELD_VALIDATION: Record<string, (value: string) => boolean> = {
  price: (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0,
  stock: (value) => !isNaN(parseInt(value)) && parseInt(value) >= 0,
  sku: (value) => value.length <= 100,
  barcode: (value) => value.length <= 50,
  name: (value) => value.length <= 200,
};
```

### 6. Processing Logic

1. Parse CSV with Papa Parse
2. Validate each row
3. Group into batches (50-100 rows)
4. For each batch:
   - Start transaction
   - For each row:
     - Try to find existing product by: barcode → SKU → name
     - If found: Update or create supermarket_products entry
     - If not found: Create new product + new supermarket_products entry
   - Commit transaction
5. Return summary

---

## Ingredient Search Algorithm - Detailed

### Database Setup

```sql
-- Master ingredients list
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  plural_name TEXT,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  custom_name TEXT,
  quantity NUMERIC(10,2),
  unit TEXT,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Denormalized for fast searching
CREATE TABLE IF NOT EXISTS public.recipes_ingredients_denormalized (
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  PRIMARY KEY (recipe_id, ingredient_name)
);
```

### Search Function

```typescript
// /lib/recipes/search.ts

export async function searchRecipesByIngredients(
  ingredients: string[],
  options: {
    searchType?: 'any' | 'all',
    dietaryFilters?: string[],
    mealTypeFilters?: string[],
    sortBy?: 'relevance' | 'rating' | 'popularity' | 'newest',
    page?: number,
    limit?: number
  } = {}
) {
  const { searchType = 'any', ...filters } = options;
  const normalizedIngredients = ingredients.map(normalizeIngredient);
  
  // Build query
  let query = supabase
    .from('recipes_ingredients_denormalized')
    .select('recipe_id, ingredient_name')
    .in('ingredient_name', normalizedIngredients);
  
  // Get matching recipes
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Group by recipe and count matches
  const recipeMatches = data.reduce((acc, row) => {
    if (!acc[row.recipe_id]) {
      acc[row.recipe_id] = { count: 0, ingredients: [] };
    }
    acc[row.recipe_id].count++;
    acc[row.recipe_id].ingredients.push(row.ingredient_name);
    return acc;
  }, {} as Record<string, { count: number; ingredients: string[] }>);
  
  // Get recipe details for matched recipes
  const recipeIds = Object.keys(recipeMatches);
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .in('id', recipeIds);
  
  if (recipesError) throw recipesError;
  
  // Merge with match data
  const results = recipes.map(recipe => ({
    recipe,
    matchingCount: recipeMatches[recipe.id].count,
    matchingIngredients: recipeMatches[recipe.id].ingredients,
    relevanceScore: searchType === 'all' 
      ? recipeMatches[recipe.id].count / normalizedIngredients.length
      : recipeMatches[recipe.id].count / recipe.ingredients_count
  }));
  
  // Sort
  results.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    if (b.recipe.average_rating !== a.recipe.average_rating) return b.recipe.average_rating - a.recipe.average_rating;
    return b.recipe.view_count - a.recipe.view_count;
  });
  
  // Apply sort override
  if (options.sortBy === 'rating') {
    results.sort((a, b) => b.recipe.average_rating - a.recipe.average_rating);
  } else if (options.sortBy === 'popularity') {
    results.sort((a, b) => b.recipe.view_count - a.recipe.view_count);
  } else if (options.sortBy === 'newest') {
    results.sort((a, b) => new Date(b.recipe.created_at).getTime() - new Date(a.recipe.created_at).getTime());
  }
  
  // Paginate
  const page = options.page || 1;
  const limit = options.limit || 12;
  const paginated = results.slice((page - 1) * limit, page * limit);
  
  return { results: paginated, total: results.length, page, totalPages: Math.ceil(results.length / limit) };
}
```

---

## Supercook-Like UI Flow

### Homepage Layout

```
┌─────────────────────────────────────────┐
│  MY RECETTE                            [🔍][Login]│
├─────────────────────────────────────────┤
│                                         │
│  WHAT'S IN YOUR PANTRY?                  │
│  ┌───────────────────────────────────┐ │
│  │ Start typing an ingredient...       │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Selected: [chicken ×] [eggs ×] [tomatoes ×]│
│                                         │
│  [FIND RECIPES]                           │
│                                         │
└─────────────────────────────────────────┘

Or: [Browse All Recipes] [Trending] [New]
```

### Search Results

```
┌─────────────────────────────────────────┐
│  RESULTS FOR: chicken, eggs, tomatoes     │
├─────────────────────────────────────────┤
│  Filters: [All ▼] [Dietary ▼] [Time ▼]    │
│           [Difficulty ▼] [Sort: Relevance] │
├─────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐│
│  │Recipe│  │Recipe│  │Recipe│  │Recipe││
│  │Card 1│  │Card 2│  │Card 3│  │Card 4││
│  │✓ 3/3 │  │✓ 2/3 │  │✓ 3/3 │  │✓ 2/3 ││
│  └──────┘  └──────┘  └──────┘  └──────┘│
│  ...                                     │
└─────────────────────────────────────────┘
```

### Recipe Detail

```
┌─────────────────────────────────────────┐
│  [Image]        Chicken Parmesan         │
│  ★★★★☆ 4.8 (24 reviews)    [❤️] [🔗]│
├─────────────────────────────────────────┤
│  Prep: 20 min | Cook: 40 min | Serves: 4 │
│  Difficulty: Medium | Category: Italian   │
├─────────────────────────────────────────┤
│  [YouTube Video Embed]                    │
├─────────────────────────────────────────┤
│  INGREDIENTS                              │
│  ✓ 2 chicken breasts                       │
│  ✓ 2 eggs                                 │
│  ✓ 3 tomatoes                             │
│  ✓ 1 cup parmesan                         │
│  ✓ ...                                    │
│                                         │
│  [CHECK AVAILABILITY]                     │
├─────────────────────────────────────────┤
│  INSTRUCTIONS                             │
│  1. Preheat oven...                        │
│  2. Season chicken...                      │
│  ...                                     │
├─────────────────────────────────────────┤
│  COMMENTS (5)                             │
│  ┌───────────────────────────────────┐ │
│  │ User1 ★★★★☆                          │ │
│  │ Great recipe! Made it last night...   │ │
│  └───────────────────────────────────┘ │
│  [Add Comment]                            │
└─────────────────────────────────────────┘
```

---

## Next Steps

### Recommended Starting Point

Based on your focus, start with **Phase 1: CSV Bulk Upload**:

1. I can implement the complete CSV bulk upload feature:
   - Database table
   - Admin UI page
   - Backend API
   - Validation logic
   - Processing logic

2. Then move to **Phase 2: Recipe System** for the Supercook-like search

3. Then the rest of the features

### Questions Before Implementation

1. **CSV Format**: Is the proposed format acceptable? Any additional fields needed?
2. **Product Matching**: Should we prioritize barcode → SKU → name, or a different order?
3. **Validation**: Any specific validation rules for products?
4. **Batch Size**: 50 or 100 rows per batch for processing?
5. **Error Handling**: Skip invalid rows and continue, or stop and rollback?

---

## Ready to Implement

The plan is complete and detailed. I can start implementing any phase immediately.

**Which would you like me to implement first?**
- [ ] Phase 1: CSV Bulk Upload (Recommended - your highest priority)
- [ ] Phase 2: Recipe System
- [ ] Phase 3: Supermarket Profiles
- [ ] Phase 4: Availability & Shopping
- [ ] Phase 5: Feed System
- [ ] Phase 6: Monetization

Or should I create more detailed specifications for a specific feature before implementation?
