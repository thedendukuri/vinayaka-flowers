import { Flower } from "@/types/flower";
import { SITE_URL, BUSINESS, SEO_DEFAULTS } from "@/constants/business";

/**
 * Generate WebSite schema with optional SearchAction
 */
export const generateWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  name: BUSINESS.name,
  url: SITE_URL,
  description: SEO_DEFAULTS.homeDescription,
  publisher: {
    "@id": `${SITE_URL}#organization`,
  },
});

/**
 * Generate Organization schema
 */
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}#organization`,
  name: BUSINESS.name,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  image: `${SITE_URL}${SEO_DEFAULTS.ogImage}`,
  description: BUSINESS.description,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  address: {
    "@type": "PostalAddress",
    ...BUSINESS.address,
  },
  sameAs: BUSINESS.sameAs,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: BUSINESS.phone,
    contactType: "Customer Service",
    areaServed: "US",
    availableLanguage: BUSINESS.languages,
  },
});

/**
 * Generate LocalBusiness schema with strong GEO signals
 * Only includes geo if coordinates are verified in constants
 */
export const generateLocalBusinessSchema = () => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}#localbusiness`,
    name: BUSINESS.name,
    image: `${SITE_URL}${SEO_DEFAULTS.ogImage}`,
    logo: `${SITE_URL}/favicon.png`,
    description: BUSINESS.description,
    url: SITE_URL,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: BUSINESS.currenciesAccepted,
    paymentAccepted: BUSINESS.paymentAccepted.join(", "),
    address: {
      "@type": "PostalAddress",
      ...BUSINESS.address,
    },
    areaServed: BUSINESS.areasServed.map((area) => ({
      "@type": "Place",
      name: area,
    })),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: BUSINESS.hours.days,
      opens: BUSINESS.hours.opens,
      closes: BUSINESS.hours.closes,
    },
    sameAs: BUSINESS.sameAs,
    keywords: BUSINESS.keywords.join(", "),
  };

  // Only include geo if coordinates are verified (non-zero, valid values)
  if (
    BUSINESS.geo?.latitude &&
    BUSINESS.geo?.longitude &&
    typeof BUSINESS.geo.latitude === "number" &&
    typeof BUSINESS.geo.longitude === "number"
  ) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    };
  }

  return schema;
};

/**
 * Generate Product schema for individual products
 * Never outputs hash URLs - uses homepage canonical if no real product route exists
 */
export const generateProductSchema = (flower: Flower, canonicalUrl?: string) => {
  // Determine the offer URL - never use hash fragments
  let offerUrl: string | undefined;
  
  if (canonicalUrl && !canonicalUrl.includes("#")) {
    // Use provided canonical if it's a real URL (no hash)
    offerUrl = canonicalUrl;
  }
  // If no valid canonical, omit offers.url entirely (preferred over hash URLs)

  const offers: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: BUSINESS.currenciesAccepted,
    price: flower.price.toFixed(2),
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: BUSINESS.name,
    },
  };

  // Only add URL if we have a valid non-hash URL
  if (offerUrl) {
    offers.url = offerUrl;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: flower.name,
    description: flower.description,
    image: flower.image.startsWith("http") ? flower.image : `${SITE_URL}${flower.image}`,
    sku: flower.id,
    brand: {
      "@type": "Brand",
      name: BUSINESS.name,
    },
    category: flower.category,
    offers,
  };
};

/**
 * Generate BreadcrumbList schema
 */
export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
  })),
});

/**
 * Generate ItemList schema for product collections
 * Uses homepage as canonical since products don't have individual routes
 */
export const generateProductListSchema = (flowers: Flower[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: flowers.map((flower, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: generateProductSchema(flower, SITE_URL),
  })),
});

/**
 * Generate FAQPage schema (only if FAQs exist)
 */
export const generateFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

/**
 * Generate Festival/Event schema for seasonal SEO
 * Non-UI, metadata-only enhancement for festival discoverability
 */
export const generateFestivalEventSchema = () => {
  // Current year for dynamic date generation
  const currentYear = new Date().getFullYear();
  
  // Sankranthi/Pongal typically falls on January 14-17
  const sankranthiDate = `${currentYear}-01-14`;
  const pongalEndDate = `${currentYear}-01-17`;
  
  return [
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "@id": `${SITE_URL}#sankranthi-event`,
      name: "Makar Sankranthi & Pongal Festival Flowers",
      description: "Fresh pooja flowers, garlands, and sacred leaves for Makar Sankranthi, Bhogi, Thai Pongal, and Ratha Saptami celebrations. Traditional arka patram, jilledu leaves, jasmine garlands, and lotus flowers available.",
      startDate: sankranthiDate,
      endDate: pongalEndDate,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: BUSINESS.name,
        address: {
          "@type": "PostalAddress",
          ...BUSINESS.address,
        },
      },
      organizer: {
        "@type": "Organization",
        name: BUSINESS.name,
        url: SITE_URL,
      },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "0",
        highPrice: "50",
        availability: "https://schema.org/InStock",
        url: SITE_URL,
        validFrom: `${currentYear}-01-01`,
      },
      keywords: "Sankranthi flowers, Pongal flowers, Makar Sankranti, Thai Pongal, Bhogi, harvest festival, Indian traditional flowers, arka patram, jilledu leaves",
    },
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "@id": `${SITE_URL}#ratha-saptami-event`,
      name: "Ratha Saptami Pooja Flowers & Sacred Leaves",
      description: "Sacred jilledu (arka) leaves and fresh flowers for Ratha Saptami Surya Puja. Traditional giant milkweed leaves for sun worship rituals.",
      startDate: `${currentYear}-02-05`,
      endDate: `${currentYear}-02-05`,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: BUSINESS.name,
        address: {
          "@type": "PostalAddress",
          ...BUSINESS.address,
        },
      },
      organizer: {
        "@type": "Organization",
        name: BUSINESS.name,
        url: SITE_URL,
      },
      keywords: "Ratha Saptami, Surya Puja, jilledu leaves, arka patram, giant milkweed, sun worship, Hindu festival",
    },
  ];
};

/**
 * Generate enhanced LocalBusiness schema with seasonal offerings
 * Additive enhancement - does not replace base LocalBusiness schema
 */
export const generateSeasonalOfferSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Offer",
  "@id": `${SITE_URL}#seasonal-offer`,
  name: "Sankranthi & Pongal Festival Flowers",
  description: "Fresh pooja flowers and traditional leaves for Makar Sankranthi, Pongal, and Ratha Saptami celebrations. Free jilledu leaves with orders $30+.",
  priceCurrency: "USD",
  availability: "https://schema.org/InStock",
  seller: {
    "@type": "Organization",
    name: BUSINESS.name,
    url: SITE_URL,
  },
  areaServed: BUSINESS.areasServed.map((area) => ({
    "@type": "Place",
    name: area,
  })),
  category: "Pooja Flowers & Festival Essentials",
});

/**
 * Generate OfferShippingDetails schema for nationwide shipping SEO
 * Helps search engines understand shipping capabilities
 */
export const generateShippingSchema = () => ({
  "@context": "https://schema.org",
  "@type": "OfferShippingDetails",
  "@id": `${SITE_URL}#shipping`,
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: "US",
    addressRegion: BUSINESS.areasServed.filter(area => 
      !area.includes("MA") && !area.includes("Boston")
    ),
  },
  shippingRate: {
    "@type": "MonetaryAmount",
    currency: "USD",
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: {
      "@type": "QuantitativeValue",
      minValue: 7,
      maxValue: 10,
      unitCode: "DAY",
    },
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: 2,
      maxValue: 5,
      unitCode: "DAY",
    },
  },
});

/**
 * Generate OnlineStore schema for eCommerce SEO
 */
export const generateOnlineStoreSchema = () => ({
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${SITE_URL}#onlinestore`,
  name: BUSINESS.name,
  url: SITE_URL,
  description: "Order fresh pooja flowers online with nationwide shipping across USA. Jasmine garlands, marigold, lotus, mullai strings & traditional Hindu festival flowers.",
  image: `${SITE_URL}${SEO_DEFAULTS.ogImage}`,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  address: {
    "@type": "PostalAddress",
    ...BUSINESS.address,
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  availableLanguage: BUSINESS.languages,
  currenciesAccepted: BUSINESS.currenciesAccepted,
  paymentAccepted: BUSINESS.paymentAccepted.join(", "),
  priceRange: BUSINESS.priceRange,
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Fresh Pooja Flowers & Garlands",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Jasmine & Mullai",
      },
      {
        "@type": "OfferCatalog",
        name: "Garlands & Malas",
      },
      {
        "@type": "OfferCatalog",
        name: "Loose Flowers",
      },
      {
        "@type": "OfferCatalog",
        name: "Sacred Leaves",
      },
    ],
  },
});