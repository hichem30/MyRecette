import { Category, Product } from "../types";

export const mockCategories: Category[] = [
  {
    id: "cat-lumber",
    slug: "lumber",
    name: { en: "Lumber", es: "Madera" },
    image_url:
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=1200&q=70",
    icon: "🪵",
    item_count: 89,
  },
  {
    id: "cat-hardware",
    slug: "hardware",
    name: { en: "Hardware", es: "Ferretería" },
    image_url:
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1200&q=70",
    icon: "🔧",
    item_count: 112,
  },
  {
    id: "cat-building",
    slug: "building-materials",
    name: { en: "Building Materials", es: "Materiales de Construcción" },
    image_url:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=70",
    icon: "🏗️",
    item_count: 74,
  },
  {
    id: "cat-plumbing",
    slug: "plumbing",
    name: { en: "Plumbing", es: "Plomería" },
    image_url:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=70",
    icon: "🚿",
    item_count: 36,
  },
  {
    id: "cat-flooring",
    slug: "flooring",
    name: { en: "Flooring", es: "Pisos" },
    image_url:
      "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=1200&q=70",
    icon: "🧱",
    item_count: 48,
  },
  {
    id: "cat-paint",
    slug: "paint-finishes",
    name: { en: "Paint & Finishes", es: "Pintura y Acabados" },
    image_url:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=70",
    icon: "🎨",
    item_count: 56,
  },
  {
    id: "cat-mattresses",
    slug: "mattresses",
    name: { en: "Mattresses", es: "Colchones" },
    image_url:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=70",
    icon: "🛏️",
    item_count: 18,
  },
  {
    id: "cat-clothing",
    slug: "clothing",
    name: { en: "Clothing", es: "Ropa" },
    image_url:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=70",
    icon: "👕",
    item_count: 64,
  },
  {
    id: "cat-groceries",
    slug: "groceries",
    name: { en: "Groceries", es: "Comestibles" },
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70",
    icon: "🛒",
    item_count: 42,
  },
  {
    id: "cat-salvage",
    slug: "salvage",
    name: { en: "Salvage & Finds", es: "Salvamento y Hallazgos" },
    image_url:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=70",
    icon: "📦",
    item_count: 28,
  },
];

export const mockProducts: Product[] = [
  // Lumber
  {
    id: "p-1",
    slug: "douglas-fir-2x4-stud-8ft",
    name: {
      en: "Douglas Fir 2×4 Stud — 8 ft",
      es: "Madera Douglas Fir 2×4 — 2.4 m",
    },
    description: {
      en: "Construction-grade kiln-dried Douglas Fir stud. Straight and stable.",
      es: "Madera Douglas Fir secada al horno, grado construcción.",
    },
    price: 6.49,
    image_url:
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=900&q=70",
    category_slug: "lumber",
    discount: false,
    new_arrival: true,
    stock: 480,
    featured: true,
  },
  {
    id: "p-2",
    slug: "treated-pine-deck-board-5-4x6-16ft",
    name: {
      en: "Treated Pine Deck Board 5/4×6 — 16 ft",
      es: "Tabla de Cubierta Pino Tratado 5/4×6 — 4.9 m",
    },
    description: {
      en: "Pressure-treated pine deck board. Resists rot, fungal decay, and termites.",
      es: "Tabla de pino tratado a presión. Resiste pudrición y termitas.",
    },
    price: 14.99,
    image_url:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=70",
    category_slug: "lumber",
    discount: false,
    new_arrival: false,
    stock: 220,
    featured: false,
  },

  // Hardware
  {
    id: "p-3",
    slug: "grip-rite-yd-framing-nails-5lb",
    name: {
      en: "Grip-Rite Y'd Framing Nails — 5 lb Box",
      es: "Clavos de Encuadre Grip-Rite — Caja de 2.3 kg",
    },
    description: {
      en: "Bulk box of bright steel framing nails. For studs, joists, plates, more.",
      es: "Caja a granel de clavos de acero brillante para encuadre.",
    },
    price: 12.99,
    image_url:
      "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=900&q=70",
    category_slug: "hardware",
    discount: false,
    new_arrival: false,
    stock: 95,
    featured: false,
  },
  {
    id: "p-4",
    slug: "premium-work-gloves",
    name: {
      en: "Premium Leather Work Gloves",
      es: "Guantes de Trabajo Premium de Cuero",
    },
    description: {
      en: "Heavy-duty cowhide work gloves for around the house, the yard, and the workshop.",
      es: "Guantes de cuero resistentes para la casa, el jardín y el taller.",
    },
    price: 24.99,
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=70",
    category_slug: "hardware",
    discount: false,
    new_arrival: true,
    stock: 60,
    featured: true,
  },

  // Building Materials
  {
    id: "p-5",
    slug: "quikrete-80lb-concrete-mix",
    name: {
      en: "QuikCrete 80 lb Concrete Mix",
      es: "Mezcla de Concreto QuikCrete 36 kg",
    },
    description: {
      en: "All-purpose concrete mix. For posts, slabs, footings, walkways.",
      es: "Mezcla de concreto multipropósito.",
    },
    price: 8.99,
    image_url:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70",
    category_slug: "building-materials",
    discount: false,
    new_arrival: true,
    stock: 320,
    featured: false,
  },
  {
    id: "p-6",
    slug: "osb-sheathing-panel-7-16-4x8",
    name: {
      en: 'OSB Sheathing Panel 7/16" — 4×8 ft',
      es: "Panel OSB 7/16\" — 1.2×2.4 m",
    },
    description: {
      en: "Structural OSB sheathing. APA-rated for wall and roof sheathing.",
      es: "Panel estructural OSB. Para paredes y techos.",
    },
    price: 22.49,
    original_price: 28.99,
    image_url:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70",
    category_slug: "building-materials",
    discount: true,
    discount_text: { en: "22% OFF", es: "22% DESC" },
    new_arrival: false,
    stock: 180,
    featured: true,
  },

  // Plumbing
  {
    id: "p-7",
    slug: "cast-iron-clawfoot-bathtub-60in",
    name: {
      en: "Cast Iron Clawfoot Bathtub — 60 in",
      es: "Tina Cast Iron con Patas — 60 in",
    },
    description: {
      en: "Heavy cast iron clawfoot tub with porcelain finish. 60-inch length.",
      es: "Tina pesada de hierro fundido con acabado de porcelana. 60 in de largo.",
    },
    price: 689.0,
    image_url:
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=70",
    category_slug: "plumbing",
    discount: false,
    new_arrival: true,
    stock: 4,
    featured: true,
  },
  {
    id: "p-8",
    slug: "pvc-drain-pipe-10ft",
    name: {
      en: "PVC Drain Pipe — 3 in × 10 ft",
      es: "Tubería de Drenaje PVC — 3 in × 10 ft",
    },
    description: {
      en: "Schedule 40 PVC drain, waste, and vent pipe. 3-inch diameter, 10 ft length.",
      es: "Tubería PVC Schedule 40 para drenaje y ventilación. 3 in × 10 ft.",
    },
    price: 18.49,
    image_url:
      "https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?auto=format&fit=crop&w=900&q=70",
    category_slug: "plumbing",
    discount: false,
    new_arrival: false,
    stock: 60,
    featured: false,
  },
  {
    id: "p-9",
    slug: "brass-bathroom-faucet-widespread",
    name: {
      en: "Brass Widespread Bathroom Faucet",
      es: "Llave de Lavabo de Latón",
    },
    description: {
      en: "Two-handle widespread brass-finish lavatory faucet with pop-up drain.",
      es: "Llave de lavabo con dos manijas y acabado de latón, con drenaje.",
    },
    price: 79.0,
    image_url:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=70",
    category_slug: "plumbing",
    discount: false,
    new_arrival: false,
    stock: 12,
    featured: false,
    best_seller: true,
  },

  // Flooring
  {
    id: "p-10",
    slug: "vinyl-plank-flooring-rustic-oak-20sq",
    name: {
      en: "Vinyl Plank Flooring — Rustic Oak 20 sq ft",
      es: "Piso de Vinilo Rustic Oak — 1.86 m²",
    },
    description: {
      en: "Luxury vinyl plank with rustic oak texture. Waterproof, scratch-resistant.",
      es: "Piso de vinilo de lujo con textura de roble. Impermeable y resistente.",
    },
    price: 54.99,
    original_price: 74.99,
    image_url:
      "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=900&q=70",
    category_slug: "flooring",
    discount: true,
    discount_text: { en: "27% OFF", es: "27% DESC" },
    new_arrival: false,
    stock: 75,
    featured: true,
    best_seller: true,
    free_shipping: true,
  },
  {
    id: "p-11",
    slug: "laminate-flooring-pine-15sq",
    name: {
      en: "Laminate Flooring — Knotty Pine 15 sq ft",
      es: "Piso Laminado — Pino Nudoso 1.39 m²",
    },
    description: {
      en: "12mm laminate flooring with knotty pine pattern. Easy click-lock install.",
      es: "Piso laminado de 12mm con patrón de pino nudoso.",
    },
    price: 32.99,
    image_url:
      "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=900&q=70",
    category_slug: "flooring",
    discount: false,
    new_arrival: false,
    stock: 55,
    featured: false,
  },

  // Paint & Finishes
  {
    id: "p-12",
    slug: "sherwin-williams-superpaint-exterior-1gal",
    name: {
      en: "Sherwin-Williams SuperPaint Exterior — 1 Gal",
      es: "Sherwin-Williams SuperPaint Exterior — 3.78 L",
    },
    description: {
      en: "Premium exterior paint with mildew-resistant coating. Lifetime warranty.",
      es: "Pintura exterior premium con revestimiento anti-moho. Garantía de por vida.",
    },
    price: 49.99,
    original_price: 64.99,
    image_url:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=70",
    category_slug: "paint-finishes",
    discount: true,
    discount_text: { en: "23% OFF", es: "23% DESC" },
    new_arrival: false,
    stock: 110,
    featured: true,
    best_seller: true,
  },
  {
    id: "p-13",
    slug: "behr-marquee-interior-paint-1gal",
    name: {
      en: "Behr Marquee Interior Paint — 1 Gal",
      es: "Pintura Interior Behr Marquee — 3.78 L",
    },
    description: {
      en: "One-coat hide interior paint. Stain-resistant finish.",
      es: "Pintura interior de un solo paso. Acabado anti-manchas.",
    },
    price: 44.99,
    image_url:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=70",
    category_slug: "paint-finishes",
    discount: false,
    new_arrival: false,
    stock: 80,
    featured: false,
  },

  // Mattresses
  {
    id: "p-14",
    slug: "queen-memory-foam-mattress-10in",
    name: {
      en: "Queen Memory Foam Mattress — 10 in",
      es: "Colchón Memory Foam Queen — 10 in",
    },
    description: {
      en: "10-inch medium-firm memory foam mattress, queen size. Cool-knit cover.",
      es: "Colchón memory foam de 10 pulgadas, tamaño queen, firmeza media.",
    },
    price: 349.0,
    image_url:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=70",
    category_slug: "mattresses",
    discount: false,
    new_arrival: false,
    stock: 8,
    featured: true,
  },
  {
    id: "p-15",
    slug: "twin-innerspring-mattress",
    name: {
      en: "Twin Innerspring Mattress",
      es: "Colchón Twin de Resortes",
    },
    description: {
      en: "Classic innerspring twin mattress. Quilted top, reinforced edges.",
      es: "Colchón twin de resortes con cubierta acolchada y bordes reforzados.",
    },
    price: 179.0,
    image_url:
      "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?auto=format&fit=crop&w=900&q=70",
    category_slug: "mattresses",
    discount: false,
    new_arrival: false,
    stock: 10,
    featured: false,
  },
  {
    id: "p-16",
    slug: "pillow-top-mattress-pad-king",
    name: {
      en: "Pillow-Top Mattress Pad — King",
      es: "Almohadilla Pillow-Top — King",
    },
    description: {
      en: "Plush pillow-top mattress pad. King size. Fits up to 18-inch deep mattresses.",
      es: "Almohadilla pillow-top tamaño King. Se ajusta a colchones de hasta 18 in.",
    },
    price: 59.99,
    image_url:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=70",
    category_slug: "mattresses",
    discount: false,
    new_arrival: false,
    stock: 18,
    featured: false,
  },

  // Clothing
  {
    id: "p-17",
    slug: "heavy-duty-cotton-work-shirt",
    name: {
      en: "Heavy-Duty Cotton Work Shirt",
      es: "Camisa de Trabajo de Algodón Resistente",
    },
    description: {
      en: "Long-sleeve cotton work shirt. Reinforced seams, button-front, two chest pockets.",
      es: "Camisa de trabajo de manga larga de algodón. Costuras reforzadas, dos bolsillos.",
    },
    price: 24.99,
    image_url:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=70",
    category_slug: "clothing",
    discount: false,
    new_arrival: false,
    stock: 40,
    featured: false,
    best_seller: true,
  },
  {
    id: "p-18",
    slug: "carpenter-denim-jeans",
    name: {
      en: "Carpenter Denim Jeans",
      es: "Pantalones Vaqueros de Carpintero",
    },
    description: {
      en: "14 oz denim carpenter jeans with hammer loop and tool pockets. Five-pocket back.",
      es: "Vaqueros de carpintero de 14 oz con aro de martillo y bolsillos para herramientas.",
    },
    price: 39.99,
    image_url:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=70",
    category_slug: "clothing",
    discount: false,
    new_arrival: false,
    stock: 35,
    featured: false,
  },
  {
    id: "p-19",
    slug: "western-snap-front-shirt",
    name: {
      en: "Western Snap-Front Shirt",
      es: "Camisa Western con Broches a Presión",
    },
    description: {
      en: "Classic snap-front western shirt with yokes and pearl snap buttons.",
      es: "Camisa western clásica con yugos y broches a presión de perla.",
    },
    price: 32.0,
    image_url:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=70",
    category_slug: "clothing",
    discount: false,
    new_arrival: true,
    stock: 22,
    featured: false,
  },

  // Groceries
  {
    id: "p-20",
    slug: "locally-roasted-coffee-12oz",
    name: {
      en: "Locally Roasted Coffee — 12 oz",
      es: "Café Tostado Localmente — 12 oz",
    },
    description: {
      en: "Medium roast, whole bean. Roasted by a small Oklahoma roaster, bagged the same week.",
      es: "Tostado medio, grano entero. Tostado por un tostador local de Oklahoma.",
    },
    price: 14.99,
    image_url:
      "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=900&q=70",
    category_slug: "groceries",
    discount: false,
    new_arrival: false,
    stock: 30,
    featured: true,
  },
  {
    id: "p-21",
    slug: "honey-16oz-jar",
    name: {
      en: "Wildflower Honey — 16 oz",
      es: "Miel de Flores Silvestres — 16 oz",
    },
    description: {
      en: "Raw, unfiltered wildflower honey in a 16 oz glass jar. Locally sourced.",
      es: "Miel cruda sin filtrar de flores silvestres, en frasco de vidrio de 16 oz.",
    },
    price: 9.99,
    image_url:
      "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?auto=format&fit=crop&w=900&q=70",
    category_slug: "groceries",
    discount: false,
    new_arrival: false,
    stock: 24,
    featured: false,
  },
  {
    id: "p-22",
    slug: "pancake-mix-5lb",
    name: {
      en: "Buttermilk Pancake Mix — 5 lb",
      es: "Mezcla para Hot Cakes Buttermilk — 5 lb",
    },
    description: {
      en: "Classic buttermilk pancake mix. Just add water. 5 lb bag.",
      es: "Mezcla clásica para hot cakes. Solo agregue agua. Bolsa de 5 lb.",
    },
    price: 7.49,
    image_url:
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=900&q=70",
    category_slug: "groceries",
    discount: false,
    new_arrival: false,
    stock: 40,
    featured: false,
  },

  // Salvage & Finds
  {
    id: "p-23",
    slug: "salvage-hardwood-interior-doors",
    name: {
      en: "Salvage Hardwood Interior Doors",
      es: "Puertas Interiores de Madera de Salvamento",
    },
    description: {
      en: "Solid hardwood interior doors pulled from area remodels. Assorted sizes — call to check availability before driving over.",
      es: "Puertas interiores de madera sólida de remodelaciones locales. Tamaños variados.",
    },
    price: 35.0,
    image_url:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=70",
    category_slug: "salvage",
    discount: false,
    new_arrival: false,
    stock: 15,
    featured: false,
    best_seller: true,
  },
  {
    id: "p-24",
    slug: "55-gallon-steel-barrel",
    name: {
      en: "55 Gallon Steel Barrel",
      es: "Barril de Acero de 55 Galones",
    },
    description: {
      en: "Re-conditioned 55 gallon steel drum. Great for rainwater, burn barrels, or storage.",
      es: "Barril de acero de 55 galones reacondicionado. Para agua de lluvia o almacenamiento.",
    },
    price: 39.0,
    image_url:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=70",
    category_slug: "salvage",
    discount: false,
    new_arrival: false,
    stock: 25,
    featured: false,
  },
  {
    id: "p-25",
    slug: "reclaimed-cedar-boards-mixed-lot",
    name: {
      en: "Reclaimed Cedar Boards — Mixed Lot",
      es: "Tablas de Cedro Reciclado — Lote Mixto",
    },
    description: {
      en: "Reclaimed cedar planks in assorted widths and lengths. Sold by the bundle.",
      es: "Tablas de cedro recicladas en anchos y largos variados. Vendidas por lote.",
    },
    price: 49.99,
    image_url:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=70",
    category_slug: "salvage",
    discount: false,
    new_arrival: true,
    stock: 8,
    featured: false,
  },
];
