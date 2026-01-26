import { Helmet } from "react-helmet-async";
import { SITE_URL, BUSINESS, SEO_DEFAULTS, ROBOTS_RULES, NOINDEX_PATHS } from "@/constants/business";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  structuredData?: object[];
  keywords?: string;
}

/**
 * Reusable SEO component with tag deduping via react-helmet-async
 * Handles: title, meta description, canonical, robots, OG/Twitter, JSON-LD
 */
export const SEO = ({
  title,
  description = SEO_DEFAULTS.homeDescription,
  canonical,
  ogImage = SEO_DEFAULTS.ogImage,
  ogType = "website",
  noindex,
  structuredData = [],
  keywords,
}: SEOProps) => {
  // Build full title with suffix
  const fullTitle = title 
    ? (title.includes("Indian Pooja Flowers") ? title : `${title}${SEO_DEFAULTS.titleSuffix}`)
    : SEO_DEFAULTS.homeTitle;
  
  // Build canonical URL (always absolute)
  const canonicalPath = canonical || "/";
  const fullCanonical = canonicalPath.startsWith("http") 
    ? canonicalPath 
    : `${SITE_URL}${canonicalPath === "/" ? "" : canonicalPath}`;
  
  // Build OG image URL (always absolute)
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;
  
  // Determine robots meta based on path or explicit noindex prop
  const shouldNoindex = noindex || NOINDEX_PATHS.some(path => canonicalPath.startsWith(path));
  const robotsContent = shouldNoindex ? ROBOTS_RULES.noindex : ROBOTS_RULES.index;
  
  // Default keywords from business constants
  const metaKeywords = keywords || BUSINESS.keywords.join(", ");

  return (
    <Helmet>
      {/* Primary Meta Tags - Helmet dedupes by key automatically */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Robots Meta - Always set explicitly */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SEO_DEFAULTS.siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Additional SEO Meta */}
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={BUSINESS.name} />
      
      {/* GEO Meta Tags for Local SEO */}
      <meta name="geo.region" content={BUSINESS.geoRegion} />
      <meta name="geo.placename" content={BUSINESS.geoPlacename} />
      <meta name="geo.position" content={`${BUSINESS.geo.latitude};${BUSINESS.geo.longitude}`} />
      <meta name="ICBM" content={`${BUSINESS.geo.latitude}, ${BUSINESS.geo.longitude}`} />
      
      {/* Structured Data - Each with unique key to prevent duplicates */}
      {structuredData.map((data, index) => (
        <script key={`ld-json-${index}`} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};
