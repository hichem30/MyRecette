-- =====================================================================
-- Red Barn Western Market — Seed Data
-- Optional. Run after 0001_init.sql if you want the same starter catalog
-- the storefront uses when running on mock data.
-- =====================================================================

insert into public.categories (slug, name, image_url, icon, item_count) values
  ('lumber',              '{"en":"Lumber","es":"Madera"}',                   'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=70', 'TreePine', 240),
  ('feed-livestock',      '{"en":"Feed & Livestock","es":"Alimento y Ganado"}', 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=70', 'Wheat', 180),
  ('hardware',            '{"en":"Hardware","es":"Ferretería"}',             'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=70', 'Wrench', 520),
  ('building-materials',  '{"en":"Building Materials","es":"Materiales de Construcción"}', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=70', 'Hammer', 310),
  ('flooring',            '{"en":"Flooring","es":"Pisos"}',                  'https://images.unsplash.com/photo-1581234588340-c9f5fbb9bdaa?auto=format&fit=crop&w=800&q=70', 'Square', 90),
  ('paint-finishes',      '{"en":"Paint & Finishes","es":"Pintura y Acabados"}', 'https://images.unsplash.com/photo-1572053675669-90ed47b4dbc0?auto=format&fit=crop&w=800&q=70', 'PaintBucket', 145),
  ('railroad-ties',       '{"en":"Railroad Ties","es":"Durmientes"}',        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=800&q=70', 'Train', 60),
  ('farm-ranch',          '{"en":"Farm & Ranch","es":"Granja y Rancho"}',    'https://images.unsplash.com/photo-1568393691080-bdb6bce96cef?auto=format&fit=crop&w=800&q=70', 'Tractor', 220)
on conflict (slug) do nothing;
