-- =====================================================================
-- MY RECETTE: Extended Seed Ingredients Data
-- =====================================================================
-- This file contains additional ingredients beyond the core set
-- Run this AFTER running seed_ingredients_core.sql
-- =====================================================================

-- =====================================================================
-- MORE VEGETABLES
-- =====================================================================

-- Asparagus
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('asparagus', '{"en": "Asparagus", "fr": "Asperge", "es": "Espárrago"}', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Brussels Sprouts
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('brussels sprout', '{"en": "Brussels Sprout", "fr": "Chou de Bruxelles", "es": "Coles de Bruselas"}', 'brussels sprouts', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cabbage
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('cabbage', '{"en": "Cabbage", "fr": "Chou", "es": "Repollo"}', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Corn
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('corn', '{"en": "Corn", "fr": "Maïs", "es": "Maíz"}', 'corns', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'corn'), 'sweet corn', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'corn'), 'baby corn', 7)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Peas
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('pea', '{"en": "Pea", "fr": "Petit pois", "es": "Guisante"}', 'peas', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Green Beans
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('green bean', '{"en": "Green Bean", "fr": "Haricot vert", "es": "Judías verdes"}', 'green beans', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Corn (maize)
INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES ((SELECT id FROM public.ingredients WHERE canonical_name = 'corn'), 'maize', 7)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Sweet Potato
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES ('sweet potato', '{"en": "Sweet Potato", "fr": "Patate douce", "es": "Batata"}', 'sweet potatoes', 'vegetable', 'root', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Yam
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('yam', '{"en": "Yam", "fr": "Igname", "es": "Ñame"}', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Beet
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES ('beet', '{"en": "Beet", "fr": "Betterave", "es": "Remolacha"}', 'beets', 'vegetable', 'root', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Radish
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, subcategory, is_common) 
VALUES ('radish', '{"en": "Radish", "fr": "Radis", "es": "Rábano"}', 'radishes', 'vegetable', 'root', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Turnip
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('turnip', '{"en": "Turnip", "fr": "Navet", "es": "Nabo"}', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Rutabaga
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('rutabaga', '{"en": "Rutabaga", "fr": "Chou-navet", "es": "Nabicol"}', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Leek
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('leek', '{"en": "Leek", "fr": "Poireau", "es": "Puerro"}', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Fennel
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('fennel', '{"en": "Fennel", "fr": "Fenouil", "es": "Hinojo"}', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Artichoke
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('artichoke', '{"en": "Artichoke", "fr": "Artichaut", "es": "Alcachofa"}', 'artichokes', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Okra
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('okra', '{"en": "Okra", "fr": "Gombo", "es": "Okra"}', 'vegetable', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- MORE FRUITS
-- =====================================================================

-- Watermelon
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('watermelon', '{"en": "Watermelon", "fr": "Pastèque", "es": "Sandía"}', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Pineapple
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('pineapple', '{"en": "Pineapple", "fr": "Ananas", "es": "Piña"}', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Mango
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('mango', '{"en": "Mango", "fr": "Mangue", "es": "Mango"}', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Kiwi
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('kiwi', '{"en": "Kiwi", "fr": "Kiwi", "es": "Kiwi"}', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Grapefruit
INSERT INTO public.ingredients (canonical_name, display_name, category, subcategory, is_common) 
VALUES ('grapefruit', '{"en": "Grapefruit", "fr": "Pamplemousse", "es": "Pomelo"}', 'fruit', 'citrus', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Peach
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('peach', '{"en": "Peach", "fr": "Pêche", "es": "Melocotón"}', 'peaches', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Pear
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('pear', '{"en": "Pear", "fr": "Poire", "es": "Pera"}', 'pears', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Plum
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('plum', '{"en": "Plum", "fr": "Prune", "es": "Ciruela"}', 'plums', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cherry
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('cherry', '{"en": "Cherry", "fr": "Cerise", "es": "Cereza"}', 'cherries', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Pomegranate
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('pomegranate', '{"en": "Pomegranate", "fr": "Grenade", "es": "Granada"}', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Fig
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('fig', '{"en": "Fig", "fr": "Figue", "es": "Higo"}', 'figs', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Date (fruit)
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('date', '{"en": "Date", "fr": "Datte", "es": "Dátil"}', 'dates', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Papaya
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('papaya', '{"en": "Papaya", "fr": "Papaye", "es": "Papaya"}', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Guava
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('guava', '{"en": "Guava", "fr": "Goyave", "es": "Guayaba"}', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Passion Fruit
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('passion fruit', '{"en": "Passion Fruit", "fr": "Fruit de la passion", "es": "Maracuyá"}', 'fruit', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- MORE PROTEINS
-- =====================================================================

-- Turkey
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('turkey', '{"en": "Turkey", "fr": "Dinde", "es": "Pavo"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'turkey'), 'ground turkey', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'turkey'), 'turkey breast', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Lamb
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('lamb', '{"en": "Lamb", "fr": "Agneau", "es": "Cordero"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Veal
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('veal', '{"en": "Veal", "fr": "Veau", "es": "Ternera"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Venison
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('venison', '{"en": "Venison", "fr": "Viande de cerf", "es": "Venado"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Duck
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('duck', '{"en": "Duck", "fr": "Canard", "es": "Pato"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Goose
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('goose', '{"en": "Goose", "fr": "Oie", "es": "Ganso"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Quail
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('quail', '{"en": "Quail", "fr": "Caille", "es": "Codorniz"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cod
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('cod', '{"en": "Cod", "fr": "Morue", "es": "Bacalao"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Tilapia
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('tilapia', '{"en": "Tilapia", "fr": "Tilapia", "es": "Tilapia"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Haddock
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('haddock', '{"en": "Haddock", "fr": "Aiglefin", "es": "Eglefino"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Halibut
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('halibut', '{"en": "Halibut", "fr": "Flétan", "es": "Halibut"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Sardine
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('sardine', '{"en": "Sardine", "fr": "Sardine", "es": "Sardina"}', 'sardines', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Anchovy
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('anchovy', '{"en": "Anchovy", "fr": "Anchois", "es": "Anchoa"}', 'anchovies', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Scallop
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('scallop', '{"en": "Scallop", "fr": "Coquille Saint-Jacques", "es": "Vieira"}', 'scallops', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Mussel
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('mussel', '{"en": "Mussel", "fr": "Moule", "es": "Mejillón"}', 'mussels', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Clam
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('clam', '{"en": "Clam", "fr": "Palourde", "es": "Almeja"}', 'clams', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Oyster
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('oyster', '{"en": "Oyster", "fr": "Huître", "es": "Ostra"}', 'oysters', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Lobster
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('lobster', '{"en": "Lobster", "fr": "Homard", "es": "Langosta"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Crab
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('crab', '{"en": "Crab", "fr": "Crabe", "es": "Cangrejo"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- PLANT-BASED PROTEINS
-- =====================================================================

-- Tempeh
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('tempeh', '{"en": "Tempeh", "fr": "Tempeh", "es": "Tempeh"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Seitan
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('seitan', '{"en": "Seitan", "fr": "Seitan", "es": "Seitán"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Textured Vegetable Protein
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('tvp', '{"en": "Textured Vegetable Protein", "fr": "Protéine végétale texturée", "es": "Proteína vegetal texturizada"}', 'protein', true)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES ((SELECT id FROM public.ingredients WHERE canonical_name = 'tvp'), 'textured vegetable protein', 10)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- =====================================================================
-- DAIRY EXTENDED
-- =====================================================================

-- Sour Cream
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('sour cream', '{"en": "Sour Cream", "fr": "Crème aigre", "es": "Crema agria"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Whipping Cream
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('whipping cream', '{"en": "Whipping Cream", "fr": "Crème à fouetter", "es": "Crema para batir"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Heavy Cream
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('heavy cream', '{"en": "Heavy Cream", "fr": "Crème épaisse", "es": "Crema espesa"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Half and Half
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('half and half', '{"en": "Half and Half", "fr": "Moitié-moitié", "es": "Media crema"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Buttermilk
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('buttermilk', '{"en": "Buttermilk", "fr": "Babeurre", "es": "Suero de leche"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Evaporated Milk
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('evaporated milk', '{"en": "Evaporated Milk", "fr": "Lait concentré", "es": "Leche evaporada"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Condensed Milk
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('condensed milk', '{"en": "Condensed Milk", "fr": "Lait concentré sucré", "es": "Leche condensada"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cream Cheese
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('cream cheese', '{"en": "Cream Cheese", "fr": "Fromage à tartiner", "es": "Queso crema"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Blue Cheese
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('blue cheese', '{"en": "Blue Cheese", "fr": "Fromage bleu", "es": "Queso azul"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Gouda
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('gouda', '{"en": "Gouda", "fr": "Gouda", "es": "Gouda"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Swiss Cheese
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('swiss cheese', '{"en": "Swiss Cheese", "fr": "Fromage suisse", "es": "Queso suizo"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Provolone
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('provolone', '{"en": "Provolone", "fr": "Provolone", "es": "Provolone"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Pepper Jack
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('pepper jack', '{"en": "Pepper Jack", "fr": "Fromage poivré", "es": "Queso pepper jack"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Colby
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('colby', '{"en": "Colby", "fr": "Colby", "es": "Colby"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Monterey Jack
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('monterey jack', '{"en": "Monterey Jack", "fr": "Monterey Jack", "es": "Monterey Jack"}', 'dairy', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- MORE GRAINS
-- =====================================================================

-- Barley
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('barley', '{"en": "Barley", "fr": "Orge", "es": "Cebada"}', 'grain', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Couscous
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('couscous', '{"en": "Couscous", "fr": "Couscous", "es": "Cuscús"}', 'grain', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Polenta
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('polenta', '{"en": "Polenta", "fr": "Polenta", "es": "Polenta"}', 'grain', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Bulgur
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('bulgur', '{"en": "Bulgur", "fr": "Boulgour", "es": "Bulgur"}', 'grain', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Farro
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('farro', '{"en": "Farro", "fr": "Farro", "es": "Farro"}', 'grain', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Millet
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('millet', '{"en": "Millet", "fr": "Millet", "es": "Mijo"}', 'grain', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Buckwheat
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('buckwheat', '{"en": "Buckwheat", "fr": "Sarrasin", "es": "Alforfón"}', 'grain', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Spelt
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('spelt', '{"en": "Spelt", "fr": "Épeautre", "es": "Espelta"}', 'grain', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- SPICES EXTENDED
-- =====================================================================

-- Cinnamon
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('cinnamon', '{"en": "Cinnamon", "fr": "Cannelle", "es": "Canela"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Nutmeg
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('nutmeg', '{"en": "Nutmeg", "fr": "Noix de muscade", "es": "Nuez moscada"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cloves
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('clove', '{"en": "Clove", "fr": "Clou de girofle", "es": "Clavo de olor"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Allspice
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('allspice', '{"en": "Allspice", "fr": "Tout-épices", "es": "Pimienta de Jamaica"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Cardamom
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('cardamom', '{"en": "Cardamom", "fr": "Cardamome", "es": "Cardamomo"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Star Anise
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('star anise', '{"en": "Star Anise", "fr": "Badiane", "es": "Anís estrellado"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Fennel Seed
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('fennel seed', '{"en": "Fennel Seed", "fr": "Graine de fenouil", "es": "Semilla de hinojo"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Mustard Seed
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('mustard seed', '{"en": "Mustard Seed", "fr": "Graine de moutarde", "es": "Semilla de mostaza"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Caraway
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('caraway', '{"en": "Caraway", "fr": "Cumin des prés", "es": "Alcaravea"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Celery Seed
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('celery seed', '{"en": "Celery Seed", "fr": "Graine de céleri", "es": "Semilla de apio"}', 'spice', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- HERBS EXTENDED
-- =====================================================================

-- Dill
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('dill', '{"en": "Dill", "fr": "Aneth", "es": "Eneldo"}', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Sage
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('sage', '{"en": "Sage", "fr": "Sauge", "es": "Salvia"}', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Marjoram
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('marjoram', '{"en": "Marjoram", "fr": "Marjolaine", "es": "Bettera"}', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Tarragon
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('tarragon', '{"en": "Tarragon", "fr": "Estragon", "es": "Estragón"}', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Chives
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('chive', '{"en": "Chive", "fr": "Ciboulette", "es": "Cebollino"}', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES ((SELECT id FROM public.ingredients WHERE canonical_name = 'chive'), 'chives', 10)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Bay Leaf
INSERT INTO public.ingredients (canonical_name, display_name, plural_name, category, is_common) 
VALUES ('bay leaf', '{"en": "Bay Leaf", "fr": "Feuille de laurier", "es": "Hoja de laurel"}', 'bay leaves', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Mint
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('mint', '{"en": "Mint", "fr": "Menthe", "es": "Menta"}', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

INSERT INTO public.ingredient_synonyms (ingredient_id, synonym, priority) 
VALUES 
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'mint'), 'peppermint', 8),
  ((SELECT id FROM public.ingredients WHERE canonical_name = 'mint'), 'spearmint', 8)
ON CONFLICT (ingredient_id, synonym) DO NOTHING;

-- Lavender
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('lavender', '{"en": "Lavender", "fr": "Lavande", "es": "Lavanda"}', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- Lemongrass
INSERT INTO public.ingredients (canonical_name, display_name, category, is_common) 
VALUES ('lemongrass', '{"en": "Lemongrass", "fr": "Citronnelle", "es": "Hierba limón"}', 'herb', true)
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================================
-- COMMENT: Total ingredients now ~250
-- Additional ingredients can be added as needed
-- =====================================================================
