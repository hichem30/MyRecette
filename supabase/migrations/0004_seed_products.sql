-- =====================================================================
-- Red Barn Western Market — Product Seed
-- Adds starter products that match the actual business in Sand Springs, OK
-- (a local retail trading post: lumber, hardware, plumbing, mattresses,
-- clothing, groceries, salvage, and more). Admin can edit/delete/add more
-- from /admin/products.
--
-- Run after 0001, 0002, 0003. Idempotent: re-running skips existing slugs.
-- =====================================================================

-- Category images are now seeded directly in 0002_seed.sql.

insert into public.products
  (slug, name, description, price, original_price, image_url, category_slug,
   discount, discount_text, new_arrival, stock, featured, best_seller, free_shipping)
values
  -- Lumber
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

  -- Hardware
  (
    'grip-rite-yd-framing-nails-5lb',
    '{"en":"Grip-Rite Y''d Framing Nails — 5 lb Box","es":"Clavos de Encuadre Grip-Rite — Caja de 2.3 kg"}',
    '{"en":"Bulk box of bright steel framing nails. For studs, joists, plates, more.","es":"Caja a granel de clavos de acero brillante para encuadre."}',
    12.99, null,
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=900&q=70',
    'hardware', false, null, false, 95, false, false, false
  ),
  (
    'premium-work-gloves',
    '{"en":"Premium Leather Work Gloves","es":"Guantes de Trabajo Premium de Cuero"}',
    '{"en":"Heavy-duty cowhide work gloves for around the house, the yard, and the workshop.","es":"Guantes de cuero resistentes para la casa, el jardín y el taller."}',
    24.99, null,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=70',
    'hardware', false, null, true, 60, true, false, false
  ),

  -- Building Materials
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

  -- Plumbing
  (
    'cast-iron-clawfoot-bathtub-60in',
    '{"en":"Cast Iron Clawfoot Bathtub — 60 in","es":"Tina Cast Iron con Patas — 60 in"}',
    '{"en":"Heavy cast iron clawfoot tub with porcelain finish. 60-inch length.","es":"Tina pesada de hierro fundido con acabado de porcelana. 60 in de largo."}',
    689.00, null,
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=70',
    'plumbing', false, null, true, 4, true, false, false
  ),
  (
    'pvc-drain-pipe-10ft',
    '{"en":"PVC Drain Pipe — 3 in × 10 ft","es":"Tubería de Drenaje PVC — 3 in × 10 ft"}',
    '{"en":"Schedule 40 PVC drain, waste, and vent pipe. 3-inch diameter, 10 ft length.","es":"Tubería PVC Schedule 40 para drenaje y ventilación. 3 in × 10 ft."}',
    18.49, null,
    'https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?auto=format&fit=crop&w=900&q=70',
    'plumbing', false, null, false, 60, false, false, false
  ),
  (
    'brass-bathroom-faucet-widespread',
    '{"en":"Brass Widespread Bathroom Faucet","es":"Llave de Lavabo de Latón"}',
    '{"en":"Two-handle widespread brass-finish lavatory faucet with pop-up drain.","es":"Llave de lavabo con dos manijas y acabado de latón, con drenaje."}',
    79.00, null,
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=70',
    'plumbing', false, null, false, 12, false, true, false
  ),

  -- Flooring
  (
    'vinyl-plank-flooring-rustic-oak-20sq',
    '{"en":"Vinyl Plank Flooring — Rustic Oak 20 sq ft","es":"Piso de Vinilo Rustic Oak — 1.86 m²"}',
    '{"en":"Luxury vinyl plank with rustic oak texture. Waterproof, scratch-resistant.","es":"Piso de vinilo de lujo con textura de roble. Impermeable y resistente."}',
    54.99, 74.99,
    'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=900&q=70',
    'flooring', true, '{"en":"27% OFF","es":"27% DESC"}', false, 75, true, true, true
  ),
  (
    'laminate-flooring-pine-15sq',
    '{"en":"Laminate Flooring — Knotty Pine 15 sq ft","es":"Piso Laminado — Pino Nudoso 1.39 m²"}',
    '{"en":"12mm laminate flooring with knotty pine pattern. Easy click-lock install.","es":"Piso laminado de 12mm con patrón de pino nudoso."}',
    32.99, null,
    'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=900&q=70',
    'flooring', false, null, false, 55, false, false, false
  ),

  -- Paint & Finishes
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

  -- Mattresses
  (
    'queen-memory-foam-mattress-10in',
    '{"en":"Queen Memory Foam Mattress — 10 in","es":"Colchón Memory Foam Queen — 10 in"}',
    '{"en":"10-inch medium-firm memory foam mattress, queen size. Cool-knit cover.","es":"Colchón memory foam de 10 pulgadas, tamaño queen, firmeza media."}',
    349.00, null,
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=70',
    'mattresses', false, null, false, 8, true, false, false
  ),
  (
    'twin-innerspring-mattress',
    '{"en":"Twin Innerspring Mattress","es":"Colchón Twin de Resortes"}',
    '{"en":"Classic innerspring twin mattress. Quilted top, reinforced edges.","es":"Colchón twin de resortes con cubierta acolchada y bordes reforzados."}',
    179.00, null,
    'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?auto=format&fit=crop&w=900&q=70',
    'mattresses', false, null, false, 10, false, false, false
  ),
  (
    'pillow-top-mattress-pad-king',
    '{"en":"Pillow-Top Mattress Pad — King","es":"Almohadilla Pillow-Top — King"}',
    '{"en":"Plush pillow-top mattress pad. King size. Fits up to 18-inch deep mattresses.","es":"Almohadilla pillow-top tamaño King. Se ajusta a colchones de hasta 18 in."}',
    59.99, null,
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=70',
    'mattresses', false, null, false, 18, false, false, false
  ),

  -- Clothing
  (
    'heavy-duty-cotton-work-shirt',
    '{"en":"Heavy-Duty Cotton Work Shirt","es":"Camisa de Trabajo de Algodón Resistente"}',
    '{"en":"Long-sleeve cotton work shirt. Reinforced seams, button-front, two chest pockets.","es":"Camisa de trabajo de manga larga de algodón. Costuras reforzadas, dos bolsillos."}',
    24.99, null,
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=70',
    'clothing', false, null, false, 40, false, true, false
  ),
  (
    'carpenter-denim-jeans',
    '{"en":"Carpenter Denim Jeans","es":"Pantalones Vaqueros de Carpintero"}',
    '{"en":"14 oz denim carpenter jeans with hammer loop and tool pockets. Five-pocket back.","es":"Vaqueros de carpintero de 14 oz con aro de martillo y bolsillos para herramientas."}',
    39.99, null,
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=70',
    'clothing', false, null, false, 35, false, false, false
  ),
  (
    'western-snap-front-shirt',
    '{"en":"Western Snap-Front Shirt","es":"Camisa Western con Broches a Presión"}',
    '{"en":"Classic snap-front western shirt with yokes and pearl snap buttons.","es":"Camisa western clásica con yugos y broches a presión de perla."}',
    32.00, null,
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=70',
    'clothing', false, null, true, 22, false, false, false
  ),

  -- Groceries
  (
    'locally-roasted-coffee-12oz',
    '{"en":"Locally Roasted Coffee — 12 oz","es":"Café Tostado Localmente — 12 oz"}',
    '{"en":"Medium roast, whole bean. Roasted by a small Oklahoma roaster, bagged the same week.","es":"Tostado medio, grano entero. Tostado por un tostador local de Oklahoma."}',
    14.99, null,
    'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=900&q=70',
    'groceries', false, null, false, 30, true, false, false
  ),
  (
    'honey-16oz-jar',
    '{"en":"Wildflower Honey — 16 oz","es":"Miel de Flores Silvestres — 16 oz"}',
    '{"en":"Raw, unfiltered wildflower honey in a 16 oz glass jar. Locally sourced.","es":"Miel cruda sin filtrar de flores silvestres, en frasco de vidrio de 16 oz."}',
    9.99, null,
    'https://images.unsplash.com/photo-1571513800374-df1bbe650e56?auto=format&fit=crop&w=900&q=70',
    'groceries', false, null, false, 24, false, false, false
  ),
  (
    'pancake-mix-5lb',
    '{"en":"Buttermilk Pancake Mix — 5 lb","es":"Mezcla para Hot Cakes Buttermilk — 5 lb"}',
    '{"en":"Classic buttermilk pancake mix. Just add water. 5 lb bag.","es":"Mezcla clásica para hot cakes. Solo agregue agua. Bolsa de 5 lb."}',
    7.49, null,
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=900&q=70',
    'groceries', false, null, false, 40, false, false, false
  ),

  -- Salvage & Finds
  (
    'salvage-hardwood-interior-doors',
    '{"en":"Salvage Hardwood Interior Doors","es":"Puertas Interiores de Madera de Salvamento"}',
    '{"en":"Solid hardwood interior doors pulled from area remodels. Assorted sizes — call to check availability before driving over.","es":"Puertas interiores de madera sólida de remodelaciones locales. Tamaños variados."}',
    35.00, null,
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=70',
    'salvage', false, null, false, 15, false, true, false
  ),
  (
    '55-gallon-steel-barrel',
    '{"en":"55 Gallon Steel Barrel","es":"Barril de Acero de 55 Galones"}',
    '{"en":"Re-conditioned 55 gallon steel drum. Great for rainwater, burn barrels, or storage.","es":"Barril de acero de 55 galones reacondicionado. Para agua de lluvia o almacenamiento."}',
    39.00, null,
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=70',
    'salvage', false, null, false, 25, false, false, false
  ),
  (
    'reclaimed-cedar-boards-mixed-lot',
    '{"en":"Reclaimed Cedar Boards — Mixed Lot","es":"Tablas de Cedro Reciclado — Lote Mixto"}',
    '{"en":"Reclaimed cedar planks in assorted widths and lengths. Sold by the bundle.","es":"Tablas de cedro recicladas en anchos y largos variados. Vendidas por lote."}',
    49.99, null,
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=70',
    'salvage', false, null, true, 8, false, false, false
  )
on conflict (slug) do nothing;
