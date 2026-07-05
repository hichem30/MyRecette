# My Recette - Project Development Plan

## Overview
Transform Red Barn Market into **My Recette** - a recipes and products buying platform combining Supercook-like recipe discovery with social features and e-commerce. Users can create/share recipes, check ingredient availability at nearby supermarkets, follow supermarket profiles, and purchase ingredients. Supermarkets pay €50/month subscription.

---

## Current Foundation (Red Barn Market)
- **Stack**: Next.js 14 + TypeScript + Tailwind + Supabase + Stripe
- **Keep**: Admin panel, payment gateway, all existing features
- **Change**: Branding, add recipe system, social features, supermarket profiles

---

## Phase 1: Branding & Foundation (CRITICAL)

### 1.1 Rebranding
- Update project name, favicon, PWA icons
- New color palette (French-inspired: oranges, wines, olives)
- Keep Playfair Display + Inter fonts
- Update all meta tags and manifest

**Files**: Logo.tsx, manifest.json, public/icons/*, package.json, README.md, layout.tsx

### 1.2 Database Schema Updates

#### New Core Tables:
```sql
-- Recipes
CREATE TABLE recipes (id, slug, title, description, instructions, prep_time, cook_time, servings, difficulty, image_url, video_url, author_id, is_published, view_count, created_at, updated_at);

-- Recipe Categories
CREATE TABLE recipe_categories (id, slug, name, icon, parent_id, created_at);
CREATE TABLE recipe_category_mapping (recipe_id, category_id);

-- Recipe Ingredients (links to products)
CREATE TABLE recipe_ingredients (id, recipe_id, product_id, name, quantity, unit, notes, position);

-- Social: Favorites, Comments, Ratings
CREATE TABLE user_favorites (user_id, recipe_id, created_at);
CREATE TABLE comments (id, recipe_id, user_id, parent_id, content, is_approved, created_at);
CREATE TABLE ratings (id, recipe_id, user_id, value, created_at, UNIQUE(recipe_id, user_id));

-- Supermarket Enhancements
ALTER TABLE profiles ADD is_supermarket, supermarket_name, description, banner_url, profile_picture_url, address, location_geometry, phone, website, subscription_status, subscription_dates, monthly_fee;

-- Supermarket Products (links to products with supermarket-specific pricing)
CREATE TABLE supermarket_products (id, supermarket_id, product_id, price, stock, is_available, created_at, updated_at, UNIQUE(supermarket_id, product_id));

-- Supermarket Coupons
CREATE TABLE supermarket_coupons (id, supermarket_id, code, name, description, discount_type, discount_value, min_purchase, max_uses, current_uses, starts_at, ends_at, is_active, created_at);

-- Supermarket Jobs
CREATE TABLE supermarket_jobs (id, supermarket_id, title, description, position, employment_type, salary, location, requirements, benefits, application_email, application_url, is_active, created_at);

-- Follow System
CREATE TABLE user_follows (user_id, supermarket_id, created_at, PRIMARY KEY(user_id, supermarket_id));

-- User Feed
CREATE TABLE feed_items (id, supermarket_id, type, reference_id, reference_type, title, content, image_url, created_at);
CREATE TABLE user_feed (id, user_id, feed_item_id, is_read, is_hidden, created_at);

-- Ingredient Search
CREATE TABLE ingredient_searches (id, user_id, recipe_id, query, location_geometry, radius, results, created_at);

-- Subscriptions
CREATE TABLE subscriptions (id, supermarket_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, monthly_fee, currency, created_at, updated_at);
```

#### Indexes:
```sql
CREATE INDEX idx_recipes_title ON recipes USING gin (title);
CREATE INDEX idx_recipes_author ON recipes(author_id);
CREATE INDEX idx_ratings_recipe ON ratings(recipe_id);
CREATE INDEX idx_profiles_location ON profiles USING gist(location_geometry);
CREATE INDEX idx_user_follows_user ON user_follows(user_id);
CREATE INDEX idx_user_follows_supermarket ON user_follows(supermarket_id);
```

---

## Phase 2: Core Recipe Features (HIGH)

### 2.1 Recipe Pages
- `/recipes` - Listing page with search, filters, categories
- `/recipes/new` - Create recipe form
- `/recipes/[slug]` - Detail page with:
  - Hero image + YouTube embed
  - Rating display (★★★★☆)
  - Comment section
  - Ingredients list with "Check Availability" button
  - Step-by-step instructions
  - Favorite button
  - Metadata (prep time, cook time, servings, difficulty)

### 2.2 Recipe Form
- Basic info (title, description, category)
- Media (image upload, YouTube URL)
- Details (times, servings, difficulty)
- Ingredients (dynamic list with product linking)
- Instructions (rich text with steps)

### 2.3 Comment & Rating System
- Rate recipes 1-5 stars
- Nested comments (2 levels)
- Comment approval (admin moderation)
- Rich text formatting

---

## Phase 3: Social Features (HIGH)

### 3.1 Follow System
- Users follow supermarkets
- Supermarkets have follower counts
- Follow button component

### 3.2 User Feed (`/feed`)
- Shows updates from followed supermarkets:
  - New products
  - Discounts/sales
  - New coupons
  - Job postings
  - New recipes (if supermarkets post them)
- Infinite scroll
- Filter by type
- Mark as read

---

## Phase 4: Supermarket Profiles (HIGH)

### 4.1 Profile Structure (Facebook/LinkedIn Style)
```
┌─────────────────────────────────────────┐
│  BANNER (1200x400)                          │
│  ┌─────┐                                   │
│  │PRO  │  NAME       [FOLLOW][MESSAGE]     │
│  │PIC  │  Verified badge if paid          │
│  └─────┘  Category tags                     │
│         Rating: ★★★★☆ | Followers: 5K       │
│         Location: Address | OPEN NOW/CLOSED  │
└─────────────────────────────────────────┘
     ║
     ▼
┌─────────────────────────────────────────┐
│  TABS: [About] [Products] [Coupons] [Bundles] [Jobs] [Reviews] │
└─────────────────────────────────────────┘
```

### 4.2 Tab: About Page
- Description (rich text)
- Opening hours table
- Contact info (phone, email, website, social)
- Location with Google/Apple Maps embed
- "Get Directions" button
- Additional info (payment methods, return policy)

### 4.3 Tab: Products
- Product grid/list toggle
- Filter by category
- Search within supermarket
- Sort options
- Add to cart directly

### 4.4 Tab: Coupons
- List of active coupons
- Coupon code with copy button
- Discount details
- Expiration date
- "Use Coupon" button (auto-applies to cart)

### 4.5 Tab: Bundles
- Supermarket-specific bundles
- Products included
- Savings display
- "Add Bundle to Cart"

### 4.6 Tab: Jobs
- Job listings
- Position, type, salary, location
- Description
- Requirements, benefits
- Apply button (email or URL)

### 4.7 Tab: Reviews
- Aggregate rating
- Rating breakdown (5★-1★)
- Individual reviews
- Supermarket responses

---

## Phase 5: Ingredient Availability & Shopping (HIGH)

### 5.1 Availability Check
- "Check Availability" button on recipe detail
- Modal with:
  - Search radius selector (5km, 10km, 25km, 50km)
  - Map view with supermarket markers
  - List view of supermarkets with matching ingredients
  - For each: distance, matching ingredients count, total price
- Ingredient details table
- "Add All to Cart" button
- "Create Shopping List" button

### 5.2 Shopping Integration
- Add ingredients to existing cart
- Shopping list feature:
  - Multiple lists
  - Items from recipes or custom
  - Share lists
  - Print lists
  - Check off items
- Integration with Stripe checkout

---

## Phase 6: Monetization (CRITICAL)

### 6.1 Supermarket Subscription
- Monthly fee: €50
- Stripe integration (reuse existing gateway)
- Features unlocked:
  - Supermarket profile visibility
  - Post products
  - Feed visibility
  - All management features

### 6.2 Subscription Management
- `/supermarket/subscribe` - Signup page
- `/supermarket/billing` - Billing history
- `/admin/supermarkets` - Admin view
- Subscription gating middleware

### 6.3 Implementation:
```typescript
// Stripe subscription creation
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'PRICE_ID_FOR_50_EURO' }],
  payment_behavior: 'default_incomplete',
  metadata: { supermarket_id: supermarketId }
});
```

---

## Phase 7: UX/UI Improvements (MEDIUM)

### 7.1 Design System
- New color palette (recette, wine, olive, cream)
- Enhanced typography
- Consistent spacing and shadows
- Animation library

### 7.2 Component Library
- Enhanced Button (variants, sizes, states)
- Card system
- Badge system
- Empty states
- Loading states (skeletons)
- Toast notifications
- Modal system

### 7.3 Responsive Design
- Touch-friendly components
- Mobile-first approach
- Swipe gestures
- Bottom navigation for key actions

### 7.4 Accessibility
- WCAG compliance
- ARIA labels
- Keyboard navigation
- Focus indicators
- Color contrast
- Screen reader support

---

## Phase 8: Admin Enhancements (MEDIUM)

### 8.1 New Admin Pages
- `/admin/recipes` - Recipe management
- `/admin/supermarkets` - Supermarket management
- `/admin/subscriptions` - Subscription management
- `/admin/reports` - User reports
- `/admin/analytics` - Platform analytics

### 8.2 Moderation Tools
- Flag inappropriate content
- Approve/reject user content
- Ban users
- Content filters

---

## Phase 9: Performance & SEO (MEDIUM)

### 9.1 Performance
- Next.js Image optimization
- Caching (ISR, API, database)
- Code splitting
- Lazy loading

### 9.2 SEO
- Meta tags on all pages
- Recipe schema.org markup
- Sitemap generation
- Robots.txt
- OpenGraph tags

---

## Phase 10: Advanced Features (LOW)

### 10.1 Enhanced Search
- Full-text search
- Faceted search
- Autocomplete
- Trending searches

### 10.2 Social Features
- Like/Unlike recipes
- Collections
- @mentions
- Report content

### 10.3 Shopping Features
- Shopping list organization
- Price comparison
- Barcode scanning
- Multi-supermarket checkout

### 10.4 Community Features
- Recipe photos from users
- Cooking challenges
- Badges and achievements

---

## Implementation Order (Recommended)

### Week 1-2: Foundation
1. Branding updates
2. Database schema updates
3. RLS policies
4. Middleware updates

### Week 3-4: Recipes
1. Recipe API (CRUD)
2. Recipe pages
3. Comment system
4. Rating system
5. YouTube embed

### Week 5-6: Social & Supermarkets
1. Supermarket profile pages
2. Follow system
3. User feed
4. Ingredient availability
5. Shopping integration

### Week 7-8: Monetization & Admin
1. Subscription system
2. Subscription gating
3. Admin enhancements
4. Moderation tools

### Week 9: Testing & Polish
1. Comprehensive testing
2. Performance optimization
3. SEO enhancements
4. Accessibility audit

### Week 10: Launch
1. Final testing
2. Deployment
3. Monitoring setup
4. Launch

---

## Success Metrics (KPIs)

### Year 1 Goals:
- **Users**: 10,000 total, 3,000 active (MAU)
- **Recipes**: 5,000
- **Supermarkets**: 100 active
- **Revenue**: €5,000/month (100 × €50)

### Engagement:
- Session duration: 5+ minutes
- Pages/session: 4+
- Bounce rate: < 40%
- Recipe to favorite: 15%
- User to recipe creation: 10%

---

## Open Questions

1. **Color Scheme**: Keep barn colors or new French-inspired palette?
2. **Feature Priority**: Implement in recommended order or adjust?
3. **MVP vs Full**: Launch with MVP or wait for all high-priority features?
4. **Maps**: Google Maps API or OpenStreetMap?
5. **Search**: Supabase full-text or Algolia/Meilisearch?
6. **Subscription**: €50/month correct? Trial period?
7. **Moderation**: Auto-approve content or require admin approval?

---

## File Structure Changes

### New Directories:
```
src/
├── app/
│   ├── [locale]/
│   │   ├── recipes/              # Recipe pages
│   │   ├── supermarkets/        # Supermarket pages
│   │   ├── feed/                # User feed
│   │   ├── users/               # User profiles
│   │   └── shopping-lists/      # Shopping lists
│   └── supermarket/             # Supermarket management
├── components/
│   ├── recipes/                # Recipe components
│   ├── supermarkets/           # Supermarket components
│   ├── social/                 # Social components
│   └── shopping/               # Shopping components
└── lib/
    ├── recipes/                # Recipe utilities
    ├── supermarkets/           # Supermarket utilities
    └── subscriptions/          # Subscription utilities
```

---

## Quick Start

To begin implementation, select one of these options:

1. **Start with Branding (Phase 1)**: Update colors, logos, and basic styling
2. **Start with Database (Phase 1)**: Set up new tables and migrations
3. **Start with Recipes (Phase 2)**: Build the recipe system first
4. **Start with Monetization (Phase 6)**: Implement subscription system first

---

*This plan is modular. Each phase can be implemented independently once dependencies are met. User can select which features to add incrementally.*
