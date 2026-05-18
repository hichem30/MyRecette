-- =====================================================================
-- Red Barn Western Market — Seed Data
-- Optional. Run after 0001_init.sql if you want the same starter catalog
-- the storefront uses when running on mock data.
--
-- Categories reflect the actual Red Barn Western Market business in
-- Sand Springs, OK: a local retail trading post selling lumber, hardware,
-- plumbing, mattresses, clothing, groceries, salvage finds, and more.
-- =====================================================================

insert into public.categories (slug, name, image_url, icon, item_count) values
  ('lumber',              '{"en":"Lumber","es":"Madera"}',                                 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=1200&q=70', 'TreePine',       240),
  ('hardware',            '{"en":"Hardware","es":"Ferretería"}',                           'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1200&q=70', 'Wrench',         520),
  ('building-materials',  '{"en":"Building Materials","es":"Materiales de Construcción"}', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=70', 'Hammer',         310),
  ('plumbing',            '{"en":"Plumbing","es":"Plomería"}',                             'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=70', 'Wrench',         140),
  ('flooring',            '{"en":"Flooring","es":"Pisos"}',                                'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=1200&q=70', 'Square',          90),
  ('paint-finishes',      '{"en":"Paint & Finishes","es":"Pintura y Acabados"}',           'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=70', 'PaintBucket',    145),
  ('mattresses',          '{"en":"Mattresses","es":"Colchones"}',                          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=70', 'BedDouble',       40),
  ('clothing',            '{"en":"Clothing","es":"Ropa"}',                                 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=70', 'Shirt',          120),
  ('groceries',           '{"en":"Groceries","es":"Comestibles"}',                         'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70', 'ShoppingBasket',  85),
  ('salvage',             '{"en":"Salvage & Finds","es":"Salvamento y Hallazgos"}',        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=70', 'Boxes',           70)
on conflict (slug) do nothing;
