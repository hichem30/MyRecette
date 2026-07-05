# Ingredient & Product Database Design - Comprehensive Solution

## Problem Statement

The current approach has a critical flaw: **How to accurately map user-selected ingredients (like "tomato") to supermarket products (like "Organic Vine Tomatoes 500g" or "Roma Tomatoes 250g")?**

### Challenges to Solve:
1. **Ingredient Normalization**: "tomato" = "tomatoes" = "cherry tomato" = "Roma tomato" = "Organic Vine Tomatoes 500g"
2. **New Products**: When a supermarket adds a new product (e.g., new brand of tomatoes), how does it get mapped to "tomato"?
3. **Product Variations**: Different sizes, brands, types of the same ingredient
4. **Multi-ingredient Products**: A product like "chicken stir-fry kit" contains multiple ingredients
5. **Accuracy**: Avoid false positives (don't match "tomato sauce" when user selects "tomato")
6. **Maintainability**: System should improve over time with minimal manual effort

---

## Proposed Solution: Multi-Layered Approach

### Layer 1: Seed Ingredient Database
Pre-populated database of common ingredients with intelligent matching capabilities.

### Layer 2: Product-Ingredient Mapping
Automatic and manual mapping between supermarket products and ingredients.

### Layer 3: Crowdsourced Refinement
System learns from supermarket uploads and user behavior to improve mappings.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        INGREDIENT SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────┐ │
│  │   INGREDIENTS    │◄───►│   PRODUCTS      │◄───►│RECIPES  │ │
│  │   (Master List) │     │   (Catalog)     │     │         │ │
│  └─────────────────┘     └─────────────────┘     └─────────┘ │
│          ▲                       ▲                          ▲       │
│          │                       │                          │       │
│  ┌───────┴───────┐       ┌───────┴───────┐            │       │
│  │  SYNONYMS     │       │  PRODUCT       │            │       │
│  │  (tomato=     │       │  INGREDIENTS   │            │       │
│  │   tomatoes)   │       │  (mapping)     │            │       │
│  └───────┬───────┘       └───────┬───────┘            │       │
│          │                       │                     │       │
│  ┌───────▼───────┐       ┌───────▼───────┐            │       │
│  │  PATTERNS     │       │  SUPERMARKET   │            │       │
│  │  (regex:      │       │  PRODUCTS     │            │       │
│  │   /tomato/i)  │       │  (pricing,    │            │       │
│  └───────────────┘       │   stock)      │            │       │
│                            └───────────────┘            │       │
│                                                          │       │
│                          ┌───────────────────────────▼───────┐ │
│                          │          SEARCH INDEX               │ │
│                          │  (Denormalized for performance)     │ │
│                          └───────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### 1. Ingredients Master List
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Canonical form (singular, lowercase)
  canonical_name TEXT NOT NULL UNIQUE,
  -- Display forms
  display_name JSONB NOT NULL,  -- {en: "Tomato", fr: "Tomate", es: "Tomate"}
  plural_name TEXT,
  -- Classification
  category TEXT NOT NULL,  -- 'vegetable', 'fruit', 'protein', 'dairy', 'grain', 'spice', 'herb', 'other'
  subcategory TEXT,  -- 'nightshade', 'leafy green', 'root', 'citrus', 'berry', 'poultry', 'beef', 'pork', etc.
  -- Metadata
  is_common BOOLEAN DEFAULT TRUE,  -- Common pantry ingredient
  is_basic BOOLEAN DEFAULT FALSE,  -- Basic cooking ingredient (salt, pepper, oil, etc.)
  description TEXT,
  -- Nutrition (optional)
  calories_per_100g NUMERIC(10,2),
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ingredients_canonical ON ingredients(canonical_name);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_common ON ingredients(is_common) WHERE is_common = TRUE;
```

#### 2. Ingredient Synonyms
```sql
CREATE TABLE ingredient_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  synonym TEXT NOT NULL,
  -- Priority: higher = more common alternative
  priority INTEGER DEFAULT 1,
  -- Context: where this synonym is used (e.g., 'UK', 'US', 'supermarket')
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ingredient_id, synonym)
);

-- Index for fast synonym lookups
CREATE INDEX idx_ingredient_synonyms_synonym ON ingredient_synonyms(synonym);
```

#### 3. Ingredient Patterns
For fuzzy/partial matching using regex patterns
```sql
CREATE TABLE ingredient_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  -- Pattern type: 'contains', 'starts_with', 'ends_with', 'regex'
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('contains', 'starts_with', 'ends_with', 'regex')),
  pattern TEXT NOT NULL,
  -- Confidence score (0-1)
  confidence NUMERIC(3,2) DEFAULT 1.0,
  -- Is this pattern case-sensitive?
  case_sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Example: Tomato patterns
-- contains: tomato, tomatoes
-- regex: /tomato(e)?s?/i
```

#### 4. Ingredient Relationships (Hierarchy & Equivalents)
```sql
CREATE TABLE ingredient_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  related_ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  -- Relationship type
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'synonym',      -- Different names for same thing
    'variation',    -- Different varieties (roma tomato, cherry tomato)
    'substitute',   -- Can be substituted (butter for oil)
    'contains',     -- Contains this ingredient (tomato sauce contains tomato)
    'part_of',      -- Part of (tomato is part of tomato sauce)
    'parent',       -- Category relationship (tomato -> nightshade -> vegetable)
    'child'
  )),
  -- Strength of relationship (0-1)
  strength NUMERIC(3,2) DEFAULT 1.0,
  -- Context (e.g., 'cooking', 'baking', 'raw')
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ingredient_id != related_ingredient_id)
);

-- Index for relationship queries
CREATE INDEX idx_ingredient_relationships_type ON ingredient_relationships(relationship_type);
```

#### 5. Products (Extended)
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_ingredient BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredient_confidence NUMERIC(3,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredient_mapping_status TEXT 
  CHECK (ingredient_mapping_status IN ('auto', 'manual', 'pending', 'ignored')) 
  DEFAULT 'pending';
```

#### 6. Product-Ingredient Mapping
```sql
CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  -- How was this mapping created?
  mapping_method TEXT NOT NULL CHECK (mapping_method IN ('auto_name', 'auto_barcode', 'manual', 'admin')),
  -- Confidence score (0-1)
  confidence NUMERIC(3,2) NOT NULL,
  -- Is this the primary ingredient?
  is_primary BOOLEAN DEFAULT FALSE,
  -- Quantity/weight if known
  quantity NUMERIC(10,2),
  unit TEXT,
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, ingredient_id)
);

-- Indexes
CREATE INDEX idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);
CREATE INDEX idx_product_ingredients_confidence ON product_ingredients(confidence DESC);
```

#### 7. Supermarket Products (Keep existing)
```sql
-- Already created in Phase 1
-- Links supermarket to product with custom pricing/stock
```

#### 8. Pending Ingredient Mappings (For Admin Review)
```sql
CREATE TABLE pending_ingredient_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supermarket_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Suggested ingredient (auto-extracted)
  suggested_ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  suggested_ingredient_name TEXT,
  -- Confidence score
  confidence NUMERIC(3,2) NOT NULL,
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'ignored')) DEFAULT 'pending',
  -- Who resolved it
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin review
CREATE INDEX idx_pending_mappings_status ON pending_ingredient_mappings(status);
CREATE INDEX idx_pending_mappings_created ON pending_ingredient_mappings(created_at DESC);
```

#### 9. Denormalized Search Tables (For Performance)
```sql
-- For fast recipe-ingredient searching
CREATE TABLE recipes_ingredients_denormalized (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  ingredient_canonical TEXT NOT NULL,
  PRIMARY KEY (recipe_id, ingredient_id)
);

-- For fast product-ingredient searching
CREATE TABLE products_ingredients_denormalized (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  ingredient_canonical TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL,
  PRIMARY KEY (product_id, ingredient_id)
);

-- For fast supermarket product searching
CREATE TABLE supermarket_products_ingredients_denormalized (
  supermarket_id UUID NOT NULL,
  product_id UUID NOT NULL,
  ingredient_id UUID NOT NULL,
  ingredient_canonical TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  is_available BOOLEAN NOT NULL,
  PRIMARY KEY (supermarket_id, product_id, ingredient_id)
);

-- Indexes for search
CREATE INDEX idx_supermarket_products_ingredients_supermarket ON supermarket_products_ingredients_denormalized(supermarket_id);
CREATE INDEX idx_supermarket_products_ingredients_ingredient ON supermarket_products_ingredients_denormalized(ingredient_id);
CREATE INDEX idx_supermarket_products_ingredients_availability ON supermarket_products_ingredients_denormalized(supermarket_id, is_available) WHERE is_available = TRUE;
```

---

## Seed Data: Common Ingredients

### Categories & Examples

#### Vegetables
- Tomato (tomatoes, cherry tomato, roma tomato, beefsteak tomato, heirloom tomato)
- Potato (potatoes, russet potato, red potato, sweet potato, yukon gold)
- Onion (onions, red onion, yellow onion, white onion, shallot, green onion)
- Carrot (carrots, baby carrot)
- Bell Pepper (bell peppers, capsicum, red pepper, green pepper)
- Cucumber (cucumbers)
- Lettuce (romaine, iceberg, butter lettuce, arugula, spinach)
- Broccoli
- Cauliflower
- Zucchini
- Eggplant
- Cabbage
- Mushroom (mushrooms, button mushroom, portobello, shiitake)
- Corn (corn, sweet corn, baby corn)
- Peas
- Green Beans
- Asparagus
- Brussels Sprouts

#### Fruits
- Apple (apples, red apple, green apple, fuji, gala)
- Banana (bananas)
- Orange (oranges, navel orange, blood orange)
- Strawberry (strawberries)
- Blueberry (blueberries)
- Raspberry (raspberries)
- Blackberry
- Grape (grapes, red grape, green grape)
- Watermelon
- Pineapple
- Mango
- Kiwi
- Lemon (lemons)
- Lime (limes)
- Avocado (avocados)
- Tomato (also vegetable)

#### Proteins
- Chicken (chicken breast, chicken thigh, whole chicken, ground chicken)
- Beef (beef, ground beef, steak, sirloin, ribeye, filet mignon)
- Pork (pork, pork chop, bacon, ham, sausage)
- Turkey (turkey, ground turkey, turkey breast)
- Fish (salmon, cod, tuna, tilapia, haddock)
- Shrimp (shrimps, prawns)
- Egg (eggs)
- Tofu
- Tempeh
- Lentils
- Chickpeas
- Black Beans
- Kidney Beans

#### Dairy
- Milk (milk, whole milk, skim milk, 2% milk)
- Cheese (cheese, cheddar, mozzarella, parmesan, feta, goat cheese)
- Butter (butter)
- Yogurt (yogurt, greek yogurt, plain yogurt, vanilla yogurt)
- Cream (heavy cream, whipping cream, sour cream)
- Cottage Cheese
- Cream Cheese

#### Grains & Bread
- Rice (rice, white rice, brown rice, basmati rice, jasmine rice)
- Pasta (pasta, spaghetti, penne, macaroni, fusilli)
- Bread (bread, whole wheat bread, white bread, sourdough)
- Flour (flour, all-purpose flour, whole wheat flour)
- Oats (oats, rolled oats, steel-cut oats)
- Quinoa
- Barley
- Couscous
- Polenta

#### Canned & Packaged
- Tomato Sauce
- Tomato Paste
- Coconut Milk
- Chicken Broth
- Beef Broth
- Vegetable Broth
- Olives
- Pickles
- Capers

#### Spices & Herbs
- Salt
- Black Pepper
- Red Pepper Flakes
- Paprika
- Cumin
- Chili Powder
- Garlic Powder
- Onion Powder
- Oregano
- Basil
- Thyme
- Rosemary
- Sage
- Parsley
- Cilantro
- Dill
- Ginger
- Turmeric
- Cinnamon
- Nutmeg
- Cloves
- Vanilla

#### Oils & Vinegars
- Olive Oil
- Vegetable Oil
- Canola Oil
- Coconut Oil
- Sesame Oil
- Balsamic Vinegar
- Apple Cider Vinegar
- White Vinegar
- Red Wine Vinegar

#### Baking
- Sugar (sugar, granulated sugar, brown sugar, powdered sugar)
- Honey
- Maple Syrup
- Baking Powder
- Baking Soda
- Yeast
- Chocolate (chocolate, dark chocolate, milk chocolate, white chocolate)
- Cocoa Powder
- Vanilla Extract

#### Nuts & Seeds
- Almond (almonds)
- Walnut (walnuts)
- Peanut (peanuts)
- Cashew (cashews)
- Pecan
- Hazelnut
- Sunflower Seed
- Pumpkin Seed
- Chia Seed
- Flaxseed

#### Beverages
- Water
- Coffee
- Tea
- Wine (red wine, white wine)
- Beer
- Juice (orange juice, apple juice, etc.)

#### Miscellaneous
- Mayonnaise
- Mustard
- Ketchup
- Soy Sauce
- Hot Sauce
- Worcestershire Sauce
- Peanut Butter
- Jam
- Marmalade
- Gelatin

---

## Ingredient Extraction Algorithm

When a supermarket uploads a product, we need to extract which ingredients it represents.

### Step 1: Normalize Product Name
```typescript
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove punctuation
    .replace(/\b(lb|kg|g|oz|ml|l|piece|pack|box|can)\b/g, '')  // Remove units
    .replace(/\b(organic|fresh|natural|premium|brand name)\b/g, '')  // Remove qualifiers
    .trim();
}

// Example: "Organic Vine Tomatoes 500g" → "organic vine tomatoes"
//          "Acme Brand Free-Range Eggs, 12 Count" → "acme brand free range eggs count"
```

### Step 2: Match Against Known Ingredients
```typescript
async function extractIngredientsFromProduct(productName: string): Promise<{
  ingredient: Ingredient;
  confidence: number;
  matchType: 'exact' | 'synonym' | 'pattern' | 'partial' | 'fuzzy';
}[]> {
  const normalized = normalizeProductName(productName);
  const results: Array<{ ingredient: Ingredient; confidence: number; matchType: string }> = [];
  
  // 1. Try exact match on canonical name
  const exactMatches = await db.query.ingredients.findMany({
    where: (table, { eq }) => eq(table.canonical_name, normalized),
  });
  for (const ingredient of exactMatches) {
    results.push({ ingredient, confidence: 1.0, matchType: 'exact' });
  }
  
  // 2. Try exact match on plural name
  const pluralMatches = await db.query.ingredients.findMany({
    where: (table, { eq }) => eq(table.plural_name, normalized),
  });
  for (const ingredient of pluralMatches) {
    if (!results.some(r => r.ingredient.id === ingredient.id)) {
      results.push({ ingredient, confidence: 1.0, matchType: 'exact' });
    }
  }
  
  // 3. Try synonyms
  const synonymMatches = await db.query.ingredient_synonyms.findMany({
    where: (table, { eq }) => eq(table.synonym, normalized),
    with: { ingredient: true },
  });
  for (const syn of synonymMatches) {
    if (!results.some(r => r.ingredient.id === syn.ingredient.id)) {
      results.push({ 
        ingredient: syn.ingredient, 
        confidence: 0.95, 
        matchType: 'synonym' 
      });
    }
  }
  
  // 4. Try patterns
  const patternMatches = await db.query.ingredient_patterns.findMany({
    where: (table, {}) => {
      // This depends on pattern type
      // For simplicity, we'll handle in code
      return true;
    },
    with: { ingredient: true },
  });
  for (const pattern of patternMatches) {
    const match = testPattern(pattern, normalized);
    if (match && !results.some(r => r.ingredient.id === pattern.ingredient.id)) {
      results.push({ 
        ingredient: pattern.ingredient, 
        confidence: pattern.confidence * match.confidence, 
        matchType: 'pattern' 
      });
    }
  }
  
  // 5. Try partial/fuzzy match
  // Split normalized name into words
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    
    const partialMatches = await db.query.ingredients.findMany({
      where: (table, { or }) => or([
        ilike(table.canonical_name, `%${word}%`),
        ilike(table.plural_name, `%${word}%`),
      ]),
    });
    
    for (const ingredient of partialMatches) {
      if (!results.some(r => r.ingredient.id === ingredient.id)) {
        // Calculate confidence based on word position and length
        const ingredientWords = ingredient.canonical_name.split(/\s+/);
        const matchScore = word.length / Math.max(ingredientWords[0].length, word.length);
        results.push({ 
          ingredient, 
          confidence: 0.7 * matchScore, 
          matchType: 'partial' 
        });
      }
    }
  }
  
  // 6. Try fuzzy match using Levenshtein distance
  // Only for single-word ingredients
  const singleWordIngredients = await db.query.ingredients.findMany({
    where: (table, { not }) => not(contains(table.canonical_name, ' ')),
  });
  
  for (const ingredient of singleWordIngredients) {
    if (!results.some(r => r.ingredient.id === ingredient.id)) {
      const distance = levenshtein(normalized, ingredient.canonical_name);
      const maxLen = Math.max(normalized.length, ingredient.canonical_name.length);
      const similarity = 1 - (distance / maxLen);
      if (similarity > 0.6) {
        results.push({ 
          ingredient, 
          confidence: 0.6 * similarity, 
          matchType: 'fuzzy' 
        });
      }
    }
  }
  
  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);
  
  // Filter low confidence matches
  return results.filter(r => r.confidence >= 0.5);
}
```

### Step 3: Handle Multiple Matches
```typescript
function selectBestMatches(
  candidates: Array<{ ingredient: Ingredient; confidence: number; matchType: string }>,
  maxMatches: number = 3
): Array<{ ingredient: Ingredient; confidence: number; matchType: string }> {
  // Group by ingredient category to get diverse results
  const byCategory: Record<string, Array<typeof candidates[0]>> = {};
  
  for (const candidate of candidates) {
    const category = candidate.ingredient.category;
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(candidate);
  }
  
  // Select top from each category
  const selected: Array<typeof candidates[0]> = [];
  for (const category in byCategory) {
    const sorted = byCategory[category].sort((a, b) => b.confidence - a.confidence);
    selected.push(sorted[0]);
  }
  
  // Sort all selected by confidence
  selected.sort((a, b) => b.confidence - a.confidence);
  
  // Return top matches
  return selected.slice(0, maxMatches);
}
```

### Step 4: Auto-Link or Flag for Review
```typescript
async function processProductIngredientMapping(
  productId: string,
  productName: string,
  supermarketId?: string
): Promise<{
  createdMappings: number;
  needsReview: boolean;
  suggestions: Array<{ ingredient: Ingredient; confidence: number }>;
}> {
  const candidates = await extractIngredientsFromProduct(productName);
  const bestMatches = selectBestMatches(candidates, 3);
  
  if (bestMatches.length === 0) {
    return { createdMappings: 0, needsReview: true, suggestions: [] };
  }
  
  if (bestMatches[0].confidence >= 0.9) {
    // High confidence - auto-link
    for (const match of bestMatches.slice(0, 2)) {
      // Check if mapping already exists
      const existing = await db.query.product_ingredients.findFirst({
        where: (table, { and }) => and([
          eq(table.product_id, productId),
          eq(table.ingredient_id, match.ingredient.id)
        ]),
      });
      
      if (!existing) {
        await db.insert(product_ingredients).values({
          product_id: productId,
          ingredient_id: match.ingredient.id,
          mapping_method: 'auto_name',
          confidence: match.confidence,
          is_primary: bestMatches[0].ingredient.id === match.ingredient.id,
        });
      }
    }
    
    return { 
      createdMappings: bestMatches.slice(0, 2).length, 
      needsReview: false, 
      suggestions: bestMatches 
    };
  } else if (bestMatches[0].confidence >= 0.7) {
    // Medium confidence - auto-link primary, flag others for review
    const primary = bestMatches[0];
    await db.insert(product_ingredients).values({
      product_id: productId,
      ingredient_id: primary.ingredient.id,
      mapping_method: 'auto_name',
      confidence: primary.confidence,
      is_primary: true,
    });
    
    // Flag for review if there are other candidates
    if (bestMatches.length > 1) {
      await db.insert(pending_ingredient_mappings).values({
        product_id: productId,
        supermarket_id: supermarketId,
        suggested_ingredient_id: bestMatches[1].ingredient.id,
        suggested_ingredient_name: bestMatches[1].ingredient.canonical_name,
        confidence: bestMatches[1].confidence,
      });
    }
    
    return { 
      createdMappings: 1, 
      needsReview: bestMatches.length > 1, 
      suggestions: bestMatches 
    };
  } else {
    // Low confidence - flag all for review
    for (const match of bestMatches) {
      await db.insert(pending_ingredient_mappings).values({
        product_id: productId,
        supermarket_id: supermarketId,
        suggested_ingredient_id: match.ingredient.id,
        suggested_ingredient_name: match.ingredient.canonical_name,
        confidence: match.confidence,
      });
    }
    
    return { 
      createdMappings: 0, 
      needsReview: true, 
      suggestions: bestMatches 
    };
  }
}
```

---

## CSV Upload Enhanced Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENHANCED CSV UPLOAD FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SUPERMARKET UPLOADS CSV                                    │
│     ┌─────────────────────────┐                                │
│     │ sku,barcode,name,...     │                                │
│     │ PROD001,12345,Organic... │                                │
│     │ PROD002,56789,Fresh Chi...│                                │
│     └─────────────────────────┘                                │
│                                                                  │
│  2. PARSE & VALIDATE CSV                                        │
│     ✓ Check required fields                                     │
│     ✓ Validate data types                                      │
│     ✓ Check for duplicates                                      │
│                                                                  │
│  3. PROCESS EACH ROW                                             │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │  FOR EACH PRODUCT ROW:                                   │ │
│     │                                                             │ │
│     │  a) Try to find existing product (barcode → SKU → name)  │ │
│     │     ┌─────────────────┐                                 │ │
│     │     │ Match found?     │                                 │ │
│     │     │    YES          │────► Use existing product     │ │
│     │     │    NO           │                                 │ │
│     │     └────────┬────────┘                                 │ │
│     │              │                                             │ │
│     │              ▼                                             │ │
│     │     b) Create new product                                 │ │
│     │                                                             │ │
│     │  c) EXTRACT INGREDIENTS FROM PRODUCT NAME                 │ │
│     │     ┌─────────────────┐                                 │ │
│     │     │ "Organic Vine    │                                 │ │
│     │     │  Tomatoes 500g"  │────► Extract: [tomato]         │ │
│     │     └─────────────────┘     confidence: 0.95            │ │
│     │                                                             │ │
│     │  d) LINK PRODUCT TO INGREDIENTS                            │ │
│     │     ┌─────────────────┐                                 │ │
│     │     │ Confidence ≥ 0.9 │────► Auto-link                │ │
│     │     │ Confidence 0.7-0.9│──► Auto-link primary,        │ │
│     │     │                   │     flag others for review    │ │
│     │     │ Confidence < 0.7 │────► Flag all for review      │ │
│     │     └─────────────────┘                                 │ │
│     │                                                             │ │
│     │  e) CREATE SUPERMARKET_PRODUCTS ENTRY                    │ │
│     │     (with custom pricing/stock)                         │ │
│     └─────────────────────────────────────────────────────────┘ │
│                                                                  │
│  4. UPDATE DENORMALIZED TABLES                                  │
│     ✓ recipes_ingredients_denormalized                         │
│     ✓ products_ingredients_denormalized                         │
│     ✓ supermarket_products_ingredients_denormalized            │
│                                                                  │
│  5. RETURN RESULTS TO USER                                      │
│     ✓ Total rows processed                                     │
│     ✓ Products created/updated                                 │
│     ✓ Ingredients matched                                      │
│     ✓ Items needing review (if any)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ingredient Search Flow (Supercook-Style)

```
┌─────────────────────────────────────────────────────────────────┐
│                    INGREDIENT SEARCH FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. USER SELECTS INGREDIENTS                                    │
│     ┌─────────────────────────┐                                │
│     │ [chicken] [eggs] [tomatoes] │                              │
│     └─────────────────────────┘                                │
│                                                                  │
│  2. NORMALIZE SELECTIONS                                         │
│     chicken  → "chicken"                                         │
│     eggs     → "egg"      (singular)                            │
│     tomatoes → "tomato"   (singular)                            │
│                                                                  │
│  3. FIND MATCHING RECIPES                                        │
│     SELECT recipes.*                                             │
│     FROM recipes_ingredients_denormalized                       │
│     WHERE ingredient_canonical IN ('chicken', 'egg', 'tomato')  │
│     GROUP BY recipe_id                                           │
│     ORDER BY COUNT(*) DESC, rating DESC                         │
│                                                                  │
│     Returns: Recipes that contain ALL or ANY of selected          │
│     ingredients, ranked by:                                      │
│     - Number of matching ingredients (most first)               │
│     - Recipe rating (highest first)                             │
│     - Recipe popularity (most viewed first)                      │
│     - Recipe date (newest first)                                │
│                                                                  │
│  4. FOR EACH RECIPE, FIND MISSING INGREDIENTS                    │
│     Recipe requires: [chicken, egg, tomato, olive oil]          │
│     User has: [chicken, egg, tomato]                            │
│     Missing: [olive oil]                                         │
│                                                                  │
│  5. CHECK AVAILABILITY AT NEARBY SUPERMARKETS                    │
│     a) Get user location (browser geolocation API)              │
│     b) Find supermarkets within radius (PostGIS)                  │
│     c) For each supermarket:                                     │
│        - Check which recipe ingredients they have                │
│        - Use supermarket_products_ingredients_denormalized      │
│        - Filter by: is_available = true                          │
│     d) Rank supermarkets by:                                     │
│        - Number of matching ingredients (most first)             │
│        - Distance from user (closest first)                      │
│        - Total price for matching ingredients (cheapest first)   │
│                                                                  │
│  6. DISPLAY RESULTS                                              │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │  SUPERMARKET A  │  2.5 km  │  3/4 ingredients  │  €8.50  │ │
│     │  SUPERMARKET B  │  5.1 km  │  4/4 ingredients  │  €9.20  │ │
│     │  SUPERMARKET C  │  1.2 km  │  2/4 ingredients  │  €7.80  │ │
│     └─────────────────────────────────────────────────────────┘ │
│                                                                  │
│     For each supermarket, show:                                  │
│     - Which ingredients they have                               │
│     - Which they don't have                                      │
│     - Price for each ingredient                                  │
│     - Total estimated cost                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin Review Interface

Supermarkets and admins need a way to review and manage ingredient mappings.

### Pending Mappings Page (`/admin/ingredients/pending`)

```
┌─────────────────────────────────────────────────────────────────┐
│  PENDING INGREDIENT MAPPINGS                              [Filter]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stats: 24 pending | 12 approved | 5 rejected                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ PRODUCT NAME          │ SUGGESTED INGREDIENT │ CONFIDENCE │ │
│  ├─────────────────────────┼─────────────────────┼────────────┤ │
│  │ Acme Fresh Vine...     │ Tomato               │ 0.85       │ │
│  │ Organic Roma Tom...    │ Tomato               │ 0.92       │ │
│  │ Free Range Chick...    │ Chicken              │ 0.78       │ │
│  │ Large Brown Eggs       │ Egg                  │ 0.95       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Actions for each row:                                           │
│  [✓ Approve] [✗ Reject] [🔍 Edit] [🗑️ Ignore]                  │
│                                                                  │
│  Bulk actions:                                                  │
│  [✓ Approve All] [✗ Reject All] [🗑️ Ignore All]                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Approve/Reject Logic

```typescript
// Approve a pending mapping
async function approvePendingMapping(id: string, adminId: string) {
  const pending = await db.query.pending_ingredient_mappings.findFirst({
    where: eq(table.id, id),
  });
  
  if (!pending) return;
  
  // Create the product_ingredients mapping
  await db.insert(product_ingredients).values({
    product_id: pending.product_id,
    ingredient_id: pending.suggested_ingredient_id!,
    mapping_method: 'admin',
    confidence: 1.0,  // Admin-approved = high confidence
    is_primary: true,
  });
  
  // Mark as resolved
  await db.update(pending_ingredient_mappings)
    .set({ status: 'approved', resolved_by: adminId, resolved_at: new Date() })
    .where(eq(table.id, id));
  
  // Update denormalized tables
  await updateDenormalizedTables(pending.product_id);
}

// Reject a pending mapping
async function rejectPendingMapping(id: string, adminId: string, reason?: string) {
  await db.update(pending_ingredient_mappings)
    .set({ 
      status: 'rejected', 
      resolved_by: adminId, 
      resolved_at: new Date(),
      notes: reason 
    })
    .where(eq(table.id, id));
}

// Ignore a pending mapping (don't show again)
async function ignorePendingMapping(id: string, adminId: string) {
  await db.update(pending_ingredient_mappings)
    .set({ 
      status: 'ignored', 
      resolved_by: adminId, 
      resolved_at: new Date() 
    })
    .where(eq(table.id, id));
}
```

---

## Supermarket Product Management

### Add New Product Flow (Manual)

```
┌─────────────────────────────────────────────────────────────────┐
│  ADD NEW PRODUCT                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BASIC INFO                                                       │
│  Name:        [Organic Vine Tomatoes 500g]                       │
│  SKU:         [PROD-001]                                         │
│  Barcode:     [123456789012]                                    │
│  Category:    [Produce ▼]                                        │
│  Description: [Fresh organic...]                                 │
│                                                                  │
│  PRICING & STOCK                                                  │
│  Price:       [€2.99]                                            │
│  Stock:       [50]                                               │
│  Unit:        [kg ▼]                                             │
│                                                                  │
│  INGREDIENT MAPPING                                              │
│  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  EXTRACTED INGREDIENTS:                                     │ │ │
│  │  ✓ Tomato (confidence: 95%)     [REMOVE]                   │ │ │
│  │                                                             │ │ │
│  │  SUGGESTED ADDITIONS:                                        │ │ │
│  │  + Vine (confidence: 60%)       [ADD]                      │ │ │
│  │  + Organic (confidence: 40%)   [ADD] [IGNORE]              │ │ │
│  └─────────────────────────────────────────────────────────┘ │ │
│                                                                  │
│  OR: Link to existing ingredient:                              │
│  [Search ingredients...]                                        │
│                                                                  │
│  [SAVE PRODUCT]                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ingredient Search for Manual Linking

```typescript
// Search ingredients with autocomplete
async function searchIngredients(query: string, limit: number = 10) {
  const normalized = normalizeIngredient(query);
  
  // Search by canonical name
  const canonicalMatches = await db.query.ingredients.findMany({
    where: ilike(table.canonical_name, `%${normalized}%`),
    limit,
    orderBy: desc(table.is_common),
  });
  
  // Search by plural name
  const pluralMatches = await db.query.ingredients.findMany({
    where: ilike(table.plural_name, `%${normalized}%`),
    limit,
  });
  
  // Search by synonyms
  const synonymMatches = await db.query.ingredient_synonyms.findMany({
    where: ilike(table.synonym, `%${normalized}%`),
    limit,
    with: { ingredient: true },
  });
  
  // Merge and deduplicate
  const results = [
    ...canonicalMatches,
    ...pluralMatches,
    ...synonymMatches.map(s => s.ingredient),
  ];
  
  return uniqueBy(results, 'id').slice(0, limit);
}
```

---

## Ingredient Synonyms & Patterns

### Seed Data for Common Ingredients

```sql
-- Tomato synonyms
INSERT INTO ingredient_synonyms (ingredient_id, synonym, priority, context)
VALUES 
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'tomatoes', 1, 'general'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'tomatoe', 2, 'spelling'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'roma tomato', 1, 'variety'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'cherry tomato', 1, 'variety'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'beefsteak tomato', 1, 'variety'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'heirloom tomato', 1, 'variety');

-- Tomato patterns
INSERT INTO ingredient_patterns (ingredient_id, pattern_type, pattern, confidence)
VALUES 
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'contains', 'tomato', 0.95),
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'contains', 'tomatoes', 0.95),
  ((SELECT id FROM ingredients WHERE canonical_name = 'tomato'), 'regex', '/tomato(e)?s?/i', 0.90);

-- Egg synonyms
INSERT INTO ingredient_synonyms (ingredient_id, synonym, priority, context)
VALUES 
  ((SELECT id FROM ingredients WHERE canonical_name = 'egg'), 'eggs', 1, 'general'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'egg'), 'chicken egg', 1, 'specification'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'egg'), 'free range egg', 1, 'quality');

-- Potato synonyms
INSERT INTO ingredient_synonyms (ingredient_id, synonym, priority, context)
VALUES 
  ((SELECT id FROM ingredients WHERE canonical_name = 'potato'), 'potatoes', 1, 'general'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'potato'), 'russet potato', 1, 'variety'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'potato'), 'red potato', 1, 'variety'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'potato'), 'yukon gold', 1, 'variety'),
  ((SELECT id FROM ingredients WHERE canonical_name = 'potato'), 'sweet potato', 2, 'different');
```

---

## Search Query Examples

### 1. Find Recipes by Ingredients

```sql
-- Find recipes containing ALL selected ingredients
WITH recipe_matches AS (
  SELECT 
    r.id as recipe_id,
    r.title,
    r.average_rating,
    r.view_count,
    COUNT(DISTINCT ri.ingredient_id) as match_count,
    array_agg(DISTINCT ri.ingredient_id) as matched_ingredients
  FROM recipes r
  JOIN recipes_ingredients_denormalized ri ON r.id = ri.recipe_id
  WHERE ri.ingredient_canonical IN ('chicken', 'egg', 'tomato')
  GROUP BY r.id
)
SELECT 
  rm.*,
  (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = rm.recipe_id) as total_ingredients,
  round((rm.match_count::float / (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = rm.recipe_id)) * 100, 0) as match_percentage
FROM recipe_matches rm
WHERE rm.match_count = 3  -- All ingredients match
ORDER BY rm.average_rating DESC, rm.view_count DESC
LIMIT 20;
```

### 2. Find Supermarkets with Ingredients

```sql
-- Find supermarkets near user that have recipe ingredients
WITH user_location AS (
  SELECT ST_MakePoint(-80.0, 40.0)::geography as location  -- From browser geolocation
),
nearby_supermarkets AS (
  SELECT 
    p.id as supermarket_id,
    p.supermarket_name,
    p.location_geometry,
    ST_Distance(p.location_geometry, (SELECT location FROM user_location)) / 1000 as distance_km
  FROM profiles p
  WHERE p.is_supermarket = TRUE
    AND p.subscription_status = 'active'
    AND p.location_geometry IS NOT NULL
  HAVING ST_Distance(p.location_geometry, (SELECT location FROM user_location)) / 1000 <= 25  -- 25km radius
  ORDER BY distance_km ASC
),
ingredient_availability AS (
  SELECT 
    ns.supermarket_id,
    ns.supermarket_name,
    ns.distance_km,
    COUNT(DISTINCT sp.ingredient_id) as matching_ingredient_count,
    SUM(sp.price) as total_price,
    array_agg(DISTINCT sp.ingredient_id) as matched_ingredients
  FROM nearby_supermarkets ns
  JOIN supermarket_products_ingredients_denormalized sp ON ns.supermarket_id = sp.supermarket_id
  WHERE sp.ingredient_canonical IN ('chicken', 'egg', 'tomato')
    AND sp.is_available = TRUE
  GROUP BY ns.supermarket_id, ns.supermarket_name, ns.distance_km
)
SELECT 
  ia.*,
  3 as total_ingredients,  -- From recipe
  round((ia.matching_ingredient_count::float / 3) * 100, 0) as match_percentage
FROM ingredient_availability ia
ORDER BY ia.matching_ingredient_count DESC, ia.distance_km ASC, ia.total_price ASC;
```

---

## Implementation Roadmap

### Step 1: Database Setup
- [ ] Create all new tables (ingredients, ingredient_synonyms, ingredient_patterns, ingredient_relationships, product_ingredients, pending_ingredient_mappings)
- [ ] Create denormalized search tables
- [ ] Create indexes
- [ ] Create RLS policies
- [ ] Populate seed data (common ingredients)

### Step 2: Ingredient Extraction Service
- [ ] Implement `normalizeProductName()`
- [ ] Implement `extractIngredientsFromProduct()`
- [ ] Implement `selectBestMatches()`
- [ ] Implement `processProductIngredientMapping()`
- [ ] Create API endpoints for ingredient management

### Step 3: Enhanced CSV Upload
- [ ] Update bulk upload to use new ingredient extraction
- [ ] Add ingredient matching to CSV processing
- [ ] Update preview to show ingredient mappings
- [ ] Update results to include ingredient info

### Step 4: Admin Review Interface
- [ ] Create `/admin/ingredients/pending` page
- [ ] Create approve/reject/ignore functions
- [ ] Create bulk actions
- [ ] Add ingredient management pages

### Step 5: Search Implementation
- [ ] Implement recipe search by ingredients
- [ ] Implement availability checking
- [ ] Implement denormalized table updates
- [ ] Optimize search queries

### Step 6: Maintenance Tools
- [ ] Create ingredient merge tool (for duplicates)
- [ ] Create synonym management
- [ ] Create pattern management
- [ ] Create relationship management

---

## Benefits of This Design

### 1. Accuracy
- Multi-layered matching (exact, synonym, pattern, fuzzy)
- Confidence scoring for each match
- Admin review for low-confidence matches
- Continuous improvement over time

### 2. Flexibility
- Handles new products automatically
- Handles product variations
- Handles different naming conventions
- Handles multi-ingredient products

### 3. Performance
- Denormalized tables for fast searching
- Proper indexing
- Batch processing for CSV uploads
- Efficient search queries

### 4. Maintainability
- Seed database of common ingredients
- Crowdsourced refinement
- Admin tools for management
- Learning system that improves over time

### 5. User Experience
- Accurate ingredient matching
- Handles user typos and variations
- Clear feedback on matches
- Easy to find products for recipes

---

## Next Steps

**Recommended Implementation Order:**

1. **Seed Database First** - Populate with ~500 common ingredients, synonyms, and patterns
2. **Ingredient Extraction** - Implement the core matching algorithms
3. **Enhanced CSV Upload** - Update existing CSV upload with ingredient extraction
4. **Admin Review** - Create interface for managing pending mappings
5. **Search Implementation** - Implement recipe and availability search

**Would you like me to:**
1. Create the seed ingredient database SQL?
2. Implement the ingredient extraction functions?
3. Update the CSV upload with ingredient extraction?
4. Create the admin review interface?

This design provides a solid foundation that handles all your requirements:
- ✅ New products just released
- ✅ Different variations of products
- ✅ Common ingredients like tomato, potato
- ✅ Accurate matching between user selections and supermarket products
