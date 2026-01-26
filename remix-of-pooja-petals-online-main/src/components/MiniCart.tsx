import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MiniCart = () => {
  const { getCartItemCount, getCartTotal } = useCart();
  const navigate = useNavigate();
  const itemCount = getCartItemCount();
  const total = getCartTotal();

  if (itemCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-lg md:hidden">
        <Button
          onClick={() => navigate("/cart")}
          className="w-full flex items-center justify-between text-lg py-6"
          size="lg"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
          </div>
          <span className="font-bold">${total}</span>
        </Button>
      </div>

      {/* Desktop Sidebar Cart */}
      <div className="hidden md:block fixed right-4 top-1/2 -translate-y-1/2 z-50">
        <Button
          onClick={() => navigate("/cart")}
          className="flex flex-col items-center gap-2 px-6 py-4 h-auto"
          size="lg"
        >
          <ShoppingBag className="w-6 h-6" />
          <div className="text-center">
            <div className="text-sm font-semibold">{itemCount} items</div>
            <div className="text-lg font-bold">${total}</div>
          </div>
        </Button>
      </div>
    </>
  );
};
