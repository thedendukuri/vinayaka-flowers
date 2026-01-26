import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flower } from "@/types/flower";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Gift } from "lucide-react";

interface FlowerCardProps {
  flower: Flower;
}

export const FlowerCard = ({ flower }: FlowerCardProps) => {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const cartItem = cartItems.find((item) => item.id === flower.id);
  const quantity = cartItem?.quantity || 0;
  
  const isFreeWithOrder = flower.price === 0 && !flower.preOrder;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
      {/* Free with $30+ badge */}
      {isFreeWithOrder && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg flex items-center gap-1 px-2 py-1">
            <Gift className="w-3 h-3" />
            <span className="text-xs font-semibold">FREE with $30+</span>
          </Badge>
        </div>
      )}
      
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={flower.image}
          alt={`Buy fresh ${flower.name.toLowerCase()} for pooja - Temple flower delivery Littleton MA, New England Siva Temple`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
          width="400"
          height="400"
        />
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-card-foreground">{flower.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{flower.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {flower.preOrder ? (
              <>
                <p className="text-sm font-medium text-primary">Contact for pricing</p>
                <p className="text-xs text-muted-foreground">{flower.unit}</p>
              </>
            ) : isFreeWithOrder ? (
              <>
                <p className="text-xl font-bold text-green-600">FREE</p>
                <p className="text-xs text-muted-foreground">{flower.unit}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-primary">${flower.price}</p>
                <p className="text-xs text-muted-foreground">{flower.unit}</p>
              </>
            )}
          </div>

          {flower.preOrder ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open('https://wa.me/19788068797?text=I%20am%20interested%20in%20pre-ordering%20' + encodeURIComponent(flower.name), '_blank')}
            >
              Pre-order
            </Button>
          ) : quantity === 0 ? (
            <Button onClick={() => addToCart(flower)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => updateQuantity(flower.id, quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-foreground w-8 text-center">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => updateQuantity(flower.id, quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
