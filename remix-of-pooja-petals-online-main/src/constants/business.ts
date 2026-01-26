/**
 * Centralized NAP (Name, Address, Phone) data for SEO consistency
 * All structured data and SEO components should reference these values
 */

export const SITE_URL = "https://indianpoojaflowers.com";

export const BUSINESS = {
  name: "Indian Pooja Flowers",
  legalName: "Indian Pooja Flowers",
  description: "Fresh Indian pooja flowers for Sankranthi, Pongal, and traditional Hindu festivals. Specializing in jasmine garlands, mullai strings, lotus, marigold, button roses, and sacred leaves for Makar Sankranti, Bhogi, Thai Pongal, Ratha Saptami, Vinayaka Chaturthi, Diwali, Navratri, Varalakshmi Vratham, weddings, housewarming, and temple offerings.",
  
  // Contact
  phone: "+1-978-431-0978",
  phoneDisplay: "(978) 431-0978",
  email: "contact@indianpoojaflowers.com",
  whatsappGroup: "https://chat.whatsapp.com/Ibbw2bjmuBiIUfwJUpIGj0",
  
  // Address (New England Siva Temple)
  address: {
    streetAddress: "255 Great Rd",
    addressLocality: "Littleton",
    addressRegion: "MA",
    postalCode: "01460",
    addressCountry: "US",
  },
  
  // Formatted address for display
  addressDisplay: "255 Great Rd, Littleton, MA 01460",
  
  // Geo coordinates (New England Siva Temple)
  geo: {
    latitude: 42.5334,
    longitude: -71.4895,
  },
  
  // GEO meta tags
  geoRegion: "US-MA",
  geoPlacename: "Littleton",
  
  // Operating hours
  hours: {
    opens: "10:00",
    closes: "20:30",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
  
  // Social profiles (only include verified existing ones)
  sameAs: [
    "https://www.instagram.com/poojaflowers_2022/",
  ],
  
  // Areas served - Nationwide shipping
  areasServed: [
    "United States",
    "New York",
    "New Jersey",
    "California",
    "Texas",
    "Illinois",
    "Pennsylvania",
    "Florida",
    "Georgia",
    "Ohio",
    "Michigan",
    "North Carolina",
    "Virginia",
    "Maryland",
    "Massachusetts",
    "Connecticut",
    "Washington",
    "Arizona",
    "Colorado",
    "Greater Boston",
    "Littleton MA",
  ],
  
  // Shipping info
  shippingInfo: {
    nationwide: true,
    advanceNotice: "7-10 days",
    pickupLocation: "New England Siva Temple, Littleton MA",
  },
  
  // SEO Keywords - Enhanced for nationwide shipping
  keywords: [
    "pooja flowers",
    "temple flowers",
    "jasmine flowers",
    "jasmine garland",
    "mullai string",
    "garlands",
    "bilva leaves",
    "betel leaves",
    "lotus flowers",
    "marigold",
    // Nationwide shipping keywords
    "pooja flowers online USA",
    "buy pooja flowers online",
    "Indian flowers delivery USA",
    "pooja flowers shipped nationwide",
    "order temple flowers online",
    "fresh pooja flowers delivery",
    "Hindu temple flowers USA",
    "Indian puja flowers online",
    "pooja flowers home delivery",
    "buy jasmine garland online",
    "order marigold garland USA",
    "fresh flower delivery for pooja",
    "Vinayaka pooja",
    // Sankranthi / Pongal / Harvest festivals
    "Sankranthi flowers",
    "Sankranti pooja flowers",
    "Makar Sankranti flowers",
    "Pongal flowers",
    "Thai Pongal flowers",
    "Bhogi festival flowers",
    "Ratha Saptami flowers",
    "harvest festival flowers",
    "Indian harvest festival",
    "Sankranthi celebration",
    "Pongal celebration flowers",
    "traditional Pongal flowers",
    "Sankranti garlands",
    "Pongal pooja items",
    "arka patram",
    "jilledu leaves",
    "giant milkweed leaves",
    "Surya Puja flowers",
    "Sun worship flowers",
    // Hindu ceremonies & festivals
    "Hindu wedding flowers",
    "Indian wedding garlands",
    "Vivah ceremony flowers",
    "Saptapadi garlands",
    "Jaimala garlands",
    "Varmala wedding",
    "Mandap decoration flowers",
    "Mehndi ceremony flowers",
    "Sangeet flowers",
    "Haldi ceremony flowers",
    // Major Hindu festivals
    "Diwali pooja flowers",
    "Navratri flowers",
    "Durga Puja flowers",
    "Ganesh Chaturthi flowers",
    "Vinayaka Chaturthi",
    "Varalakshmi Vratham flowers",
    "Satyanarayana Puja flowers",
    "Lakshmi Puja flowers",
    "Pongal flowers",
    "Onam flowers",
    "Ugadi flowers",
    "Vishu flowers",
    "Makar Sankranti flowers",
    "Holi celebration flowers",
    "Janmashtami flowers",
    "Krishna Jayanthi flowers",
    "Rama Navami flowers",
    "Hanuman Jayanti flowers",
    "Maha Shivaratri flowers",
    // Religious ceremonies
    "Griha Pravesh flowers",
    "housewarming ceremony flowers",
    "Satyanarayan Katha flowers",
    "Navagraha Puja flowers",
    "Rudrabhishekam flowers",
    "Abhishekam flowers",
    "Homam ceremony flowers",
    "Havan flowers",
    "Yagna ceremony flowers",
    // Life events
    "Namkaran ceremony flowers",
    "baby naming ceremony flowers",
    "Annaprashan flowers",
    "first rice ceremony flowers",
    "Upanayanam flowers",
    "thread ceremony flowers",
    "Mundan ceremony flowers",
    "Aksharabhyasam flowers",
    "Vidyarambham flowers",
    "engagement ceremony flowers",
    "Roka ceremony flowers",
    "Tilak ceremony flowers",
    "Shraddha ceremony flowers",
    "Pitru Paksha flowers",
    // Temple & daily worship
    "daily pooja flowers",
    "temple archana flowers",
    "Deeparadhana flowers",
    "Aarti flowers",
    "Bhajan flowers",
    "Satsang decoration flowers",
    // Regional terms
    "Tamil wedding flowers",
    "Telugu wedding flowers",
    "Kannada wedding flowers",
    "Malayalam wedding flowers",
    "Gujarati wedding flowers",
    "Marathi wedding flowers",
    "Bengali wedding flowers",
    "Punjabi wedding flowers",
    "North Indian wedding flowers",
    "South Indian wedding flowers",
  ],
  
  priceRange: "$$",
  currenciesAccepted: "USD",
  paymentAccepted: ["Cash", "Credit Card"],
  languages: ["English", "Hindi", "Tamil"],
} as const;

// Default SEO values
export const SEO_DEFAULTS = {
  siteName: "Indian Pooja Flowers",
  titleSuffix: " | Indian Pooja Flowers",
  
  // Homepage - Enhanced for nationwide shipping
  homeTitle: "Indian Pooja Flowers – Fresh Pooja Flowers & Garlands | Nationwide Shipping USA",
  homeDescription: "Order fresh pooja flowers online with nationwide shipping across USA. Jasmine garlands, marigold, lotus, mullai strings & traditional festival flowers. 7-10 days advance notice. Temple pickup in Littleton MA also available.",
  
  // Product pattern - Enhanced with shipping context
  productTitlePattern: (name: string) => `${name} – Fresh Pooja Flowers | Buy Online, Ship Nationwide`,
  productDescriptionPattern: (name: string) => `Buy fresh ${name} online for Hindu festivals, weddings, temple offerings & daily pooja. Ships across USA. Order from Indian Pooja Flowers.`,
  
  // Default OG image
  ogImage: "/og-image.png",
  
  // Twitter handle (if exists)
  twitterHandle: undefined,
  
  // Seasonal/Festival SEO enhancements (non-UI, metadata only)
  seasonalKeywords: [
    "Sankranthi flowers near me",
    "Pongal pooja flowers",
    "Makar Sankranti garlands",
    "Thai Pongal flowers",
    "Bhogi festival flowers",
    "Ratha Saptami pooja",
    "Indian harvest festival flowers",
    "traditional pooja flowers",
  ],
} as const;

// Robots meta rules by page type
export const ROBOTS_RULES = {
  index: "index, follow",
  noindex: "noindex, follow",
  nofollow: "noindex, nofollow",
} as const;

// Pages that should NOT be indexed
export const NOINDEX_PATHS = [
  "/cart",
  "/checkout", 
  "/confirmation",
  "/my-account",
  "/login",
  "/register",
  "/search",
] as const;
