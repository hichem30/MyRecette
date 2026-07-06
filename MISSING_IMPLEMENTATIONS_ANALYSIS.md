# My Recette - Complete Missing Implementations Analysis

## Executive Summary

This document provides a comprehensive analysis of what has been implemented vs. what is still missing in the My Recette project. Based on the user requirements and current codebase state, I've identified gaps across **Database Schema**, **API Routes**, **Frontend Pages**, **Components**, and **Core Features**.

**Current Status**: Phase 1 (CSV Bulk Upload) is COMPLETE. Phases 2-7 have partial implementations with significant gaps.

---

## 📋 User Requirements Summary

### Core Requirements:
- ✅ **CSV Bulk Upload**: COMPLETE (Phase 1)
- ⚠️ **Supercook-like Search**: PARTIAL (Pages exist but search algorithm missing)
- ⚠️ **Recipe System**: PARTIAL (Pages exist, API partial, database partial)
- ⚠️ **Video System**: PARTIAL (Pages exist, API partial, database partial)
- ⚠️ **Supermarket Profiles**: PARTIAL (Pages partial, database partial)
- ⚠️ **Social Features**: PARTIAL (Some APIs exist, pages partial)
- ⚠️ **Feed System**: PARTIAL (Page exists, database partial)
- ⚠️ **Monetization**: PARTIAL (Some database, APIs missing)
- ⚠️ **Multi-language**: PARTIAL (French and Arabic files exist, integration partial)
- ❌ **Ingredient Availability Check**: NOT STARTED
- ❌ **Shopping Lists**: NOT STARTED
- ❌ **Geolocation**: NOT STARTED

---

## 🗃️ DATABASE SCHEMA - MISSING TABLES & COLUMNS

### ✅ COMPLETED Tables:
- `supermarket_products` (Phase 1)
- `profiles` extended with supermarket fields (Phase 1)
- Necessary indexes and RLS policies (Phase 1)

### ❌ MISSING Core Tables:

#### 1. Recipes Tables
```sql
-- MAIN RECIPES TABLE
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title JSONB NOT NULL,  -- {en: "", fr: "", ar: "", es: ""}
  slug TEXT UNIQUE NOT NULL,
  description JSONB,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instructions JSONB,  -- Array of {step: int, text: jsonb, image_url?: text}
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  image_url TEXT,
  video_url TEXT,  -- For recipe author's YouTube video
  cuisine TEXT,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer', 'drink')),
  dietary_tags TEXT[],
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RECIPE INGREDIENTS (links recipes to ingredients)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  custom_name TEXT,  -- If no ingredient_id match
  quantity NUMERIC(10,2),
  unit TEXT,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RECIPE COMMENTS
CREATE TABLE IF NOT EXISTS public.recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.recipe_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,  -- NO MODERATION per user request
  is_spam BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RECIPE RATINGS
CREATE TABLE IF NOT EXISTS public.recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value >= 1 AND value <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- RECIPE FAVORITES
CREATE TABLE IF NOT EXISTS public.recipe_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);
```

#### 2. Ingredients Tables (From INGREDIENT_DATABASE_DESIGN.md)
```sql
-- MASTER INGREDIENTS
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,  -- singular, lowercase
  display_name JSONB NOT NULL,
  plural_name TEXT,
  category TEXT NOT NULL,  -- 'vegetable', 'fruit', 'protein', etc.
  subcategory TEXT,
  is_common BOOLEAN DEFAULT TRUE,
  is_basic BOOLEAN DEFAULT FALSE,
  description TEXT,
  calories_per_100g NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INGREDIENT SYNONYMS
CREATE TABLE IF NOT EXISTS public.ingredient_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  synonym TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ingredient_id, synonym)
);

-- INGREDIENT PATTERNS (for regex matching)
CREATE TABLE IF NOT EXISTS public.ingredient_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('contains', 'starts_with', 'ends_with', 'regex')),
  pattern TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 1.00,
  case_sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRODUCT-INGREDIENT MAPPING
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  mapping_method TEXT NOT NULL CHECK (mapping_method IN ('auto_name', 'auto_barcode', 'manual', 'admin')),
  confidence NUMERIC(3,2),
  is_primary BOOLEAN DEFAULT TRUE,
  quantity NUMERIC(10,2),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

-- PENDING INGREDIENT MAPPINGS (for admin review)
CREATE TABLE IF NOT EXISTS public.pending_ingredient_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supermarket_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggested_ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  suggested_ingredient_name TEXT NOT NULL,
  confidence NUMERIC(3,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ignored')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DENORMALIZED FOR SEARCH PERFORMANCE
CREATE TABLE IF NOT EXISTS public.recipes_ingredients_denormalized (
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,  -- Normalized canonical name
  PRIMARY KEY (recipe_id, ingredient_name)
);
```

#### 3. Video Tables
```sql
-- USER-SUBMITTED VIDEOS FOR RECIPES
CREATE TABLE IF NOT EXISTS public.recipe_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'facebook')),
  video_url TEXT NOT NULL,
  youtube_video_id TEXT,  -- Extracted from URL
  facebook_video_id TEXT,  -- Extracted from URL
  thumbnail_url TEXT,
  title JSONB,
  description JSONB,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,  -- NO MODERATION
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIDEO COMMENTS (separate from recipe comments)
CREATE TABLE IF NOT EXISTS public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.recipe_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  is_spam BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIDEO REACTIONS
CREATE TABLE IF NOT EXISTS public.video_reactions (
  video_id UUID NOT NULL REFERENCES public.recipe_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'surprised', 'sad', 'angry')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (video_id, user_id, reaction_type)
);
```

#### 4. Supermarket Tables (Beyond Phase 1)
```sql
-- SUPERMARKET COUPONS
CREATE TABLE IF NOT EXISTS public.supermarket_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  description JSONB,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'amount')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_purchase_amount NUMERIC(10,2),
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  products_eligible UUID[],  -- product_ids
  categories_eligible TEXT[],  -- category_slugs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUPERMARKET JOBS
CREATE TABLE IF NOT EXISTS public.supermarket_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title JSONB NOT NULL,
  description JSONB NOT NULL,
  position_type TEXT CHECK (position_type IN ('full_time', 'part_time', 'temporary', 'contract', 'internship')),
  salary_range JSONB,
  requirements TEXT[],
  benefits TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  application_url TEXT,
  application_email TEXT,
  active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUPERMARKET BUNDLES (different from global bundles)
CREATE TABLE IF NOT EXISTS public.supermarket_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  description JSONB,
  bundle_price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  image_url TEXT,
  product_ids UUID[] NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER FOLLOWS SUPERMARKETS
CREATE TABLE IF NOT EXISTS public.user_follows (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supermarket_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, supermarket_id)
);

-- FEED ITEMS
CREATE TABLE IF NOT EXISTS public.feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_product', 'price_change', 'sale_start', 'coupon_added', 'bundle_added', 'job_posted', 'announcement', 'new_recipe')),
  entity_id UUID NOT NULL,  -- ID of the entity (product_id, coupon_id, etc.)
  title JSONB NOT NULL,
  description JSONB,
  image_url TEXT,
  action_url TEXT,  -- URL to redirect to
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER FEED (what users see)
CREATE TABLE IF NOT EXISTS public.user_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_item_id UUID NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, feed_item_id)
);
```

#### 5. Shopping & Subscriptions
```sql
-- SHOPPING LISTS
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SHOPPING LIST ITEMS
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  custom_name TEXT,
  quantity NUMERIC(10,2),
  unit TEXT,
  notes TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('inactive', 'active', 'trialing', 'past_due', 'canceled')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUBSCRIPTION HISTORY
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🔌 MISSING DATABASE INDEXES

```sql
-- Recipe search indexes
CREATE INDEX IF NOT EXISTS idx_recipes_title_en ON public.recipes USING gin ((title->>'en'));
CREATE INDEX IF NOT EXISTS idx_recipes_title_es ON public.recipes USING gin ((title->>'es'));
CREATE INDEX IF NOT EXISTS idx_recipes_title_fr ON public.recipes USING gin ((title->>'fr'));
CREATE INDEX IF NOT EXISTS idx_recipes_title_ar ON public.recipes USING gin ((title->>'ar'));
CREATE INDEX IF NOT EXISTS idx_recipes_author ON public.recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_published ON public.recipes(published) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);

-- Ingredient indexes
CREATE INDEX IF NOT EXISTS idx_ingredients_canonical ON public.ingredients(canonical_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON public.ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_common ON public.ingredients(is_common) WHERE is_common = TRUE;
CREATE INDEX IF NOT EXISTS idx_ingredient_synonyms_synonym ON public.ingredient_synonyms(synonym);

-- Recipe ingredients indexes
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON public.recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients_denormalized ON public.recipes_ingredients_denormalized(ingredient_name);

-- Video indexes
CREATE INDEX IF NOT EXISTS idx_recipe_videos_recipe ON public.recipe_videos(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_videos_user ON public.recipe_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_videos_platform ON public.recipe_videos(platform);
CREATE INDEX IF NOT EXISTS idx_recipe_videos_status ON public.recipe_videos(status);
CREATE INDEX IF NOT EXISTS idx_video_comments_video ON public.video_comments(video_id);

-- Supermarket indexes
CREATE INDEX IF NOT EXISTS idx_supermarket_coupons_supermarket ON public.supermarket_coupons(supermarket_id);
CREATE INDEX IF NOT EXISTS idx_supermarket_coupons_code ON public.supermarket_coupons(code);
CREATE INDEX IF NOT EXISTS idx_supermarket_jobs_supermarket ON public.supermarket_jobs(supermarket_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_user ON public.user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_supermarket ON public.user_follows(supermarket_id);

-- Feed indexes
CREATE INDEX IF NOT EXISTS idx_feed_items_supermarket ON public.feed_items(supermarket_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_type ON public.feed_items(type);
CREATE INDEX IF NOT EXISTS idx_feed_items_created_at ON public.feed_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feed_user ON public.user_feed(user_id);

-- Shopping indexes
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON public.shopping_list_items(shopping_list_id);
```

---

## 📡 MISSING DATABASE FUNCTIONS & TRIGGERS

### Functions for Ingredient System:
```sql
-- Normalize ingredient names (singular/plural handling)
CREATE OR REPLACE FUNCTION public.normalize_ingredient_name(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convert to lowercase
  LET result := LOWER(TRIM(p_name));
  
  -- Remove common plural endings (English)
  IF result LIKE '%s' AND LENGTH(result) > 3 THEN
    -- Try removing 's' if it makes sense
    -- More sophisticated logic needed
    result := result;
  END IF;
  
  RETURN result;
END;
$$;

-- Find ingredient by various methods
CREATE OR REPLACE FUNCTION public.find_ingredient(p_query TEXT)
RETURNS TABLE (
  ingredient_id UUID,
  canonical_name TEXT,
  display_name JSONB,
  category TEXT,
  confidence NUMERIC(3,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try exact canonical match
  RETURN QUERY
  SELECT 
    i.id,
    i.canonical_name,
    i.display_name,
    i.category,
    1.00::numeric(3,2) as confidence
  FROM public.ingredients i
  WHERE i.canonical_name = public.normalize_ingredient_name(p_query)
  ORDER BY i.is_common DESC, i.is_basic DESC
  LIMIT 5;
  
  -- Try synonyms
  RETURN QUERY
  SELECT 
    i.id,
    i.canonical_name,
    i.display_name,
    i.category,
    0.95::numeric(3,2) as confidence
  FROM public.ingredients i
  JOIN public.ingredient_synonyms s ON i.id = s.ingredient_id
  WHERE s.synonym = public.normalize_ingredient_name(p_query)
  ORDER BY s.priority DESC
  LIMIT 5;
  
  -- Try patterns
  RETURN QUERY
  SELECT 
    i.id,
    i.canonical_name,
    i.display_name,
    i.category,
    p.confidence
  FROM public.ingredients i
  JOIN public.ingredient_patterns p ON i.id = p.ingredient_id
  WHERE 
    CASE p.pattern_type
      WHEN 'contains' THEN p_query ILIKE '%' || p.pattern || '%'
      WHEN 'starts_with' THEN p_query ILIKE p.pattern || '%'
      WHEN 'ends_with' THEN p_query ILIKE '%' || p.pattern
      WHEN 'regex' THEN p_query ~ p.pattern
    END
  ORDER BY p.confidence DESC, p.priority DESC
  LIMIT 5;
END;
$$;

-- Update denormalized table trigger
CREATE OR REPLACE FUNCTION public.update_recipes_ingredients_denormalized()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert denormalized entries
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update denormalized entries
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete denormalized entries
  END IF;
  RETURN NULL;
END;
$$;

-- Auto-generate feed items when supermarkets add content
CREATE OR REPLACE FUNCTION public.create_feed_item_on_content_add()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Logic to create feed items when supermarkets add products, coupons, etc.
  RETURN NULL;
END;
$$;
```

---

## 🎯 MISSING API ROUTES

### Recipe API Routes:
- ❌ `POST /api/recipes` - Create recipe
- ❌ `PUT /api/recipes/[slug]` - Update recipe  
- ❌ `DELETE /api/recipes/[slug]` - Delete recipe
- ❌ `GET /api/recipes/search` - Supercook-like ingredient search
- ✅ `GET /api/recipes/[slug]/comments` - EXISTS
- ❌ `POST /api/recipes/[slug]/comments` - Add comment
- ❌ `DELETE /api/recipes/[slug]/comments/[id]` - Delete comment
- ✅ `GET /api/recipes/[slug]/favorites` - EXISTS
- ❌ `POST /api/recipes/[slug]/favorites` - Toggle favorite
- ✅ `GET /api/recipes/[slug]/videos` - EXISTS
- ❌ `POST /api/recipes/[slug]/videos` - Add video to recipe
- ✅ `POST /api/recipes/videos/[id]/like` - EXISTS
- ✅ `POST /api/recipes/videos/[id]/view` - EXISTS

### Video API Routes:
- ❌ `GET /api/videos/[id]/comments` - Get video comments (PARTIAL - file exists but may be incomplete)
- ❌ `POST /api/videos/[id]/comments` - Add video comment
- ❌ `DELETE /api/videos/[id]/comments/[commentId]` - Delete video comment
- ❌ `POST /api/videos/[id]/comments/[commentId]/like` - Like video comment
- ❌ `POST /api/videos/[id]/reactions` - Add reaction
- ❌ `DELETE /api/videos/[id]/reactions/[reactionType]` - Remove reaction

### Rating API Routes:
- ❌ `POST /api/recipes/[slug]/ratings` - Add rating
- ❌ `PUT /api/recipes/[slug]/ratings` - Update rating
- ❌ `DELETE /api/recipes/[slug]/ratings` - Remove rating

### Supermarket API Routes:
- ❌ `GET /api/supermarkets` - List supermarkets
- ❌ `GET /api/supermarkets/[id]` - Get supermarket details
- ❌ `PUT /api/supermarkets/[id]` - Update supermarket profile
- ✅ `POST /api/supermarkets/[id]/follow` - EXISTS
- ✅ `GET /api/supermarkets/[id]/feed` - EXISTS
- ✅ `POST /api/supermarkets/[id]/subscribe` - EXISTS
- ❌ `GET /api/supermarkets/[id]/products` - Get supermarket products
- ❌ `GET /api/supermarkets/[id]/coupons` - Get supermarket coupons
- ❌ `GET /api/supermarkets/[id]/bundles` - Get supermarket bundles
- ❌ `GET /api/supermarkets/[id]/jobs` - Get supermarket jobs

### Feed API Routes:
- ❌ `GET /api/feed` - Get user's feed
- ❌ `POST /api/feed/[id]/read` - Mark as read
- ❌ `POST /api/feed/[id]/hide` - Hide from feed

### Shopping API Routes:
- ❌ `GET /api/shopping-lists` - Get user's shopping lists
- ❌ `POST /api/shopping-lists` - Create shopping list
- ❌ `PUT /api/shopping-lists/[id]` - Update shopping list
- ❌ `DELETE /api/shopping-lists/[id]` - Delete shopping list
- ❌ `POST /api/shopping-lists/[id]/items` - Add item to list
- ❌ `PUT /api/shopping-lists/[id]/items/[itemId]` - Update item
- ❌ `DELETE /api/shopping-lists/[id]/items/[itemId]` - Remove item
- ❌ `POST /api/shopping-lists/[id]/items/[itemId]/check` - Toggle check

### Availability API Routes:
- ❌ `POST /api/ingredients/availability` - Check ingredient availability at supermarkets
- ❌ `GET /api/ingredients` - List ingredients
- ❌ `POST /api/ingredients/match` - Match ingredient to products

### Subscription API Routes:
- ❌ `POST /api/subscriptions/create-checkout` - Create Stripe checkout for subscription
- ❌ `GET /api/subscriptions/[supermarketId]` - Get subscription status
- ❌ `POST /api/subscriptions/[supermarketId]/cancel` - Cancel subscription

---

## 🖥️ MISSING FRONTEND PAGES

### Recipe Pages:
- ✅ `/recipes` - EXISTS (but uses mock data)
- ✅ `/recipes/add` - EXISTS (but form may be incomplete)
- ✅ `/recipes/[slug]` - EXISTS (partial implementation)
- ❌ `/recipes/search` - EXISTS but may need enhancements for Supercook-like search

### Video Pages:
- ✅ `/videos` - EXISTS (mock data)
- ✅ `/videos/[id]` - EXISTS (mock data)

### Supermarket Pages:
- ✅ `/supermarkets` - EXISTS
- ✅ `/supermarkets/[id]` - EXISTS (partial - needs full tab implementation)
- ❌ `/supermarkets/[id]/about` - Separate about page (currently tab on main page)
- ❌ `/supermarkets/[id]/products` - Separate products page
- ❌ `/supermarkets/[id]/coupons` - Separate coupons page
- ❌ `/supermarkets/[id]/bundles` - Separate bundles page
- ❌ `/supermarkets/[id]/sales` - Separate sales page
- ❌ `/supermarkets/[id]/jobs` - Separate jobs page
- ❌ `/supermarkets/[id]/reviews` - Separate reviews page

### Account Pages:
- ✅ `/account` - EXISTS
- ✅ `/account/favorites` - EXISTS (mock data)
- ✅ `/account/followed-supermarkets` - EXISTS
- ✅ `/account/videos` - EXISTS (mock data)
- ❌ `/account/recipes` - User's own recipes
- ❌ `/account/shopping-lists` - User's shopping lists
- ❌ `/account/subscription` - For supermarkets to manage subscription

### Admin Pages:
- ✅ `/admin` - EXISTS
- ✅ `/admin/products` - EXISTS
- ✅ `/admin/products/bulk-upload` - EXISTS (COMPLETE)
- ✅ `/admin/supermarkets` - EXISTS
- ❌ `/admin/supermarkets/[id]` - View/Edit supermarket details
- ❌ `/admin/supermarkets/[id]/bulk-upload` - EXISTS (needs verification)
- ❌ `/admin/recipes` - Recipe management
- ❌ `/admin/ingredients` - Ingredient management
- ❌ `/admin/ingredient-mappings` - Review pending mappings
- ❌ `/admin/subscriptions` - Subscription management
- ❌ `/admin/analytics` - Platform analytics

### Other Pages:
- ✅ `/feed` - EXISTS (partial)
- ❌ `/check-availability` - Ingredient availability checker
- ❌ `/subscribe` - Supermarket subscription page
- ❌ `/billing` - Supermarket billing page

---

## 🧩 MISSING COMPONENTS

### Recipe Components:
- ❌ `<IngredientSearch />` - Supercook-like ingredient selection interface
- ❌ `<RecipeCard />` - Dedicated recipe card component (currently inline in pages)
- ❌ `<IngredientAutocomplete />` - Autocomplete for ingredient selection
- ❌ `<RecipeForm />` - Complete recipe creation/editing form
- ❌ `<RatingDisplay />` - Star rating display
- ❌ `<RatingInput />` - Star rating input

### Video Components:
- ✅ `<VideoEmbed />` - EXISTS
- ✅ `<VideoList />` - EXISTS
- ✅ `<VideoPlayer />` - EXISTS
- ✅ `<VideoSubmit />` - EXISTS
- ❌ `<VideoCard />` - Video card for listings
- ❌ `<VideoCommentSection />` - Video comments component
- ❌ `<VideoReactions />` - Reaction buttons component
- ❌ `<VideoStats />` - Display like count, views, etc.

### Supermarket Components:
- ❌ `<SupermarketHeader />` - Banner + profile picture + info
- ❌ `<SupermarketTabs />` - Tab navigation component
- ❌ `<SupermarketProductsTab />` - Products tab content
- ❌ `<SupermarketCouponsTab />` - Coupons tab content
- ❌ `<SupermarketBundlesTab />` - Bundles tab content
- ❌ `<SupermarketJobsTab />` - Jobs tab content
- ❌ `<SupermarketAboutTab />` - About tab content
- ❌ `<SupermarketReviewsTab />` - Reviews tab content
- ❌ `<DirectionsButton />` - Redirect to device maps
- ❌ `<FollowButton />` - Follow/unfollow supermarket

### Social & Feed Components:
- ❌ `<FeedItem />` - Individual feed item
- ❌ `<FeedList />` - Feed items list
- ❌ `<CommentSection />` - Recipe comments section
- ❌ `<CommentForm />` - Add comment form
- ❌ `<CommentList />` - EXISTS (may need enhancements)
- ❌ `<ShareButtons />` - Social media sharing
- ❌ `<FavoriteButton />` - Favorite/unfavorite recipe

### Shopping Components:
- ❌ `<ShoppingListForm />` - Create/edit shopping list
- ❌ `<ShoppingListItem />` - Individual shopping list item
- ❌ `<ShoppingListGrid />` - Grid of shopping lists
- ❌ `<AvailabilityModal />` - Modal for checking ingredient availability
- ❌ `<AvailabilityResults />` - Display availability check results
- ❌ `<AddToCartButton />` - Add product to cart

### Other Components:
- ❌ `<IngredientTag />` - Display ingredient as a tag
- ❌ `<RecipeMetadata />` - Display prep time, servings, difficulty
- ❌ `<CookingInstructions />` - Display step-by-step instructions
- ❌ `<IngredientsList />` - Display recipe ingredients
- ❌ `<NutritionInfo />` - Display nutritional information

---

## 🔧 MISSING UTILITIES & HOOKS

### Utilities:
- ❌ `lib/recipes/search.ts` - Supercook-like search algorithm
- ❌ `lib/recipes/normalizer.ts` - Ingredient name normalization
- ❌ `lib/recipes/autocomplete.ts` - Ingredient autocomplete
- ❌ `lib/ingredients/matcher.ts` - Product to ingredient matching
- ❌ `lib/ingredients/extractor.ts` - Extract ingredients from product names
- ❌ `lib/availability/check.ts` - Check ingredient availability
- ❌ `lib/geolocation/useCurrentLocation.ts` - Browser geolocation hook
- ❌ `lib/geolocation/distance.ts` - Distance calculation
- ❌ `lib/supermarket/feed.ts` - Feed generation logic
- ❌ `lib/subscriptions/api.ts` - Stripe subscription logic
- ❌ `lib/social/share.ts` - Social sharing utilities

### Custom Hooks:
- ❌ `useIngredientSearch()` - Search and select ingredients
- ❌ `useRecipes()` - Fetch and manage recipes
- ❌ `useRecipe()` - Fetch and manage single recipe
- ❌ `useFavorites()` - Manage user favorites
- ❌ `useRatings()` - Manage recipe ratings
- ❌ `useComments()` - Manage comments
- ❌ `useVideos()` - Manage recipe videos
- ❌ `useSupermarket()` - Fetch supermarket data
- ❌ `useFeed()` - Fetch and manage user feed
- ❌ `useFollow()` - Manage supermarket follows
- ❌ `useShoppingLists()` - Manage shopping lists
- ❌ `useSubscription()` - Manage supermarket subscriptions

---

## 🌍 MISSING INTERNATIONALIZATION

### Translation Files:
- ✅ `messages/en.json` - EXISTS
- ✅ `messages/es.json` - EXISTS
- ✅ `messages/fr.json` - EXISTS
- ✅ `messages/ar.json` - EXISTS
- ❌ **ISSUE**: Need to add ALL new strings for:
  - Recipe features
  - Video features
  - Supermarket profiles
  - Feed system
  - Shopping lists
  - Availability check
  - Subscriptions
  - Social features

### i18n Configuration:
- ❌ Need to add Arabic RTL support in layout
- ❌ Need to add French and Arabic to all navigation
- ❌ Need to ensure all new pages have proper i18n

---

## 🎨 MISSING UI/UX ELEMENTS

### Branding:
- ❌ French-inspired color palette (currently has recette colors)
- ❌ New logo and favicon
- ❌ Updated PWA configuration
- ❌ Consistent styling across all new pages

### Layout & Navigation:
- ❌ Bottom navigation for mobile (key actions)
- ❌ Swipe gestures for mobile
- ❌ Touch-friendly components
- ❌ Supercook-like search bar on homepage
- ❌ Ingredient selection interface on homepage
- ❌ "Only Videos" search filter

### Animations:
- ❌ Loading states (skeletons)
- ❌ Toast notifications
- ❌ Modal system
- ❌ Smooth transitions

---

## 🔒 MISSING SECURITY & PERMISSIONS

### RLS Policies:
- ❌ Recipes table policies
- ❌ Ingredients table policies
- ❌ Recipe comments policies
- ❌ Recipe ratings policies
- ❌ Recipe favorites policies
- ❌ Video tables policies
- ❌ Video comments policies
- ❌ Video reactions policies
- ❌ Supermarket coupons policies
- ❌ Supermarket jobs policies
- ❌ Supermarket bundles policies
- ❌ User follows policies
- ❌ Feed items policies
- ❌ User feed policies
- ❌ Shopping lists policies
- ❌ Subscriptions policies

### Middleware:
- ❌ Subscription gating for supermarket features
- ❌ Admin route protection
- ❌ Supermarket route protection

---

## 📱 MISSING MOBILE FEATURES

- ❌ Responsive design for all new pages
- ❌ Touch-friendly buttons and inputs
- ❌ Bottom navigation bar
- ❌ Swipe gestures for carousels
- ❌ Mobile-optimized forms
- ❌ Push notifications (for feed updates)

---

## 🧪 MISSING TESTS

### Unit Tests:
- ❌ Recipe utilities
- ❌ Ingredient matching
- ❌ Search algorithm
- ❌ Availability check
- ❌ Geolocation
- ❌ Feed generation
- ❌ Subscription logic

### Integration Tests:
- ❌ Recipe CRUD
- ❌ Video CRUD
- ❌ Comment system
- ❌ Rating system
- ❌ Favorite system
- ❌ Follow system
- ❌ Feed system
- ❌ Availability check
- ❌ Shopping lists

### E2E Tests:
- ❌ User flow: Search recipes by ingredients
- ❌ User flow: Check ingredient availability
- ❌ User flow: Add recipe with video
- ❌ User flow: Follow supermarket
- ❌ User flow: Comment and rate recipe
- ❌ User flow: Create shopping list
- ❌ Supermarket flow: Upload CSV inventory
- ❌ Supermarket flow: Subscribe

---

## 🚀 MISSING DEPLOYMENT & SEO

### SEO:
- ❌ Recipe schema.org markup
- ❌ Video schema.org markup
- ❌ Supermarket schema.org markup
- ❌ Meta tags on all new pages
- ❌ Sitemap generation for new pages
- ❌ Robots.txt updates

### Performance:
- ❌ Next.js Image optimization for new pages
- ❌ Caching strategies for new APIs
- ❌ Database query optimization
- ❌ Bundle analysis

---

## 📊 IMPLEMENTATION PRIORITY ROADMAP

### Phase 2: Recipe System (HIGH PRIORITY)
1. **Database**: Create all recipe tables
2. **API**: Implement recipe CRUD APIs
3. **Search**: Implement Supercook-like search algorithm
4. **Pages**: Complete recipe pages with real data
5. **Components**: Create recipe components
6. **Integration**: Connect to ingredient system

### Phase 3: Ingredient System (HIGH PRIORITY)
1. **Database**: Create ingredient tables
2. **Utilities**: Implement normalization and matching
3. **Autocomplete**: Implement ingredient autocomplete
4. **Mapping**: Implement product-ingredient mapping
5. **Seed Data**: Populate with common ingredients

### Phase 4: Video System (HIGH PRIORITY)
1. **Database**: Create video tables
2. **API**: Complete video API routes
3. **Components**: Create video components
4. **Integration**: YouTube/Facebook embed support
5. **Separation**: Ensure recipe comments ≠ video comments

### Phase 5: Supermarket Profiles (HIGH PRIORITY)
1. **Database**: Create remaining supermarket tables
2. **Pages**: Complete supermarket profile with all tabs
3. **Components**: Create profile components
4. **API**: Implement supermarket APIs
5. **Integration**: Connect to existing CSV upload

### Phase 6: Social Features (MEDIUM PRIORITY)
1. **Comments**: Complete comment system (no moderation)
2. **Ratings**: Complete rating system
3. **Favorites**: Complete favorite system
4. **Feed**: Complete feed system
5. **Follow**: Complete follow system

### Phase 7: Availability & Shopping (MEDIUM PRIORITY)
1. **Geolocation**: Implement browser geolocation
2. **Availability**: Implement check algorithm
3. **Modal**: Create availability modal
4. **Shopping Lists**: Complete shopping list feature
5. **Integration**: Connect to cart and Stripe

### Phase 8: Monetization (MEDIUM PRIORITY)
1. **Database**: Create subscription tables
2. **Stripe**: Implement subscription checkout
3. **API**: Implement subscription APIs
4. **Pages**: Create subscription pages
5. **Gating**: Implement feature gating middleware

### Phase 9: Polish (LOW PRIORITY)
1. **Testing**: Write all tests
2. **Performance**: Optimize queries and caching
3. **SEO**: Add markup and meta tags
4. **Branding**: Finalize colors, logo, etc.
5. **i18n**: Complete all translations

---

## 🎯 IMMEDIATE NEXT STEPS

Based on user's request to "continue in given order" and complete everything locally:

1. **FIX API ROUTE**: `/src/app/api/videos/route.ts` has wrong import (`@supabase/server` should be `@/lib/supabase/server`)

2. **COMPLETE DATABASE SCHEMA**: Add all missing tables from above

3. **IMPLEMENT INGREDIENT SYSTEM**: Start with:
   - Create ingredient tables
   - Implement ingredient normalization
   - Implement product-ingredient matching

4. **IMPLEMENT RECIPE SEARCH**: The core Supercook-like feature
   - Create search algorithm
   - Create ingredient autocomplete
   - Create recipe search page

5. **COMPLETE VIDEO SYSTEM**: 
   - Fix API routes
   - Complete video pages
   - Ensure separation from recipe comments

6. **COMPLETE SUPERMARKET PROFILES**:
   - Implement all tabs
   - Create profile components
   - Add follow functionality

7. **IMPLEMENT FEED SYSTEM**:
   - Create feed generation logic
   - Complete feed page
   - Add triggers for new content

8. **IMPLEMENT AVAILABILITY CHECK**:
   - Create geolocation hook
   - Implement availability algorithm
   - Create modal and results display

9. **IMPLEMENT SUBSCRIPTIONS**:
   - Create Stripe product (€50/month)
   - Implement checkout flow
   - Add gating middleware

10. **COMPLETE i18n**:
    - Add all missing strings to fr.json and ar.json
    - Ensure RTL support for Arabic
    - Test all languages

---

## 📈 ESTIMATED EFFORT

| Category | Items | Est. Time |
|----------|-------|-----------|
| Database Schema | 20+ tables | 4-8 hours |
| API Routes | 30+ routes | 8-16 hours |
| Frontend Pages | 15+ pages | 12-24 hours |
| Components | 25+ components | 12-24 hours |
| Utilities & Hooks | 15+ items | 8-12 hours |
| RLS Policies | 15+ policies | 4-8 hours |
| Testing | 50+ tests | 8-16 hours |
| i18n | 500+ strings | 8-12 hours |
| Polish & Bug Fixes | Various | 8-16 hours |
| **TOTAL** | **~190 items** | **80-140 hours** |

---

## 🏆 RECOMMENDATION

Given the complexity and the user's desire to "complete building the entire website's frontend and backend" locally, I recommend:

1. **Start with Database**: Complete all schema additions first
2. **Then API Layer**: Implement all API routes with mock data fallback
3. **Then Frontend**: Build pages and components
4. **Test Incrementally**: Test each feature as it's completed
5. **Integrate**: Connect frontend to backend APIs
6. **Polish**: Add i18n, SEO, performance optimizations

This approach ensures a solid foundation and allows for incremental testing and validation.

---

*This analysis provides a complete roadmap for finishing My Recette. Each item can be implemented independently once its dependencies are met.*