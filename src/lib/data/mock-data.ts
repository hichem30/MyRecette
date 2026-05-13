import { Category, Product } from "../types";

export const mockCategories: Category[] = [
  {
    id: "cat-feed",
    slug: "feed-livestock",
    name: { en: "Feed & Livestock", es: "Alimento y Ganado" },
    image_url:
      "https://images.unsplash.com/photo-1593179357196-705d7578a05c?auto=format&fit=crop&w=1200&q=70",
    icon: "🐴",
    item_count: 64,
  },
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
    id: "cat-railroad",
    slug: "railroad-ties",
    name: { en: "Railroad Ties", es: "Durmientes" },
    image_url:
      "https://images.unsplash.com/photo-1517495306984-f84210f9daa8?auto=format&fit=crop&w=1200&q=70",
    icon: "🛤️",
    item_count: 22,
  },
  {
    id: "cat-farm",
    slug: "farm-ranch",
    name: { en: "Farm & Ranch", es: "Granja y Rancho" },
    image_url:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=70",
    icon: "🌾",
    item_count: 93,
  },
];

export const mockProducts: Product[] = [
  {
    id: "p-1",
    slug: "purina-omolene-100-horse-feed-50lb",
    name: {
      en: "Purina Omolene 100 Horse Feed — 50 lb",
      es: "Alimento para Caballos Purina Omolene 100 — 22.7 kg",
    },
    description: {
      en: "Sweet horse feed blended for working horses. Energy-rich molasses and grain.",
      es: "Alimento dulce mezclado para caballos de trabajo. Rico en melaza y granos.",
    },
    price: 24.99,
    image_url:
      "https://images.unsplash.com/photo-1605185987060-4dbf1c082d0a?auto=format&fit=crop&w=900&q=70",
    category_slug: "feed-livestock",
    discount: false,
    new_arrival: true,
    stock: 32,
    featured: true,
  },
  {
    id: "p-2",
    slug: "cattle-mineral-block-50lb",
    name: {
      en: "Cattle Mineral Block — 50 lb",
      es: "Bloque Mineral para Ganado — 22.7 kg",
    },
    description: {
      en: "All-purpose mineral block for cattle. Provides essential trace minerals.",
      es: "Bloque mineral para ganado. Provee minerales esenciales.",
    },
    price: 18.99,
    image_url:
      "https://images.unsplash.com/photo-1605185987060-4dbf1c082d0a?auto=format&fit=crop&w=900&q=70",
    category_slug: "feed-livestock",
    discount: false,
    new_arrival: true,
    stock: 50,
    featured: false,
  },
  {
    id: "p-3",
    slug: "automatic-poultry-waterer-5gal",
    name: {
      en: "Automatic Poultry Waterer — 5 Gallon",
      es: "Bebedero Automático para Aves — 19 L",
    },
    description: {
      en: "Auto-fill waterer for chickens and small flocks. Keeps water fresh longer.",
      es: "Bebedero auto-llenado para gallinas y aves. Mantiene el agua fresca.",
    },
    price: 34.99,
    image_url:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=70",
    category_slug: "feed-livestock",
    discount: false,
    new_arrival: true,
    stock: 14,
    featured: false,
  },
  {
    id: "p-4",
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
    id: "p-5",
    slug: "treated-pine-deck-board-5-4x6-16ft",
    name: {
      en: 'Treated Pine Deck Board 5/4×6 — 16 ft',
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
  {
    id: "p-6",
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
    id: "p-7",
    slug: "ranch-hand-premium-work-gloves",
    name: {
      en: "Ranch Hand Premium Work Gloves",
      es: "Guantes de Trabajo Premium Ranch Hand",
    },
    description: {
      en: "Top-grain leather work gloves with reinforced palm. Built for the long haul.",
      es: "Guantes de cuero con palma reforzada. Hechos para durar.",
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
  {
    id: "p-8",
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
    id: "p-9",
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
    id: "p-12",
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
  {
    id: "p-13",
    slug: "new-oak-railroad-tie-6x8x8-5",
    name: {
      en: "New Oak Railroad Tie — 6×8×8.5 ft",
      es: "Durmiente Roble Nuevo — 6×8×2.6 m",
    },
    description: {
      en: "Premium grade new oak railroad tie. For landscaping and retaining walls.",
      es: "Durmiente de roble grado premium. Para paisajismo y muros de contención.",
    },
    price: 29.99,
    original_price: 39.99,
    image_url:
      "https://images.unsplash.com/photo-1517495306984-f84210f9daa8?auto=format&fit=crop&w=900&q=70",
    category_slug: "railroad-ties",
    discount: true,
    discount_text: { en: "25% OFF", es: "25% DESC" },
    new_arrival: false,
    stock: 45,
    featured: false,
  },
  {
    id: "p-14",
    slug: "galvanized-stock-tank-100gal",
    name: {
      en: "Galvanized Stock Tank — 100 Gal",
      es: "Tanque Galvanizado para Ganado — 379 L",
    },
    description: {
      en: "Heavy-duty galvanized steel stock tank. Rust-resistant, rolled-rim.",
      es: "Tanque de acero galvanizado resistente. Anti-óxido.",
    },
    price: 54.99,
    original_price: 79.99,
    image_url:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=900&q=70",
    category_slug: "farm-ranch",
    discount: true,
    discount_text: { en: "31% OFF", es: "31% DESC" },
    new_arrival: false,
    stock: 25,
    featured: true,
  },
  {
    id: "p-15",
    slug: "barbed-wire-fence-1320ft",
    name: {
      en: "Barbed Wire Fence — 1,320 ft Roll",
      es: "Cerca de Alambre de Púas — 402 m",
    },
    description: {
      en: "Heavy gauge barbed wire roll. For cattle and ranch perimeters.",
      es: "Rollo de alambre de púas resistente. Para perímetros de rancho.",
    },
    price: 79.99,
    image_url:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=900&q=70",
    category_slug: "farm-ranch",
    discount: false,
    new_arrival: false,
    stock: 40,
    featured: false,
  },
  {
    id: "p-16",
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
];
