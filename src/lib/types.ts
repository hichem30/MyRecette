export type Locale = "en" | "es" | "fr" | "ar";
export type Translatable = Partial<Record<Locale, string>>;

export interface Category {
  id: string;
  slug: string;
  name: Translatable;
  parent_id?: string | null;
  image_url?: string;
  icon?: string;
  item_count?: number;
  discount_percent?: number | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: Translatable;
  description: Translatable;
  price: number;
  original_price?: number | null;
  image_url: string;
  category_slug: string;
  discount: boolean;
  discount_text?: Translatable | null;
  new_arrival: boolean;
  stock: number;
  featured: boolean;
  best_seller?: boolean;
  free_shipping?: boolean;
  published?: boolean;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Bundle {
  id: string;
  name: Translatable;
  description: Translatable;
  bundle_price: number;
  image_url?: string | null;
  product_ids: string[];
  starts_at?: string | null;
  ends_at?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  max_uses?: number | null;
  uses_count: number;
  starts_at?: string | null;
  ends_at?: string | null;
  active: boolean;
  applies_to_product_ids?: string[] | null;
  applies_to_category_slugs?: string[] | null;
  created_at?: string;
}

export interface DeliveryZone {
  id: string;
  state_code: string;
  city?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface BulkQuote {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  project_type: string;
  estimated_quantity: string;
  delivery: "deliver" | "pickup";
  timeline: string;
  notes?: string;
  status: "new" | "contacted" | "won" | "lost";
  created_at: string;
}

export interface OrderLineItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_amount: number;
}

export type OrderStatus =
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export interface Order {
  id: string;
  order_number?: string | null;
  stripe_session_id: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_name?: string | null;
  shipping_address?: ShippingAddress | null;
  total_amount: number;
  line_items: OrderLineItem[];
  status: OrderStatus;
  notes?: string | null;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  slug: string;
  name: Translatable;
  price: number;
  image_url: string;
  quantity: number;
}

// =====================================================================
// MY RECETTE: Ingredient Types
// =====================================================================

export type IngredientCategory = 
  | 'vegetable'
  | 'fruit'
  | 'protein'
  | 'dairy'
  | 'grain'
  | 'spice'
  | 'herb'
  | 'oil'
  | 'baking'
  | 'canned'
  | 'beverage'
  | 'nuts'
  | 'miscellaneous';

export interface Ingredient {
  id: string;
  canonical_name: string;
  display_name: Translatable;
  plural_name?: string | null;
  category: IngredientCategory;
  subcategory?: string | null;
  is_common: boolean;
  is_basic: boolean;
  description?: string | null;
  calories_per_100g?: number | null;
  created_at: string;
  updated_at: string;
}

export interface IngredientSynonym {
  id: string;
  ingredient_id: string;
  synonym: string;
  priority: number;
  context?: string | null;
  created_at: string;
}

export interface IngredientPattern {
  id: string;
  ingredient_id: string;
  pattern_type: 'contains' | 'starts_with' | 'ends_with' | 'regex';
  pattern: string;
  confidence: number;
  case_sensitive: boolean;
  created_at: string;
}

export type IngredientRelationshipType = 
  | 'synonym'
  | 'variation'
  | 'substitute'
  | 'contains'
  | 'part_of'
  | 'parent'
  | 'child';

export interface IngredientRelationship {
  id: string;
  ingredient_id: string;
  related_ingredient_id: string;
  relationship_type: IngredientRelationshipType;
  strength: number;
  context?: string | null;
  created_at: string;
}

export type ProductIngredientMappingMethod = 
  | 'auto_name'
  | 'auto_barcode'
  | 'manual'
  | 'admin';

export interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  mapping_method: ProductIngredientMappingMethod;
  confidence: number;
  is_primary: boolean;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type PendingMappingStatus = 'pending' | 'approved' | 'rejected' | 'ignored';

export interface PendingIngredientMapping {
  id: string;
  product_id: string;
  supermarket_id?: string | null;
  suggested_ingredient_id?: string | null;
  suggested_ingredient_name: string;
  confidence: number;
  status: PendingMappingStatus;
  resolved_by?: string | null;
  resolved_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface SupermarketProductIngredient {
  supermarket_id: string;
  product_id: string;
  ingredient_id: string;
  ingredient_canonical: string;
  price: number;
  stock: number;
  is_available: boolean;
}

// Extended product type with ingredient info
export interface ProductWithIngredients extends Product {
  is_ingredient?: boolean;
  ingredient_confidence?: number | null;
  ingredient_mapping_status?: 'auto' | 'manual' | 'pending' | 'ignored' | null;
  ingredients?: ProductIngredient[];
}

// Response types for ingredient API
export interface IngredientExtractionResult {
  ingredient_id: string;
  canonical_name: string;
  confidence: number;
  match_type: string;
}

export interface ProductIngredientMappingResult {
  createdMappings: number;
  needsReview: boolean;
  suggestions: Array<{
    ingredient: Ingredient;
    confidence: number;
  }>;
}

// CSV bulk upload result with ingredient info
export interface BulkUploadResultWithIngredients {
  totalRows: number;
  validRows: number;
  errorRows: number;
  importedCount: number;
  updatedCount: number;
  newProductCount: number;
  ingredientsExtracted: number;
  ingredientsNeedsReview: number;
  errors: string[];
  details: Array<{
    row: number;
    productId: string | null;
    action: string;
    status: string;
    message: string;
    ingredientsExtracted: number;
    ingredientsNeedsReview: boolean;
  }>;
}

// =====================================================================
// MY RECETTE: Recipe Types
// =====================================================================

export type RecipeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type RecipeMealType = 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'snack' | 'appetizer' | 'drink';

export interface Recipe {
  id: string;
  title: Translatable;
  slug: string;
  description?: Translatable | null;
  author_id?: string | null;
  instructions?: Array<{
    step: number;
    text: Translatable;
    image_url?: string | null;
  }> | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  servings?: number;
  difficulty?: RecipeDifficulty | null;
  image_url?: string | null;
  video_url?: string | null;  // YouTube embed URL
  rating?: number;
  rating_count?: number;
  comment_count?: number;
  video_count?: number;
  view_count?: number;
  favorite_count?: number;
  cuisine?: string | null;
  meal_type?: RecipeMealType | null;
  dietary_tags?: string[] | null;
  published?: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    email: string;
    supermarket_name?: Translatable | null;
  } | null;
  ingredients?: RecipeIngredient[];
  comments?: RecipeComment[];
  videos?: RecipeVideo[];
  is_favorited?: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  position?: number;
  created_at: string;
}

export interface RecipeComment {
  id: string;
  recipe_id: string;
  author_id: string;
  parent_id?: string | null;
  content: string;
  rating?: number | null;  // 1-5
  is_approved?: boolean;
  is_spam?: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    email: string;
    supermarket_name?: Translatable | null;
  } | null;
  replies?: RecipeComment[];
}

// Video platform types
export type VideoPlatform = 'youtube' | 'facebook';

// Video reaction types
export type VideoReactionType = 'like' | 'love' | 'laugh' | 'surprised' | 'sad' | 'angry';

// User-submitted video for a recipe (YouTube or Facebook only)
export interface RecipeVideo {
  id: string;
  recipe_id: string;
  user_id: string;
  // Video source
  platform: VideoPlatform;
  video_url: string;
  // Extracted IDs for embed
  youtube_video_id?: string | null;
  facebook_video_id?: string | null;
  // Video metadata
  thumbnail_url?: string | null;
  // Content (multi-language)
  title?: Translatable | null;
  description?: Translatable | null;
  // Engagement
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  // Status
  is_approved?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    email: string;
    supermarket_name?: Translatable | null;
    profile_picture_url?: string | null;
  } | null;
  recipe?: {
    id: string;
    slug: string;
    title: Translatable;
  } | null;
}

// Video submission request for adding a video to a recipe
export interface RecipeVideoSubmission {
  video_url: string;
  platform?: VideoPlatform; // Optional - can be auto-detected
  title?: Translatable | null;
  description?: Translatable | null;
}

// Comment on a user-submitted video (separate from recipe comments)
export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  like_count: number;
  is_liked?: boolean;
  is_approved?: boolean;
  is_spam?: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    email: string;
    supermarket_name?: Translatable | null;
    profile_picture_url?: string | null;
  } | null;
  replies?: VideoComment[];
}

// Video reaction (like, love, laugh, etc.)
export interface VideoReaction {
  video_id: string;
  user_id: string;
  reaction_type: VideoReactionType;
  created_at: string;
}

// Video statistics
export interface VideoStats {
  video_id: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  reaction_counts: Record<VideoReactionType, number>;
}

// Social sharing platform
export type SocialPlatform = 'facebook' | 'twitter' | 'messageCircle' | 'linkedin' | 'email';

// Social share data
export interface SocialShareData {
  platform: SocialPlatform;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export interface RecipeFavorite {
  user_id: string;
  recipe_id: string;
  created_at: string;
}

// Recipe search result with match info
export interface RecipeSearchResult {
  recipe_id: string;
  title: Translatable;
  slug: string;
  image_url?: string | null;
  rating?: number | null;
  rating_count?: number | null;
  view_count?: number;
  favorite_count?: number;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  servings?: number;
  difficulty?: RecipeDifficulty | null;
  meal_type?: RecipeMealType | null;
  ingredient_match_count: number;
  total_ingredients: number;
  missing_ingredients_count: number;
}

// Supermarket ingredient availability result
export interface SupermarketIngredientAvailability {
  supermarket_id: string;
  supermarket_name: Translatable;
  location_geometry?: any | null;  // geography(POINT, 4326)
  distance_meters?: number | null;
  ingredient_count: number;
  total_price: number;
  available_ingredients: Array<{
    ingredient: string;
    price: number;
    in_stock: boolean;
  }>;
  missing_ingredients: Array<{ ingredient: string }>;
}

// New recipe form data
export interface NewRecipeFormData {
  title: Translatable;
  slug: string;
  description?: Translatable | null;
  instructions?: string[] | null;  // Array of step texts
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  servings?: number;
  difficulty?: RecipeDifficulty | null;
  image_url?: string | null;
  video_url?: string | null;
  cuisine?: string | null;
  meal_type?: RecipeMealType | null;
  dietary_tags?: string[] | null;
  published?: boolean;
  ingredients?: Array<{
    ingredient_id: string;
    quantity?: number | null;
    unit?: string | null;
    notes?: string | null;
    position?: number;
  }> | null;
}

// Recipe ingredient suggestion for autocomplete
export interface RecipeIngredientSuggestion {
  id: string;
  canonical_name: string;
  display_name: Translatable;
  category: IngredientCategory;
  subcategory?: string | null;
}

// =====================================================================
// MY RECETTE: Supermarket Types
// =====================================================================

export type SupermarketSubscriptionStatus = 'inactive' | 'active' | 'trialing' | 'past_due' | 'canceled';

export interface SupermarketProfile {
  id: string;
  email: string;
  is_supermarket: boolean;
  supermarket_name: Translatable;
  description?: Translatable | null;
  banner_url?: string | null;
  profile_picture_url?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
  location_geometry?: any | null; // geography(POINT, 4326)
  phone?: string | null;
  website?: string | null;
  social_links?: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
  } | null;
  opening_hours?: Array<{
    day: string;
    opens: string;
    closes: string;
    is_open: boolean;
  }> | null;
  category_tags?: string[] | null;
  subscription_status: SupermarketSubscriptionStatus;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  follower_count?: number;
  is_followed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupermarketProduct {
  id: string;
  supermarket_id: string;
  product_id: string;
  price: number;
  original_price?: number | null;
  stock: number;
  is_available: boolean;
  supermarket_sku?: string | null;
  supermarket_barcode?: string | null;
  location_in_store?: string | null;
  product?: Product | null;
  created_at: string;
  updated_at: string;
}

export interface SupermarketCoupon {
  id: string;
  supermarket_id: string;
  code: string;
  description: Translatable;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  min_purchase_amount?: number | null;
  max_uses?: number | null;
  uses_count: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
  products_eligible?: string[] | null; // product_ids
  categories_eligible?: string[] | null; // category_slugs
  created_at: string;
  updated_at: string;
}

export interface SupermarketBundle {
  id: string;
  supermarket_id: string;
  name: Translatable;
  description: Translatable;
  bundle_price: number;
  original_price?: number | null;
  image_url?: string | null;
  product_ids: string[];
  products?: Product[] | null;
  starts_at?: string | null;
  ends_at?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupermarketSale {
  id: string;
  supermarket_id: string;
  name: Translatable;
  description?: Translatable | null;
  discount_percent: number;
  applies_to_product_ids?: string[] | null;
  applies_to_category_slugs?: string[] | null;
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupermarketJob {
  id: string;
  supermarket_id: string;
  title: Translatable;
  description: Translatable;
  position_type: 'full_time' | 'part_time' | 'temporary' | 'contract' | 'internship';
  salary_range?: Translatable | null;
  requirements?: string[] | null;
  benefits?: string[] | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  application_url?: string | null;
  application_email?: string | null;
  active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupermarketFollow {
  user_id: string;
  supermarket_id: string;
  created_at: string;
}

export interface SupermarketFeedItem {
  id: string;
  supermarket_id: string;
  type: 'new_product' | 'price_change' | 'sale_start' | 'coupon_added' | 'bundle_added' | 'job_posted' | 'announcement';
  entity_id: string;
  title: Translatable;
  description?: Translatable | null;
  image_url?: string | null;
  action_url: string;
  created_at: string;
  supermarket?: Pick<SupermarketProfile, 'id' | 'supermarket_name' | 'profile_picture_url'> | null;
}

// =====================================================================
// MY RECETTE: Shopping List Types
// =====================================================================

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_public: boolean;
  share_token?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    email: string;
    profile_picture_url?: string | null;
  } | null;
  items_count?: number;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  product_id?: string | null;
  ingredient_id?: string | null;
  custom_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  is_checked: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: {
    id: string;
    name: Translatable;
    price?: number | null;
    image_url?: string | null;
    slug: string;
  } | null;
  ingredient?: {
    id: string;
    canonical_name: string;
    display_name: Translatable;
    category: string;
  } | null;
}

export interface ShoppingListWithItems extends ShoppingList {
  items: ShoppingListItem[];
}

// Shopping list form data for creating/updating lists
export interface ShoppingListFormData {
  name: string;
  description?: string | null;
  is_public?: boolean;
}

// Shopping list item form data for creating/updating items
export interface ShoppingListItemFormData {
  product_id?: string | null;
  ingredient_id?: string | null;
  custom_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  is_checked?: boolean;
  position?: number;
}

// API Response types for shopping lists
export interface ShoppingListApiResponse {
  shoppingList: ShoppingListWithItems;
}

export interface ShoppingListsApiResponse {
  shoppingLists: ShoppingList[];
  total: number;
}

export interface ShoppingListItemApiResponse {
  item: ShoppingListItem;
}

export interface ShoppingListItemsApiResponse {
  items: ShoppingListItem[];
  total: number;
}

