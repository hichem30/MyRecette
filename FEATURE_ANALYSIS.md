# My Recette - Feature Analysis & Missing Elements

## User Requirements Clarification

Based on your latest input:

1. **NO Content Moderation**: Comments auto-approved, no admin moderation
2. **NO Map API**: Location button redirects to device map app (geo: or maps.google.com URLs)
3. **Supercook-like Search**: Users SELECT ingredients → get recipes containing those ingredients (not text search)
4. **CSV Bulk Upload**: Supermarkets must bulk upload inventory via CSV in admin panel
5. **Focus**: Make admin panel work perfectly for supermarket inventory management

---

## Core Feature Flow Analysis

### User Side

#### 1. Ingredient-Based Recipe Search (Supercook-Style)
```
USER: Selects ingredients they have (chicken, eggs, tomatoes)
→ SYSTEM: Returns recipes containing ANY or ALL of these ingredients
→ USER: Can filter by dietary, meal type, time, difficulty, rating
→ USER: Clicks recipe → sees details with "Check Availability" button
```

#### 2. Availability Check Flow
```
USER: Clicks "Check Availability" on recipe
→ SYSTEM: Requests browser geolocation (no map API)
→ USER: Grants location access
→ SYSTEM: Finds supermarkets within X km using PostGIS
→ SYSTEM: Checks which recipe ingredients each supermarket has
→ SYSTEM: Displays results with distance, matching count, total price
→ USER: Can add all available to cart or create shopping list
```

#### 3. Supermarket Profile Flow
```
USER: Visits supermarket profile
→ SEES: Banner, profile picture, name, rating, followers, location
→ SEES: Tabs: About, Products, Coupons, Bundles, Jobs, Reviews
→ USER: Clicks "Get Directions" → redirects to device map app
→ USER: Browses Products tab → can add to cart
→ USER: Clicks "Follow" → supermarket posts appear in feed
```

### Supermarket Side (Admin Panel)

#### 1. Inventory Management
```
ADMIN: Goes to /admin/products
→ SEES: Existing products list
→ CLICKS: "Upload CSV" button
→ UPLOADS: CSV file with inventory
→ SYSTEM: Parses CSV, validates, previews changes
→ ADMIN: Confirms
→ SYSTEM: Imports data (creates/updates products and supermarket_products)
```

#### 2. Profile Management
```
ADMIN: Goes to /admin/supermarket/profile
→ SEES: Form with all supermarket details
→ EDITS: Banner, profile picture, name, description, address, contact info
→ SAVES: Updates profiles table
```

---

## Missing Logic & Elements Identified

### 1. INGREDIENT NORMALIZATION SYSTEM
**Problem**: "tomato" vs "tomatoes" vs "cherry tomato" should match same recipes
**Solution**: 
- Normalization function (lowercase, singular/plural handling)
- Aliases table for common variations
- Applied when: user searches, recipe creation, CSV import

### 2. RECIPE SEARCH ALGORITHM
**Problem**: Efficiently find recipes by selected ingredients
**Solution**:
- Denormalized `recipes_ingredients_denormalized` table
- Query: `SELECT recipes WHERE ingredient IN (selected) GROUP BY recipe ORDER BY COUNT(*) DESC`
- Rank by: match count, rating, popularity

### 3. CSV BULK UPLOAD (HIGHEST PRIORITY)
**Problem**: Supermarkets need to upload inventory via CSV
**Solution**:
- CSV format: sku, barcode, name, category, price, stock, description, brand, unit
- Validation: Required fields, numeric checks
- Matching: Try barcode → SKU → name to find existing products
- Processing: Create new products if no match, link via `supermarket_products`

### 4. GEOLOCATION FOR AVAILABILITY
**Problem**: Find nearby supermarkets without map API
**Solution**:
- Browser Geolocation API for user location
- PostGIS `ST_Distance` for finding supermarkets within radius
- NO Google Maps integration (just redirect for directions button)

### 5. AVAILABILITY CHECK MODAL
**Problem**: Show which supermarkets have recipe ingredients
**Solution**:
- Modal with List and Map view tabs
- List view: Supermarkets sorted by distance/match count
- Map view: Just redirect to Google Maps with all locations
- Show: distance, matching ingredients, total price

### 6. INGREDIENT AUTOCOMPLETE
**Problem**: Users need fast ingredient selection
**Solution**:
- Search `ingredients` table + fallback to `products` table
- Return: name, category
- Deduplicate results

---

## Database Tables Needed

### Core Tables
1. **recipes** - Recipe metadata
2. **ingredients** - Master ingredient list (for autocomplete)
3. **recipe_ingredients** - Link recipes to ingredients
4. **recipe_dietary_tags** - Dietary filters (vegetarian, vegan, etc.)
5. **recipe_meal_types** - Meal type filters (breakfast, lunch, etc.)

### Social Tables
6. **user_favorites** - Users save favorite recipes
7. **comments** - Recipe comments (no moderation)
8. **ratings** - Recipe ratings (1-5 stars)

### Supermarket Tables
9. **profiles** (extend) - Add supermarket fields
10. **supermarket_products** - Supermarket-specific pricing/stock
11. **supermarket_coupons** - Discount codes
12. **supermarket_jobs** - Job postings
13. **user_follows** - Users follow supermarkets

### Feed Tables
14. **feed_items** - What supermarkets post
15. **user_feed** - What users see in their feed

### Shopping Tables
16. **shopping_lists** - User shopping lists
17. **shopping_list_items** - Items in lists

### Subscription Tables
18. **subscriptions** - Supermarket subscriptions
19. **subscription_history** - Payment history

---

## CSV Bulk Upload - Complete Implementation

### CSV Format
```csv
sku,barcode,name,category,price,stock,description,brand,unit,location_in_store
PROD001,12345678,Organic Tomatoes,produce,2.99,50,Vine ripened organic tomatoes,Acme Farm,kg,
PROD002,87654321,Free Range Eggs,produce,3.50,100,Large free range eggs,Happy Farms,dozen,
```

### Processing Flow
1. Parse CSV using Papa Parse
2. Validate each row (required fields, numeric values)
3. For each row:
   a. Try to find product by barcode
   b. If not found, try by SKU
   c. If not found, try by name
   d. If found: Create/Update `supermarket_products` entry
   e. If not found: Create new `products` entry + new `supermarket_products` entry
4. Return summary: imported, updated, errors

### Admin UI Component
- File upload input with drag & drop
- CSV template download link
- Preview table showing parsed data
- Validation status for each row (valid/warning/error)
- Summary stats (total rows, new products, updated products)
- Confirm import button

### Backend API
- POST /api/admin/supermarket/bulk-upload
- Accepts: CSV file
- Returns: { success, importedCount, updatedCount, errors }
- Processes in batches (50-100 rows)
- Transaction support for rollback

---

## Admin Panel Pages Structure

```
/app/admin/
├── page.tsx                    # Dashboard (existing)
├── products/
│   ├── page.tsx                # Products list (existing)
│   └── bulk-upload/
│       └── page.tsx            # NEW: CSV bulk upload page
├── supermarket/
│   ├── page.tsx                # NEW: Supermarket management list
│   ├── profile/
│   │   └── page.tsx            # NEW: Edit supermarket profile
│   ├── inventory/
│   │   └── page.tsx            # NEW: Inventory management
│   ├── coupons/
│   │   └── page.tsx            # NEW: Coupon management
│   ├── jobs/
│   │   └── page.tsx            # NEW: Job management
│   └── billing/
│       └── page.tsx            # NEW: Subscription management
└── recipes/
    └── page.tsx                # NEW: Recipe management
```

---

## Ingredient Search Algorithm

### Approach 1: Denormalized Table (Recommended)
```sql
CREATE TABLE recipes_ingredients_denormalized (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,  -- Normalized
  PRIMARY KEY (recipe_id, ingredient_name)
);

-- Trigger to keep updated
CREATE TRIGGER trg_recipes_ingredients_denormalized
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_recipes_ingredients_denormalized();
```

### Query
```sql
SELECT r.*, COUNT(rid.ingredient_name) as match_count
FROM recipes r
JOIN recipes_ingredients_denormalized rid ON r.id = rid.recipe_id
WHERE rid.ingredient_name = ANY($1)
GROUP BY r.id
ORDER BY match_count DESC, r.average_rating DESC, r.view_count DESC
LIMIT 20;
```

### Approach 2: JSONB Array (Alternative)
```sql
ALTER TABLE recipes ADD COLUMN searchable_ingredients TEXT[];

-- Trigger to update on recipe change
```

---

## Geolocation Implementation

### Browser API
```typescript
// /hooks/useCurrentLocation.ts
import { useState, useEffect } from 'react';

export function useCurrentLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setIsLoading(true);
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoading(false);
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (err) => {
          setError(err.message);
          setIsLoading(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return { location, error, isLoading, getLocation };
}
```

### PostGIS Query
```sql
SELECT 
  p.id,
  p.supermarket_name,
  p.location_geometry,
  ST_Distance(
    ST_MakePoint($2, $1)::GEOGRAPHY,
    p.location_geometry
  ) / 1000 as distance_km
FROM profiles p
WHERE p.is_supermarket = TRUE
  AND p.subscription_status = 'active'
  AND p.location_geometry IS NOT NULL
HAVING ST_Distance(
  ST_MakePoint($2, $1)::GEOGRAPHY,
  p.location_geometry
) / 1000 <= $3  -- radius in km
ORDER BY distance_km ASC;
```

### Direction Button
```tsx
<a
  href={`geo:${lat},${lng}?q=${encodeURIComponent(address)}`}
  className="..."
>
  Get Directions
</a>
```

---

## Implementation Priority

### PHASE 1: Foundation (Week 1-2)
- [ ] Database schema for ALL tables
- [ ] RLS policies
- [ ] Ingredient normalization
- [ ] Ingredient autocomplete
- [ ] Branding

### PHASE 2: CSV Bulk Upload (Week 3) - **HIGHEST PRIORITY**
- [ ] CSV format definition
- [ ] Admin UI for upload
- [ ] Backend processing API
- [ ] Validation logic
- [ ] Batch processing

### PHASE 3: Recipe System (Week 4-5)
- [ ] Recipe CRUD
- [ ] Recipe pages
- [ ] Search algorithm
- [ ] Comments (no moderation)
- [ ] Ratings

### PHASE 4: Supermarket Profiles (Week 6)
- [ ] Profile pages with tabs
- [ ] Products tab with cart
- [ ] Coupons, Bundles, Jobs tabs
- [ ] Follow system

### PHASE 5: Availability & Shopping (Week 7)
- [ ] Availability check modal
- [ ] Shopping lists
- [ ] Cart integration

### PHASE 6: Feed & Social (Week 8)
- [ ] Feed system
- [ ] User feed page

### PHASE 7: Monetization (Week 9)
- [ ] Stripe subscriptions
- [ ] Subscription gating

---

## Recommended Starting Point

Based on your focus on admin panel CSV upload, I recommend starting with:

**PHASE 2: CSV Bulk Upload**

This gives immediate value to supermarkets and is self-contained:
1. Create `supermarket_products` table
2. Create bulk upload admin page
3. Create backend API for CSV processing
4. Test with sample CSV

Then we can build other features around it.

Would you like me to implement the CSV bulk upload feature first?
