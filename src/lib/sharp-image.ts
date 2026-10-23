const SHARP_IMAGE_SOURCES: Record<string, string> = {
  "/images/nxtvie/cat-tshirts.jpg": "/images/nxtvie/product-oversized-tee-hd.jpg",
  "/images/nxtvie/cat-shirts.jpg": "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
  "/images/nxtvie/cat-hoodies.jpg": "/images/nxtvie/product-core-hoodie-hd.jpg",
  "/images/nxtvie/cat-bottoms.jpg": "/images/nxtvie/product-cargo-pants-hd.jpg",
  "/images/nxtvie/cat-accessories.jpg": "/images/nxtvie/product-cap-hd.jpg",
  "/images/nxtvie/product-oversized-tee.jpg": "/images/nxtvie/product-oversized-tee-hd.jpg",
  "/images/nxtvie/product-minimal-logo-tee.jpg": "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
  "/images/nxtvie/product-relaxed-fit-shirt.jpg": "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
  "/images/nxtvie/product-core-hoodie.jpg": "/images/nxtvie/product-core-hoodie-hd.jpg",
  "/images/nxtvie/product-cargo-pants.jpg": "/images/nxtvie/product-cargo-pants-hd.jpg",
  "/images/nxtvie/product-cap.jpg": "/images/nxtvie/product-cap-hd.jpg",
  "/images/nxtvie/gallery-1.jpg": "/images/nxtvie/hero-model.jpg",
  "/images/nxtvie/gallery-2.jpg": "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
  "/images/nxtvie/gallery-3.jpg": "/images/nxtvie/product-cap-hd.jpg",
  "/images/nxtvie/gallery-4.jpg": "/images/nxtvie/product-cargo-pants-hd.jpg",
  "/images/nxtvie/gallery-5.jpg": "/images/nxtvie/product-core-hoodie-hd.jpg",
  "/images/nxtvie/gallery-6.jpg": "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
  "/images/nxtvie/gallery-7.jpg": "/images/nxtvie/product-oversized-tee-hd.jpg",
  "/images/nxtvie/banner-urban-essentials.jpg": "/images/nxtvie/banner-urban-essentials-hd.jpg",
  "/images/nxtvie/banner-premium-basics-stack.jpg": "/images/nxtvie/banner-premium-basics-stack-hd.jpg",
  "/images/nxtvie/promo-jackets.jpg": "/images/nxtvie/promo-jackets-hd.jpg",
  "/images/nxtvie/promo-asian-minimal.jpg": "/images/nxtvie/promo-asian-minimal-hd.jpg",
  "/images/nxtvie/story-back-print.jpg": "/images/nxtvie/story-back-print-nxtive.jpg?v=20261023",
  "/images/nxtvie/story-back-print-hd.jpg": "/images/nxtvie/story-back-print-nxtive.jpg?v=20261023",
  "/images/cinematic/banner-urban-movement.jpg": "/images/cinematic/banner-urban-movement-nxtive.jpg?v=20261023",
  "/images/nxtvie/hero-model-crop.jpg": "/images/nxtvie/hero-model.jpg",
};

export function sharpImageSrc(src?: string | null): string {
  if (!src) return "";
  const path = src.split("?")[0];
  return SHARP_IMAGE_SOURCES[path] || src;
}
