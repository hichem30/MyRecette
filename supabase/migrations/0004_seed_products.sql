-- =====================================================================
-- Red Barn Western Market — Product Seed + Category Image Refresh
-- Adds the 16 starter products and refreshes category images to the
-- known-good URLs used by the storefront's mock data. Run once after
-- 0001, 0002, 0003. Idempotent: re-running has no effect.
-- =====================================================================

-- Refresh category images to known-good Unsplash photos.
update public.categories set image_url = 'https://images.unsplash.com/photo-1593179357196-705d7578a05c?auto=format&fit=crop&w=1200&q=70' where slug = 'feed-livestock';
update public.categories set image_url = 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=1200&q=70' where slug = 'lumber';
update public.categories set image_url = 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1200&q=70' where slug = 'hardware';
update public.categories set image_url = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=70' where slug = 'building-materials';
update public.categories set image_url = 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=1200&q=70' where slug = 'flooring';
update public.categories set image_url = 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=70' where slug = 'paint-finishes';
update public.categories set image_url = 'https://images.unsplash.com/photo-1517495306984-f84210f9daa8?auto=format&fit=crop&w=1200&q=70' where slug = 'railroad-ties';
update public.categories set image_url = 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=70' where slug = 'farm-ranch';

-- Seed 16 starter products. Admin can edit/delete/add more from /admin/products.
insert into public.products
  (slug, name, description, price, original_price, image_url, category_slug, discount, discount_text, new_arrival, stock, featured, best_seller, free_shipping)
values
  (
    'purina-omolene-100-horse-feed-50lb',
    '{"en":"Purina Omolene 100 Horse Feed — 50 lb","es":"Alimento para Caballos Purina Omolene 100 — 22.7 kg"}',
    '{"en":"Sweet horse feed blended for working horses. Energy-rich molasses and grain.","es":"Alimento dulce mezclado para caballos de trabajo. Rico en melaza y granos."}',
    24.99, null,
    'https://images.unsplash.com/photo-1605185987060-4dbf1c082d0a?auto=format&fit=crop&w=900&q=70',
    'feed-livestock', false, null, true, 32, true, false, false
  ),
  (
    'cattle-mineral-block-50lb',
    '{"en":"Cattle Mineral Block — 50 lb","es":"Bloque Mineral para Ganado — 22.7 kg"}',
    '{"en":"All-purpose mineral block for cattle. Provides essential trace minerals.","es":"Bloque mineral para ganado. Provee minerales esenciales."}',
    18.99, null,
    'https://images.unsplash.com/photo-1605185987060-4dbf1c082d0a?auto=format&fit=crop&w=900&q=70',
    'feed-livestock', false, null, true, 50, false, false, false
  ),
  (
    'automatic-poultry-waterer-5gal',
    '{"en":"Automatic Poultry Waterer — 5 Gallon","es":"Bebedero Automático para Aves — 19 L"}',
    '{"en":"Auto-fill waterer for chickens and small flocks. Keeps water fresh longer.","es":"Bebedero auto-llenado para gallinas y aves. Mantiene el agua fresca."}',
    34.99, null,
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=70',
    'feed-livestock', false, null, true, 14, false, false, false
  ),
  (
    'douglas-fir-2x4-stud-8ft',
    '{"en":"Douglas Fir 2×4 Stud — 8 ft","es":"Madera Douglas Fir 2×4 — 2.4 m"}',
    '{"en":"Construction-grade kiln-dried Douglas Fir stud. Straight and stable.","es":"Madera Douglas Fir secada al horno, grado construcción."}',
    6.49, null,
    'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=900&q=70',
    'lumber', false, null, true, 480, true, false, false
  ),
  (
    'treated-pine-deck-board-5-4x6-16ft',
    '{"en":"Treated Pine Deck Board 5/4×6 — 16 ft","es":"Tabla de Cubierta Pino Tratado 5/4×6 — 4.9 m"}',
    '{"en":"Pressure-treated pine deck board. Resists rot, fungal decay, and termites.","es":"Tabla de pino tratado a presión. Resiste pudrición y termitas."}',
    14.99, null,
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=70',
    'lumber', false, null, false, 220, false, false, false
  ),
  (
    'grip-rite-yd-framing-nails-5lb',
    '{"en":"Grip-Rite Y''d Framing Nails — 5 lb Box","es":"Clavos de Encuadre Grip-Rite — Caja de 2.3 kg"}',
    '{"en":"Bulk box of bright steel framing nails. For studs, joists, plates, more.","es":"Caja a granel de clavos de acero brillante para encuadre."}',
    12.99, null,
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=900&q=70',
    'hardware', false, null, false, 95, false, false, false
  ),
  (
    'ranch-hand-premium-work-gloves',
    '{"en":"Ranch Hand Premium Work Gloves","es":"Guantes de Trabajo Premium Ranch Hand"}',
    '{"en":"Top-grain leather work gloves with reinforced palm. Built for the long haul.","es":"Guantes de cuero con palma reforzada. Hechos para durar."}',
    24.99, null,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=70',
    'hardware', false, null, true, 60, true, false, false
  ),
  (
    'quikrete-80lb-concrete-mix',
    '{"en":"QuikCrete 80 lb Concrete Mix","es":"Mezcla de Concreto QuikCrete 36 kg"}',
    '{"en":"All-purpose concrete mix. For posts, slabs, footings, walkways.","es":"Mezcla de concreto multipropósito."}',
    8.99, null,
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70',
    'building-materials', false, null, true, 320, false, false, false
  ),
  (
    'osb-sheathing-panel-7-16-4x8',
    '{"en":"OSB Sheathing Panel 7/16\" — 4×8 ft","es":"Panel OSB 7/16\" — 1.2×2.4 m"}',
    '{"en":"Structural OSB sheathing. APA-rated for wall and roof sheathing.","es":"Panel estructural OSB. Para paredes y techos."}',
    22.49, 28.99,
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70',
    'building-materials', true, '{"en":"22% OFF","es":"22% DESC"}', false, 180, true, false, false
  ),
  (
    'vinyl-plank-flooring-rustic-oak-20sq',
    '{"en":"Vinyl Plank Flooring — Rustic Oak 20 sq ft","es":"Piso de Vinilo Rustic Oak — 1.86 m²"}',
    '{"en":"Luxury vinyl plank with rustic oak texture. Waterproof, scratch-resistant.","es":"Piso de vinilo de lujo con textura de roble. Impermeable y resistente."}',
    54.99, 74.99,
    'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=900&q=70',
    'flooring', true, '{"en":"27% OFF","es":"27% DESC"}', false, 75, true, true, true
  ),
  (
    'sherwin-williams-superpaint-exterior-1gal',
    '{"en":"Sherwin-Williams SuperPaint Exterior — 1 Gal","es":"Sherwin-Williams SuperPaint Exterior — 3.78 L"}',
    '{"en":"Premium exterior paint with mildew-resistant coating. Lifetime warranty.","es":"Pintura exterior premium con revestimiento anti-moho. Garantía de por vida."}',
    49.99, 64.99,
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=70',
    'paint-finishes', true, '{"en":"23% OFF","es":"23% DESC"}', false, 110, true, true, false
  ),
  (
    'behr-marquee-interior-paint-1gal',
    '{"en":"Behr Marquee Interior Paint — 1 Gal","es":"Pintura Interior Behr Marquee — 3.78 L"}',
    '{"en":"One-coat hide interior paint. Stain-resistant finish.","es":"Pintura interior de un solo paso. Acabado anti-manchas."}',
    44.99, null,
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=70',
    'paint-finishes', false, null, false, 80, false, false, false
  ),
  (
    'new-oak-railroad-tie-6x8x8-5',
    '{"en":"New Oak Railroad Tie — 6×8×8.5 ft","es":"Durmiente Roble Nuevo — 6×8×2.6 m"}',
    '{"en":"Premium grade new oak railroad tie. For landscaping and retaining walls.","es":"Durmiente de roble grado premium. Para paisajismo y muros de contención."}',
    29.99, 39.99,
    'https://images.unsplash.com/photo-1517495306984-f84210f9daa8?auto=format&fit=crop&w=900&q=70',
    'railroad-ties', true, '{"en":"25% OFF","es":"25% DESC"}', false, 45, false, false, false
  ),
  (
    'galvanized-stock-tank-100gal',
    '{"en":"Galvanized Stock Tank — 100 Gal","es":"Tanque Galvanizado para Ganado — 379 L"}',
    '{"en":"Heavy-duty galvanized steel stock tank. Rust-resistant, rolled-rim.","es":"Tanque de acero galvanizado resistente. Anti-óxido."}',
    54.99, 79.99,
    'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=900&q=70',
    'farm-ranch', true, '{"en":"31% OFF","es":"31% DESC"}', false, 25, true, false, false
  ),
  (
    'barbed-wire-fence-1320ft',
    '{"en":"Barbed Wire Fence — 1,320 ft Roll","es":"Cerca de Alambre de Púas — 402 m"}',
    '{"en":"Heavy gauge barbed wire roll. For cattle and ranch perimeters.","es":"Rollo de alambre de púas resistente. Para perímetros de rancho."}',
    79.99, null,
    'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=900&q=70',
    'farm-ranch', false, null, false, 40, false, false, false
  ),
  (
    'laminate-flooring-pine-15sq',
    '{"en":"Laminate Flooring — Knotty Pine 15 sq ft","es":"Piso Laminado — Pino Nudoso 1.39 m²"}',
    '{"en":"12mm laminate flooring with knotty pine pattern. Easy click-lock install.","es":"Piso laminado de 12mm con patrón de pino nudoso."}',
    32.99, null,
    'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=900&q=70',
    'flooring', false, null, false, 55, false, false, false
  )
on conflict (slug) do nothing;
