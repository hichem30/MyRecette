-- =====================================================================
-- MY RECETTE: Core Seed Ingredients Data
-- =====================================================================
-- This file contains the core ~100 most common ingredients with synonyms and patterns
-- Run this AFTER running schema.sql
-- =====================================================================

-- Enable pg_trgm extension for fuzzy matching (similarity function)
create extension if not exists pg_trgm;

-- =====================================================================
-- VEGETABLES
-- =====================================================================

-- Tomato
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common, is_basic, description) 
VALUES 
  ('tomato', '{"en": "Tomato", "fr": "Tomate", "es": "Tomate"}', 'tomatoes', 'vegetable', 'nightshade', true, false, 'Common cooking vegetable')
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority, context) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'tomato'), 'tomatoes', 10, 'general'),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'tomato'), 'roma tomato', 8, 'variety'),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'tomato'), 'cherry tomato', 8, 'variety'),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'tomato'), 'beefsteak tomato', 7, 'variety'),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'tomato'), 'vine tomato', 7, 'variety')
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

INSERT INTO public.ingredient_patterns (ingredient_id, pattern_type, pattern, confidence, case_sensitive) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'tomato'), 'contains', 'tomato', 1.0, false)
ON CONFLICT (ingredient_id, pattern_type, pattern) DO NOTHING;

-- Potato
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES 
  ('potato', '{"en": "Potato", "fr": "Pomme de terre", "es": "Patata"}', 'potatoes', 'vegetable', 'root', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'potato'), 'potatoes', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'potato'), 'russet potato', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'potato'), 'red potato', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'potato'), 'yukon gold', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Onion
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES 
  ('onion', '{"en": "Onion", "fr": "Oignon", "es": "Cebolla"}', 'onions', 'vegetable', 'allium', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'onion'), 'onions', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'onion'), 'red onion', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'onion'), 'yellow onion', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'onion'), 'white onion', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'onion'), 'shallot', 7),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'onion'), 'green onion', 7)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Carrot
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES 
  ('carrot', '{"en": "Carrot", "fr": "Carotte", "es": "Zanahoria"}', 'carrots', 'vegetable', 'root', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'carrot'), 'carrots', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'carrot'), 'baby carrot', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Bell Pepper
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES 
  ('bell pepper', '{"en": "Bell Pepper", "fr": "Poivron", "es": "Pimiento"}', 'bell peppers', 'vegetable', 'nightshade', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'bell pepper'), 'bell peppers', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'bell pepper'), 'capsicum', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'bell pepper'), 'red pepper', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'bell pepper'), 'green pepper', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Cucumber
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('cucumber', '{"en": "Cucumber", "fr": "Concombre", "es": "Pepino"}', 'cucumbers', 'vegetable', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Lettuce
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES 
  ('lettuce', '{"en": "Lettuce", "fr": "Laitue", "es": "Lechuga"}', 'lettuces', 'vegetable', 'leafy green', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'lettuce'), 'romaine', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'lettuce'), 'iceberg', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'lettuce'), 'arugula', 7),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'lettuce'), 'spinach', 7)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Broccoli
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('broccoli', '{"en": "Broccoli", "fr": "Brocoli", "es": "Brócoli"}', 'vegetable', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cauliflower
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('cauliflower', '{"en": "Cauliflower", "fr": "Chou-fleur", "es": "Coliflor"}', 'vegetable', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Zucchini
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('zucchini', '{"en": "Zucchini", "fr": "Courgette", "es": "Calabacín"}', 'vegetable', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'zucchini'), 'courgette', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Eggplant
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('eggplant', '{"en": "Eggplant", "fr": "Aubergine", "es": "Berenjena"}', 'vegetable', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'eggplant'), 'aubergine', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Mushroom
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('mushroom', '{"en": "Mushroom", "fr": "Champignon", "es": "Hongos"}', 'mushrooms', 'vegetable', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'mushroom'), 'mushrooms', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'mushroom'), 'button mushroom', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'mushroom'), 'portobello', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- =====================================================================
-- FRUITS
-- =====================================================================

-- Apple
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('apple', '{"en": "Apple", "fr": "Pomme", "es": "Manzana"}', 'apples', 'fruit', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'apple'), 'apples', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'apple'), 'red apple', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'apple'), 'green apple', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Banana
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('banana', '{"en": "Banana", "fr": "Banane", "es": "Plátano"}', 'bananas', 'fruit', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Orange
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES 
  ('orange', '{"en": "Orange", "fr": "Orange", "es": "Naranja"}', 'oranges', 'fruit', 'citrus', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Strawberry
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('strawberry', '{"en": "Strawberry", "fr": "Fraise", "es": "Fresa"}', 'strawberries', 'fruit', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Blueberry
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('blueberry', '{"en": "Blueberry", "fr": "Myrtille", "es": "Arándano"}', 'blueberries', 'fruit', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Grape
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('grape', '{"en": "Grape", "fr": "Raisin", "es": "Uva"}', 'grapes', 'fruit', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Lemon
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES 
  ('lemon', '{"en": "Lemon", "fr": "Citron", "es": "Limón"}', 'lemons', 'fruit', 'citrus', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Lime
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES 
  ('lime', '{"en": "Lime", "fr": "Citron vert", "es": "Lima"}', 'limes', 'fruit', 'citrus', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Avocado
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('avocado', '{"en": "Avocado", "fr": "Avocat", "es": "Aguacate"}', 'avocados', 'fruit', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- PROTEINS
-- =====================================================================

-- Chicken
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('chicken', '{"en": "Chicken", "fr": "Poulet", "es": "Pollo"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chicken'), 'chicken breast', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chicken'), 'chicken thigh', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chicken'), 'whole chicken', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chicken'), 'ground chicken', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

INSERT INTO public.ingredient_patterns (ingredient_id, pattern_type, pattern, confidence) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chicken'), 'contains', 'chicken', 1.0)
ON CONFLICT (ingredient_id, pattern_type, pattern) DO NOTHING;

-- Beef
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('beef', '{"en": "Beef", "fr": "Bœuf", "es": "Ternera"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'beef'), 'ground beef', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'beef'), 'steak', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'beef'), 'sirloin', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Pork
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('pork', '{"en": "Pork", "fr": "Porc", "es": "Cerdo"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'pork'), 'pork chop', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'pork'), 'bacon', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'pork'), 'ham', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Fish
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('fish', '{"en": "Fish", "fr": "Poisson", "es": "Pescado"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Salmon
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('salmon', '{"en": "Salmon", "fr": "Saumon", "es": "Salmón"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Tuna
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('tuna', '{"en": "Tuna", "fr": "Thon", "es": "Atún"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Shrimp
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('shrimp', '{"en": "Shrimp", "fr": "Crevette", "es": "Gamba"}', 'shrimps', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'shrimp'), 'shrimps', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'shrimp'), 'prawn', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Egg
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('egg', '{"en": "Egg", "fr": "Œuf", "es": "Huevo"}', 'eggs', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'egg'), 'eggs', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'egg'), 'chicken egg', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Tofu
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('tofu', '{"en": "Tofu", "fr": "Tofu", "es": "Tofu"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- DAIRY
-- =====================================================================

-- Milk
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('milk', '{"en": "Milk", "fr": "Lait", "es": "Leche"}', 'dairy', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'milk'), 'whole milk', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'milk'), 'skim milk', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'milk'), '2% milk', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Cheese
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('cheese', '{"en": "Cheese", "fr": "Fromage", "es": "Queso"}', 'dairy', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'cheese'), 'cheddar', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'cheese'), 'mozzarella', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'cheese'), 'parmesan', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'cheese'), 'feta', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Butter
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('butter', '{"en": "Butter", "fr": "Beurre", "es": "Mantequilla"}', 'dairy', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Yogurt
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('yogurt', '{"en": "Yogurt", "fr": "Yaourt", "es": "Yogur"}', 'dairy', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'yogurt'), 'greek yogurt', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'yogurt'), 'plain yogurt', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Cream
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('cream', '{"en": "Cream", "fr": "Crème", "es": "Nata"}', 'dairy', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cottage Cheese
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('cottage cheese', '{"en": "Cottage Cheese", "fr": "Fromage blanc", "es": "Queso fresco"}', 'dairy', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- GRAINS & BREAD
-- =====================================================================

-- Rice
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('rice', '{"en": "Rice", "fr": "Riz", "es": "Arroz"}', 'rices', 'grain', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'rice'), 'white rice', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'rice'), 'brown rice', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'rice'), 'basmati rice', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Pasta
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('pasta', '{"en": "Pasta", "fr": "Pâtes", "es": "Pasta"}', 'grain', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'pasta'), 'spaghetti', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'pasta'), 'penne', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'pasta'), 'macaroni', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Bread
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('bread', '{"en": "Bread", "fr": "Pain", "es": "Pan"}', 'grain', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'bread'), 'whole wheat bread', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'bread'), 'white bread', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'bread'), 'sourdough', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Flour
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('flour', '{"en": "Flour", "fr": "Farine", "es": "Harina"}', 'grain', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'flour'), 'all purpose flour', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'flour'), 'whole wheat flour', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Oats
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('oats', '{"en": "Oats", "fr": "Flocons d''avoine", "es": "Avena"}', 'grain', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Quinoa
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('quinoa', '{"en": "Quinoa", "fr": "Quinoa", "es": "Quinoa"}', 'grain', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- BASICS (Salt, Pepper, etc.)
-- =====================================================================

-- Salt
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common, is_basic) 
VALUES 
  ('salt', '{"en": "Salt", "fr": "Sel", "es": "Sal"}', 'spice', true, true)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'salt'), 'table salt', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'salt'), 'sea salt', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Black Pepper
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common, is_basic) 
VALUES 
  ('black pepper', '{"en": "Black Pepper", "fr": "Poivre noir", "es": "Pimienta negra"}', 'spice', true, true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Olive Oil
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('olive oil', '{"en": "Olive Oil", "fr": "Huile d''olive", "es": "Aceite de oliva"}', 'oil', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'olive oil'), 'extra virgin olive oil', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Vegetable Oil
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('vegetable oil', '{"en": "Vegetable Oil", "fr": "Huile végétale", "es": "Aceite vegetal"}', 'oil', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Sugar
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common, is_basic) 
VALUES 
  ('sugar', '{"en": "Sugar", "fr": "Sucre", "es": "Azúcar"}', 'baking', true, true)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'sugar'), 'granulated sugar', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'sugar'), 'brown sugar', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'sugar'), 'powdered sugar', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Honey
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('honey', '{"en": "Honey", "fr": "Miel", "es": "Miel"}', 'baking', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Garlic
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('garlic', '{"en": "Garlic", "fr": "Ail", "es": "Ajo"}', 'spice', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'garlic'), 'garlic clove', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'garlic'), 'garlic powder', 7)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Onion Powder
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('onion powder', '{"en": "Onion Powder", "fr": "Poudre d''oignon", "es": "Cebolla en polvo"}', 'spice', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- CANNED & PACKAGED
-- =====================================================================

-- Tomato Sauce
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('tomato sauce', '{"en": "Tomato Sauce", "fr": "Sauce tomate", "es": "Salsa de tomate"}', 'canned', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Tomato Paste
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('tomato paste', '{"en": "Tomato Paste", "fr": "Purée de tomate", "es": "Pasta de tomate"}', 'canned', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Chicken Broth
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('chicken broth', '{"en": "Chicken Broth", "fr": "Bouillon de poulet", "es": "Caldo de pollo"}', 'canned', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chicken broth'), 'chicken stock', 10)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- =====================================================================
-- HERBS
-- =====================================================================

-- Basil
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('basil', '{"en": "Basil", "fr": "Basilic", "es": "Albahaca"}', 'herb', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Oregano
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('oregano', '{"en": "Oregano", "fr": "Origan", "es": "Orégano"}', 'herb', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Thyme
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('thyme', '{"en": "Thyme", "fr": "Thym", "es": "Tomillo"}', 'herb', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Rosemary
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('rosemary', '{"en": "Rosemary", "fr": "Romarin", "es": "Romero"}', 'herb', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Parsley
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('parsley', '{"en": "Parsley", "fr": "Persil", "es": "Perejil"}', 'herb', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cilantro
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('cilantro', '{"en": "Cilantro", "fr": "Coriandre", "es": "Cilantro"}', 'herb', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'cilantro'), 'coriander', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- =====================================================================
-- MISCELLANEOUS
-- =====================================================================

-- Mayonnaise
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('mayonnaise', '{"en": "Mayonnaise", "fr": "Mayonnaise", "es": "Mayonesa"}', 'miscellaneous', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'mayonnaise'), 'mayo', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Mustard
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('mustard', '{"en": "Mustard", "fr": "Moutarde", "es": "Mostaza"}', 'miscellaneous', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Ketchup
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('ketchup', '{"en": "Ketchup", "fr": "Ketchup", "es": "Ketchup"}', 'miscellaneous', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Soy Sauce
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('soy sauce', '{"en": "Soy Sauce", "fr": "Sauce soja", "es": "Salsa de soja"}', 'miscellaneous', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Peanut Butter
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('peanut butter', '{"en": "Peanut Butter", "fr": "Beurre de cacahuète", "es": "Mantequilla de maní"}', 'miscellaneous', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- LEGUMES
-- =====================================================================

-- Lentils
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('lentil', '{"en": "Lentil", "fr": "Lentille", "es": "Lenteja"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'lentil'), 'lentils', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'lentil'), 'green lentil', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Chickpeas
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('chickpea', '{"en": "Chickpea", "fr": "Pois chiche", "es": "Garbanzo"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chickpea'), 'chickpeas', 10)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Black Beans
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('black bean', '{"en": "Black Bean", "fr": "Haricot noir", "es": "Frijol negro"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Kidney Beans
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('kidney bean', '{"en": "Kidney Bean", "fr": "Haricot rouge", "es": "Frijol rojo"}', 'protein', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- BAKING
-- =====================================================================

-- Baking Powder
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('baking powder', '{"en": "Baking Powder", "fr": "Levure chimique", "es": "Polvo de hornear"}', 'baking', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Baking Soda
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('baking soda', '{"en": "Baking Soda", "fr": "Bicarbonate de soude", "es": "Bicarbonato de sodio"}', 'baking', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Yeast
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('yeast', '{"en": "Yeast", "fr": "Levure", "es": "Levadura"}', 'baking', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Chocolate
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('chocolate', '{"en": "Chocolate", "fr": "Chocolat", "es": "Chocolate"}', 'baking', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chocolate'), 'dark chocolate', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'chocolate'), 'milk chocolate', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Cocoa Powder
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('cocoa powder', '{"en": "Cocoa Powder", "fr": "Poudre de cacao", "es": "Cacao en polvo"}', 'baking', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Vanilla Extract
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES 
  ('vanilla extract', '{"en": "Vanilla Extract", "fr": "Extrait de vanille", "es": "Extracto de vainilla"}', 'baking', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- NUTS & SEEDS
-- =====================================================================

-- Almond
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('almond', '{"en": "Almond", "fr": "Amande", "es": "Almendra"}', 'almonds', 'nuts', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'almond'), 'almonds', 10),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'almond'), 'sliced almond', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Walnut
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('walnut', '{"en": "Walnut", "fr": "Noix", "es": "Nuez"}', 'walnuts', 'nuts', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Peanut
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('peanut', '{"en": "Peanut", "fr": "Cacahuète", "es": "Cacahuete"}', 'peanuts', 'nuts', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cashew
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES 
  ('cashew', '{"en": "Cashew", "fr": "Noix de cajou", "es": "Anacardo"}', 'cashews', 'nuts', true, false)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- FINAL SETUP
-- =====================================================================

-- Update existing products to set default ingredient_mapping_status
UPDATE public.products 
SET ingredient_mapping_status = 'pending'
WHERE ingredient_mapping_status IS NULL;

-- Comment: This file contains ~100 core ingredients.
-- Additional ingredients can be added via the admin interface
-- or by extending this file with more INSERT statements.
