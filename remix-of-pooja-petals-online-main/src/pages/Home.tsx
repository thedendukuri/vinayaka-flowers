import { useState, useRef } from "react";
import { SEO } from "@/components/SEO";
import { Hero } from "@/components/Hero";
import { FlowerCard } from "@/components/FlowerCard";
import { MiniCart } from "@/components/MiniCart";
import { flowers, categories, garlandNote } from "@/data/flowers";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Info } from "lucide-react";
import { SEO_DEFAULTS } from "@/constants/business";
import {
  generateWebSiteSchema,
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateFestivalEventSchema,
  generateSeasonalOfferSchema,
  generateShippingSchema,
  generateOnlineStoreSchema,
} from "@/utils/seo";

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const menuRef = useRef<HTMLDivElement>(null);

  const handleStartOrdering = () => {
    menuRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredFlowers =
    selectedCategory === "All"
      ? flowers
      : flowers.filter((flower) => flower.category === selectedCategory);

  // Generate comprehensive structured data for homepage
  // Including festival event schemas for Sankranthi/Pongal seasonal SEO
  const structuredData = [
    generateWebSiteSchema(),
    generateOrganizationSchema(),
    generateLocalBusinessSchema(),
    generateOnlineStoreSchema(),
    generateShippingSchema(),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
    ]),
    // Seasonal festival event schemas (non-UI, SEO only)
    ...generateFestivalEventSchema(),
    generateSeasonalOfferSchema(),
    // Include product schemas for all flowers
    ...flowers.slice(0, 20).map((flower) => generateProductSchema(flower)),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={SEO_DEFAULTS.homeTitle}
        description={SEO_DEFAULTS.homeDescription}
        canonical="/"
        structuredData={structuredData}
      />
      <Header />
      <Hero onStartOrdering={handleStartOrdering} />

      {/* Flower Menu Section */}
      <section ref={menuRef} className="py-12 px-4" id="flowers" aria-label="Flower catalog">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Browse Our Fresh Pooja Flowers
          </h2>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Garland Note - shown when Garlands category is selected */}
          {selectedCategory === "Garlands" && (
            <div className="flex items-start gap-3 p-4 mb-6 bg-primary/10 border border-primary/20 rounded-lg">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80">{garlandNote}</p>
            </div>
          )}

          {/* Flower Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 md:pb-8">
            {filteredFlowers.map((flower) => (
              <FlowerCard key={flower.id} flower={flower} />
            ))}
          </div>
        </div>
      </section>

      <MiniCart />
      <Footer />
    </div>
  );
};

export default Home;
