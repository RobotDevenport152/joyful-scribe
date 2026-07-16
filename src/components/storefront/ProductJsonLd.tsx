interface Props {
  product: {
    nameEn: string;
    descEn: string;
    images: string[];
    stock: number;
    slug: string;
    prices: { NZD: number };
  };
}

export function ProductJsonLd({ product }: Props) {
  // Google Rich Results requires absolute image URLs — the app stores
  // relative paths (e.g. "/images/...") for locally-hosted product photos.
  const absoluteImages = product.images.map(url =>
    url.startsWith('http') ? url : `https://pacificalpaca.com${url}`
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameEn,
    description: product.descEn || '',
    image: absoluteImages,
    brand: { "@type": "Brand", name: "Pacific Alpaca" },
    offers: {
      "@type": "Offer",
      price: product.prices.NZD.toString(),
      priceCurrency: "NZD",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Pacific Alpaca" },
      url: `https://pacificalpaca.com/product/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
