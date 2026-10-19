export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: "T-Shirts" | "Shirts" | "Hoodies" | "Bottoms" | "Accessories" | "Jackets";
  collections: string[];
  badge?: "Bestseller" | "New" | "Trending" | "Sale";
  colors: { name: string; hex: string }[];
  sizes: string[];
  description: string;
  details: string[];
  fabricCare: string[];
  fit: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured?: boolean;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    slug: "oversized-essential-tee",
    title: "Oversized Essential Tee",
    price: 799,
    originalPrice: 1199,
    image: "/images/nxtvie/product-oversized-tee-hd.jpg",
    images: [
      "/images/nxtvie/product-oversized-tee-hd.jpg",
      "/images/nxtvie/gallery-1.jpg",
      "/images/nxtvie/gallery-4.jpg",
      "/images/nxtvie/cat-tshirts.jpg",
    ],
    category: "T-Shirts",
    collections: ["men", "clothing", "best-sellers", "urban-essentials", "sale"],
    badge: "Bestseller",
    colors: [
      { name: "Pitch Black", hex: "#181818" },
      { name: "Mineral Grey", hex: "#7A7670" },
      { name: "Bone White", hex: "#EDEAE1" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Crafted from premium 280 GSM combed organic cotton, this signature oversized tee features drop shoulders, reinforced collar taping, and an architectural raw-cut hem tailored for effortless everyday draping.",
    details: [
      "Heavyweight 280 GSM combed organic cotton",
      "Signature drop shoulder relaxed cut",
      "Reinforced rib-knit neckband that retains shape",
      "Pre-shrunk to prevent post-wash distortion",
      "Discreet NXTIVE embroidered tonal emblem",
    ],
    fabricCare: [
      "100% Combed Organic Cotton",
      "Cold machine wash inside out with similar dark tones",
      "Do not bleach or tumble dry",
      "Warm iron on reverse side",
    ],
    fit: "Relaxed Boxy Fit. True to size for intentional oversized silhouette.",
    rating: 4.9,
    reviewCount: 142,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-2",
    slug: "minimal-logo-tee",
    title: "Minimal Logo Tee",
    price: 899,
    originalPrice: 1299,
    image: "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
    images: [
      "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
      "/images/nxtvie/story-back-print-hd.jpg",
      "/images/nxtvie/hero-model.jpg",
    ],
    category: "T-Shirts",
    collections: ["men", "clothing", "new-arrivals", "urban-essentials"],
    badge: "New",
    colors: [
      { name: "Sand Beige", hex: "#E5E0D5" },
      { name: "Onyx Black", hex: "#181818" },
      { name: "Sage Olive", hex: "#596052" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "A serene minimalist staple made from ultra-soft brushed Japanese cotton. Embellished with high-density micro-embroidery of the NXTIVE lightning crest across the chest.",
    details: [
      "260 GSM single jersey ultra-fine cotton",
      "High-density tonal micro-embroidery",
      "Seamless side-seam construction for fluid drape",
      "Garment-dyed for a lived-in heritage patina",
    ],
    fabricCare: [
      "100% Mercerized Cotton",
      "Machine wash cold gentle cycle",
      "Line dry in shade",
      "Iron low",
    ],
    fit: "Modern Regular-Relaxed. Size up for dramatic streetwear volume.",
    rating: 4.8,
    reviewCount: 88,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-3",
    slug: "relaxed-fit-shirt",
    title: "Relaxed Fit Shirt",
    price: 1299,
    originalPrice: 1899,
    image: "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
    images: [
      "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
      "/images/nxtvie/cat-shirts.jpg",
      "/images/nxtvie/hero-model.jpg",
    ],
    category: "Shirts",
    collections: ["men", "clothing", "best-sellers", "premium-basics"],
    badge: "Trending",
    colors: [
      { name: "Military Olive", hex: "#636D56" },
      { name: "Natural Ecru", hex: "#D7D0C5" },
      { name: "Charcoal", hex: "#1F1E1D" },
    ],
    sizes: ["M", "L", "XL", "XXL"],
    description:
      "An understated camp-collar overshirt constructed from a breathable linen-cotton slub. Equipped with twin utility chest pockets, horn-effect buttons, and clean side hem vents.",
    details: [
      "Breathable linen and combed cotton blend",
      "Convertible Cuban/camp style open collar",
      "Twin patch utility chest pockets",
      "Straight hem with reinforced split side vents",
    ],
    fabricCare: [
      "55% French Linen, 45% Organic Cotton",
      "Gentle cold cycle or dry clean",
      "Steam or iron while slightly damp",
    ],
    fit: "Relaxed drape overshirt. Designed to be worn open over tees or buttoned up.",
    rating: 4.9,
    reviewCount: 96,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-4",
    slug: "core-hoodie",
    title: "Core Hoodie",
    price: 1499,
    originalPrice: 2299,
    image: "/images/nxtvie/product-core-hoodie-hd.jpg",
    images: [
      "/images/nxtvie/product-core-hoodie-hd.jpg",
      "/images/nxtvie/cat-hoodies.jpg",
      "/images/nxtvie/gallery-5.jpg",
      "/images/nxtvie/gallery-7.jpg",
    ],
    category: "Hoodies",
    collections: ["men", "clothing", "best-sellers", "urban-essentials", "sale"],
    badge: "Bestseller",
    colors: [
      { name: "Washed Forest", hex: "#4D5344" },
      { name: "Charcoal Heather", hex: "#202020" },
      { name: "Oatmeal Melange", hex: "#BDB7AB" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Engineered from 450 GSM heavyweight diagonal French terry, the Core Hoodie offers unmatched warmth and architectural volume with a double-lined hood and concealed stash pocket.",
    details: [
      "450 GSM loopback French terry",
      "Crossover double-layer hood without drawstrings for clean silhouette",
      "Concealed internal kangaroo pocket compartment",
      "Heavy-gauge 2x2 ribbing on cuffs and hem",
    ],
    fabricCare: [
      "100% Heavyweight French Terry Cotton",
      "Cold wash inside out",
      "Dry flat away from direct heat",
    ],
    fit: "Oversized heavyweight streetwear fit. Drop shoulders and roomy chest.",
    rating: 5.0,
    reviewCount: 164,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-5",
    slug: "cargo-pants",
    title: "Cargo Pants",
    price: 1399,
    originalPrice: 1999,
    image: "/images/nxtvie/product-cargo-pants-hd.jpg",
    images: [
      "/images/nxtvie/product-cargo-pants-hd.jpg",
      "/images/nxtvie/cat-bottoms.jpg",
      "/images/nxtvie/gallery-4.jpg",
    ],
    category: "Bottoms",
    collections: ["men", "clothing", "best-sellers", "urban-essentials"],
    colors: [
      { name: "Army Green", hex: "#5C654E" },
      { name: "Washed Black", hex: "#2B2926" },
      { name: "Desert Khaki", hex: "#8F897E" },
    ],
    sizes: ["30", "32", "34", "36"],
    description:
      "Modernized tactical pants cut from dense cotton ripstop. Features 6 ergonomic bellows pockets, articulated knee darts for freedom of movement, and adjustable bungee cuffs.",
    details: [
      "High-tensile cotton ripstop weave",
      "Articulated knee tailoring for natural movement",
      "6 deep utility cargo pockets with storm flaps",
      "Elasticated back waist with integrated drawstring",
    ],
    fabricCare: [
      "100% Ripstop Cotton",
      "Machine wash warm with like colors",
      "Tumble dry low or hang dry",
    ],
    fit: "Relaxed straight taper with adjustable ankle toggles.",
    rating: 4.8,
    reviewCount: 112,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-6",
    slug: "nxtvie-cap",
    title: "NXTIVE Cap",
    price: 599,
    originalPrice: 899,
    image: "/images/nxtvie/product-cap-hd.jpg",
    images: [
      "/images/nxtvie/product-cap-hd.jpg",
      "/images/nxtvie/cat-accessories.jpg",
      "/images/nxtvie/gallery-3.jpg",
    ],
    category: "Accessories",
    collections: ["accessories", "new-arrivals", "best-sellers"],
    badge: "New",
    colors: [
      { name: "Deep Black", hex: "#151413" },
      { name: "Smoky Charcoal", hex: "#4A4D44" },
      { name: "Warm Cream", hex: "#D5CEC2" },
    ],
    sizes: ["One Size"],
    description:
      "Structured 6-panel low-profile dad cap crafted from heavy cotton twill. Embellished with 3D raised white embroidery of the NXTIVE lightning bolt crest and finished with an antique brass adjuster.",
    details: [
      "100% Premium cotton chino twill",
      "3D raised high-density lightning bolt embroidery",
      "Curved visor with reinforced stitch lines",
      "Self-fabric strap with antique brass sliding buckle",
    ],
    fabricCare: ["Spot clean with mild damp cloth", "Do not machine wash or soak"],
    fit: "Adjustable 54cm - 62cm. Universal unisex fit.",
    rating: 4.9,
    reviewCount: 75,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-7",
    slug: "jackets-for-every-journey",
    title: "Architectural Windbreaker Jacket",
    price: 2299,
    originalPrice: 3499,
    image: "/images/nxtvie/promo-jackets-hd.jpg",
    images: [
      "/images/nxtvie/promo-jackets-hd.jpg",
      "/images/nxtvie/banner-urban-essentials-hd.jpg",
    ],
    category: "Jackets",
    collections: ["men", "clothing", "new-arrivals", "urban-essentials"],
    badge: "New",
    colors: [
      { name: "Stealth Black", hex: "#121110" },
      { name: "Slate Ash", hex: "#404040" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "A technical weather-resistant urban jacket engineered with matte Japanese memory nylon, waterproof two-way YKK zippers, storm-collar construction, and discreet sleeve stash pockets.",
    details: [
      "Water-repellent DWR matte technical nylon",
      "Custom two-way YKK metal zips",
      "Concealed zippered chest and inner passport pockets",
      "Elasticated storm cuffs and drawstring waist hem",
    ],
    fabricCare: [
      "100% Water-repellent Technical Nylon",
      "Wipe clean or gentle cold wash",
      "Hang to air dry",
    ],
    fit: "Modern architectural streetwear fit with room for mid-layering.",
    rating: 4.9,
    reviewCount: 54,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-8",
    slug: "asian-minimal-modern-hoodie",
    title: "Asian Minimal Modern Hoodie",
    price: 1599,
    originalPrice: 2499,
    image: "/images/nxtvie/promo-asian-minimal-hd.jpg",
    images: [
      "/images/nxtvie/promo-asian-minimal-hd.jpg",
      "/images/nxtvie/cat-hoodies.jpg",
      "/images/nxtvie/gallery-5.jpg",
    ],
    category: "Hoodies",
    collections: ["men", "clothing", "new-arrivals", "urban-essentials", "sale"],
    badge: "Trending",
    colors: [
      { name: "Acid Charcoal", hex: "#222120" },
      { name: "Dark Olive", hex: "#3B4035" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Infused with East Asian brutalist silhouette aesthetics, this oversized pullover hoodie offers exaggerated drop shoulders, an extended cuff ribbing, and subtle washed acid fade.",
    details: [
      "420 GSM custom loopback knit",
      "Subtle garment distress and mineral enzyme wash",
      "Elongated heavyweight flat drawstrings with metal aglets",
      "NXTIVE tonal silicone badge at lower hem",
    ],
    fabricCare: [
      "100% Enzyme Washed Cotton",
      "Cold gentle machine wash",
      "Do not dry clean",
    ],
    fit: "Oversized slouchy streetwear cut.",
    rating: 4.9,
    reviewCount: 68,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-9",
    slug: "back-graphic-mindset-tee",
    title: "Mindset Philosophy Graphic Tee",
    price: 999,
    originalPrice: 1499,
    image: "/images/nxtvie/story-back-print-hd.jpg",
    images: [
      "/images/nxtvie/story-back-print-hd.jpg",
      "/images/nxtvie/gallery-6.jpg",
      "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
    ],
    category: "T-Shirts",
    collections: ["men", "clothing", "new-arrivals", "collections"],
    badge: "New",
    colors: [
      { name: "Vintage Cream", hex: "#EBE6DC" },
      { name: "Washed Black", hex: "#1C1B1A" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "A tribute to the NXTIVE mindset. Features a massive silkscreen printed lightning graphic and bold brand insignia on the back, crafted on heavy 280 GSM off-white cotton.",
    details: [
      "280 GSM heavyweight organic cotton jersey",
      "High-density discharge silkscreen back print",
      "Minimalist front chest emblem",
      "Pre-washed to eliminate shrinkage",
    ],
    fabricCare: [
      "100% Combed Cotton",
      "Cold machine wash inside out",
      "Do not iron directly over prints",
    ],
    fit: "Relaxed Boxy Streetwear Fit.",
    rating: 5.0,
    reviewCount: 42,
    inStock: true,
  },
  {
    id: "prod-10",
    slug: "premium-folded-basics-pack",
    title: "Premium Basics 3-Pack Bundle",
    price: 1999,
    originalPrice: 2999,
    image: "/images/nxtvie/banner-premium-basics-stack-hd.jpg",
    images: [
      "/images/nxtvie/banner-premium-basics-stack-hd.jpg",
      "/images/nxtvie/product-oversized-tee-hd.jpg",
      "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
    ],
    category: "T-Shirts",
    collections: ["men", "clothing", "premium-basics", "sale"],
    badge: "Bestseller",
    colors: [
      { name: "Trio Pack (Black, Cream, Olive)", hex: "#222220" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Our most sought-after essentials bundled for everyday ease. Includes 3 heavyweight organic cotton tees in Pitch Black, Sand Beige, and Sage Olive.",
    details: [
      "Bundle of 3 signature 260 GSM t-shirts",
      "Save 25% compared to individual purchase",
      "Includes reusable NXTIVE canvas presentation dust bag",
      "Garment washed for supreme softness from day one",
    ],
    fabricCare: ["100% Organic Cotton", "Machine wash cold with like colors"],
    fit: "Relaxed regular fit. Sits effortlessly on the shoulder.",
    rating: 5.0,
    reviewCount: 195,
    inStock: true,
  },
  {
    id: "prod-11",
    slug: "urban-runner-relaxed-sweats",
    title: "Urban Runner Relaxed Sweatpants",
    price: 1299,
    originalPrice: 1799,
    image: "/images/explore-runner.jpg",
    images: [
      "/images/explore-runner.jpg",
      "/images/nxtvie/product-cargo-pants-hd.jpg",
    ],
    category: "Bottoms",
    collections: ["men", "clothing", "urban-essentials", "sale"],
    colors: [
      { name: "Heather Slate", hex: "#4A4D4E" },
      { name: "Deep Charcoal", hex: "#242322" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Ultra-dense 400 GSM brushed fleece track pants designed with clean concealed side pockets, rear patch pocket, and a clean wide leg profile with hidden hem pull-toggles.",
    details: [
      "400 GSM brushed cotton-fleece",
      "Wide relaxed leg profile with optional ankle drawcord",
      "Deep side slant pockets with concealed YKK zips",
      "Elasticated waistband with metal aglet cords",
    ],
    fabricCare: ["80% Cotton, 20% Polyester for durable bounce", "Machine wash cold"],
    fit: "Wide-leg relaxed sweatpants.",
    rating: 4.8,
    reviewCount: 39,
    inStock: true,
  },
  {
    id: "prod-12",
    slug: "raw-edge-box-tee",
    title: "Raw Edge Heavyweight Tee",
    price: 849,
    originalPrice: 1199,
    image: "/images/bestseller-buzzcut.jpg",
    images: [
      "/images/bestseller-buzzcut.jpg",
      "/images/nxtvie/gallery-1.jpg",
    ],
    category: "T-Shirts",
    collections: ["men", "clothing", "sale"],
    colors: [
      { name: "Washed Carbon", hex: "#2A2A2A" },
      { name: "Chalk Off-White", hex: "#ECE8DE" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Engineered with a raw-cut collar and sleeve hems that gently roll after wash. Cut in an exaggerated square boxy proportion inspired by 90s Tokyo street style.",
    details: [
      "300 GSM ultra-heavy single jersey",
      "Raw unfinished hemline that does not unravel",
      "Wide boxy body with high armholes",
    ],
    fabricCare: ["100% Combed Cotton", "Cold wash only", "Air dry flat"],
    fit: "Boxy Cropped Streetwear Fit.",
    rating: 4.7,
    reviewCount: 51,
    inStock: true,
  },
  {
    id: "prod-13",
    slug: "camp-collar-linen-shirt",
    title: "Camp Collar Linen Shirt",
    price: 1199,
    originalPrice: 1699,
    image: "/images/nxtvie/cat-shirts.jpg",
    images: [
      "/images/nxtvie/cat-shirts.jpg",
      "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
    ],
    category: "Shirts",
    collections: ["men", "clothing", "new-arrivals", "premium-basics"],
    badge: "New",
    colors: [
      { name: "Natural Ecru", hex: "#D7D0C5" },
      { name: "Moss Green", hex: "#596052" },
      { name: "Onyx Black", hex: "#181818" },
    ],
    sizes: ["M", "L", "XL"],
    description:
      "Tailored in a breezy linen-cotton blend with an open Cuban camp collar, tonal coconut buttons, and clean side vents.",
    details: [
      "Breathable 60% linen, 40% organic cotton",
      "Open camp collar design",
      "Single chest welt pocket",
      "Relaxed boxy silhouette",
    ],
    fabricCare: ["Machine wash cold delicate", "Hang dry in shade"],
    fit: "Relaxed Cuban fit",
    rating: 4.8,
    reviewCount: 37,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-14",
    slug: "specialized-technical-jacket",
    title: "Specialized Fabrics Technical Jacket",
    price: 2499,
    originalPrice: 3799,
    image: "/images/specialized_fabrics_banner_1790365689151.jpg",
    images: [
      "/images/specialized_fabrics_banner_1790365689151.jpg",
      "/images/nxtvie/promo-jackets-hd.jpg",
    ],
    category: "Jackets",
    collections: ["men", "clothing", "new-arrivals", "urban-essentials"],
    badge: "Bestseller",
    colors: [
      { name: "Stealth Charcoal", hex: "#222120" },
      { name: "Deep Olive", hex: "#3B4035" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "High-density weatherproof shell crafted with technical ripstop weave, sealed waterproof zips, and ergonomic storm hood.",
    details: [
      "Triple-layer water-resistant membrane",
      "YKK Aquaguard zips",
      "Underarm ventilation eyelets",
      "Internal device pocket",
    ],
    fabricCare: ["Wipe clean with damp cloth", "Do not iron"],
    fit: "Regular athletic shell fit",
    rating: 4.9,
    reviewCount: 62,
    inStock: true,
    featured: true,
  },
  {
    id: "prod-15",
    slug: "heavyweight-canvas-tote",
    title: "Heavyweight Canvas Crossbody Tote",
    price: 799,
    originalPrice: 1099,
    image: "/images/nxtvie/cat-accessories.jpg",
    images: [
      "/images/nxtvie/cat-accessories.jpg",
      "/images/nxtvie/product-cap-hd.jpg",
    ],
    category: "Accessories",
    collections: ["accessories", "new-arrivals"],
    badge: "New",
    colors: [
      { name: "Raw Off-White", hex: "#ECE6DB" },
      { name: "Pitch Black", hex: "#181818" },
    ],
    sizes: ["One Size"],
    description:
      "Substantial 16oz cotton canvas daily tote with reinforced shoulder strap, interior zip pouch, and minimalist screenprinted branding.",
    details: [
      "16oz heavy organic cotton canvas",
      "Reinforced box-x handle stitching",
      "Interior zippered key/phone pocket",
      "Removable adjustable crossbody strap",
    ],
    fabricCare: ["Spot clean only"],
    fit: "38cm x 42cm x 10cm",
    rating: 4.9,
    reviewCount: 44,
    inStock: true,
    featured: true,
  },
];

export const CATEGORIES_LIST = [
  {
    slug: "men",
    name: "Men",
    title: "Men's Collection",
    tagline: "Modern menswear inspired by Asian style and everyday comfort.",
    image: "/images/nxtvie/hero-model.jpg",
  },
  {
    slug: "new-arrivals",
    name: "New Arrivals",
    title: "New Releases",
    tagline: "Fresh silhouettes, limited drops, and seasonal colorways.",
    image: "/images/nxtvie/banner-urban-essentials-hd.jpg",
  },
  {
    slug: "clothing",
    name: "Clothing",
    title: "Apparel Collection",
    tagline: "Heavyweight tees, structured shirts, technical outerwear and pants.",
    image: "/images/nxtvie/promo-jackets-hd.jpg",
  },
  {
    slug: "accessories",
    name: "Accessories",
    title: "Accessories",
    tagline: "Structured dad caps, canvas bags, and elevated essentials.",
    image: "/images/nxtvie/product-cap-hd.jpg",
  },
  {
    slug: "collections",
    name: "Collections",
    title: "Curated Collections",
    tagline: "Explore Urban Essentials, Premium Basics, and Mindset Capsules.",
    image: "/images/nxtvie/banner-premium-basics-stack-hd.jpg",
  },
  {
    slug: "sale",
    name: "Sale",
    title: "Archive Sale",
    tagline: "Past season favorites and limited-run items at special prices.",
    image: "/images/nxtvie/promo-asian-minimal-hd.jpg",
  },
  {
    slug: "t-shirts",
    name: "T-Shirts",
    title: "Heavyweight T-Shirts",
    tagline: "Oversized, boxy, and minimal tees in 260-300 GSM organic cotton.",
    image: "/images/nxtvie/cat-tshirts.jpg",
  },
  {
    slug: "shirts",
    name: "Shirts",
    title: "Shirts & Overshirts",
    tagline: "Breathable linen-cotton camp shirts and workwear silhouettes.",
    image: "/images/nxtvie/cat-shirts.jpg",
  },
  {
    slug: "hoodies",
    name: "Hoodies",
    title: "French Terry Hoodies",
    tagline: "Substantial 450 GSM hoodies and pullovers with architectural drape.",
    image: "/images/nxtvie/cat-hoodies.jpg",
  },
  {
    slug: "bottoms",
    name: "Bottoms",
    title: "Pants & Cargos",
    tagline: "Articulated ripstop cargos, wide-leg trousers, and relaxed sweats.",
    image: "/images/nxtvie/cat-bottoms.jpg",
  },
  {
    slug: "jackets",
    name: "Jackets",
    title: "Technical Jackets",
    tagline: "Weather-resistant urban outerwear engineered for movement.",
    image: "/images/nxtvie/promo-jackets-hd.jpg",
  },
  {
    slug: "urban-essentials",
    name: "Urban Essentials",
    title: "Urban Essentials",
    tagline: "Clean fits designed for everyday movement and city living.",
    image: "/images/nxtvie/banner-urban-essentials-hd.jpg",
  },
  {
    slug: "premium-basics",
    name: "Premium Basics",
    title: "Premium Basics",
    tagline: "Timeless pieces. Better everyday.",
    image: "/images/nxtvie/banner-premium-basics-stack-hd.jpg",
  },
  {
    slug: "best-sellers",
    name: "Best Sellers",
    title: "Best Selling",
    tagline: "Most loved pieces by the NXTIVE community across India.",
    image: "/images/nxtvie/hero-model.jpg",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  const normalized = slug.toLowerCase();
  if (normalized === "all" || normalized === "shop") return MOCK_PRODUCTS;

  return MOCK_PRODUCTS.filter(
    (p) =>
      p.category.toLowerCase() === normalized ||
      p.category.toLowerCase().replace(/\s+/g, "-") === normalized ||
      p.collections.includes(normalized)
  );
}

export function getRelatedProducts(productId: string, limit = 4): Product[] {
  const current = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (!current) return MOCK_PRODUCTS.slice(0, limit);

  return MOCK_PRODUCTS.filter((p) => p.id !== productId && p.category === current.category)
    .concat(MOCK_PRODUCTS.filter((p) => p.id !== productId && p.category !== current.category))
    .slice(0, limit);
}
