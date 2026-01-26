import { Button } from "@/components/ui/button";
import { Flower2, ShoppingBag, Sparkles, Truck, Package } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Import carousel images
import bhogiSankranthiImg from "@/assets/bhogi-sankranthi-2026.jpg";
import rathaSaptamiImg from "@/assets/ratha-saptami-2026.jpg";
import garlandsPromoImg from "@/assets/garlands-promo-2026.png";

const carouselImages = [
  bhogiSankranthiImg,
  rathaSaptamiImg,
  garlandsPromoImg,
];

interface HeroProps {
  onStartOrdering: () => void;
}

export const Hero = ({ onStartOrdering }: HeroProps) => {
  return (
    <section 
      className="py-12 px-4"
      aria-label="Welcome to Indian Pooja Flowers - Beautiful Garland Collection"
    >
      <div className="container">
        {/* Header Content */}
        <header className="max-w-3xl mx-auto space-y-4 text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Vinayaka Pooja Flowers
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            New England Siva Temple • 255 Great Rd, Littleton, MA
          </p>

          {/* Enhanced Shipping Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border border-primary/30 rounded-xl p-4 max-w-2xl mx-auto shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                <Truck className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  We ship to most U.S. states!
                  <Package className="w-4 h-4 text-primary" />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  7-10 days advance notice required • Shipping charges apply
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onStartOrdering}
            size="lg"
            className="text-lg px-8 py-6 mt-6 shadow-lg"
            aria-label="Start ordering fresh pooja flowers"
          >
            <ShoppingBag className="mr-2 h-5 w-5" aria-hidden="true" />
            Start Ordering
          </Button>
        </header>

        {/* Garland Carousel */}
        <div className="max-w-4xl mx-auto mb-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {carouselImages.map((image, index) => (
                <CarouselItem key={index} className="pl-0 basis-full">
                  <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-xl overflow-hidden">
                    <img 
                      src={image}
                      alt={`Beautiful garland design ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-background/80 hover:bg-background border-border" />
            <CarouselNext className="right-4 bg-background/80 hover:bg-background border-border" />
          </Carousel>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <article className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" aria-hidden="true" />
            <h3 className="font-semibold text-card-foreground mb-2 text-center">Fresh Every Day</h3>
            <p className="text-sm text-muted-foreground text-center">Sourced daily from trusted suppliers</p>
          </article>
          
          <article className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <Flower2 className="w-8 h-8 text-secondary mx-auto mb-3" aria-hidden="true" />
            <h3 className="font-semibold text-card-foreground mb-2 text-center">Perfect for Pooja</h3>
            <p className="text-sm text-muted-foreground text-center">Ideal for daily rituals & special occasions</p>
          </article>
          
          <article className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <ShoppingBag className="w-8 h-8 text-accent mx-auto mb-3" aria-hidden="true" />
            <h3 className="font-semibold text-card-foreground mb-2 text-center">Simple Checkout</h3>
            <p className="text-sm text-muted-foreground text-center">Easy 3-step ordering process</p>
          </article>
        </div>
      </div>
    </section>
  );
};
