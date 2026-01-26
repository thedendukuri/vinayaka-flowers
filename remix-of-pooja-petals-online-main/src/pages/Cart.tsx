import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateBreadcrumbSchema } from "@/utils/seo";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const [specialNote, setSpecialNote] = useState("");
  const navigate = useNavigate();

  // Cart page is NOINDEX - handled automatically by SEO component via NOINDEX_PATHS
  const structuredData = [
    generateBreadcrumbSchema([
      { name: "Home", url: "/" }, 
      { name: "Cart", url: "/cart" }
    ])
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Your Cart"
          description="Review your selected fresh pooja flowers before checkout. Add more flowers or proceed to pickup details."
          canonical="/cart"
          noindex={true}
          structuredData={structuredData}
        />
        <Header />
        <div className="container px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <ShoppingBag className="w-20 h-20 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">Add some beautiful flowers to get started</p>
            <Button onClick={() => navigate("/")} size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Flowers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Shopping Cart"
        description="Review your selected Vinayaka pooja flowers and Hindu temple offerings. Proceed to checkout for pickup at New England Siva Temple, Littleton MA."
        canonical="/cart"
        noindex={true}
        structuredData={structuredData}
      />
      <Header />
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Flowers
          </Button>

          <h1 className="text-3xl font-bold mb-8">Review Your Order</h1>

          <div className="space-y-4 mb-8">
            {cartItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.image}
                      alt={`${item.name} fresh pooja flowers for temple worship - Littleton MA`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-card-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.unit}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-lg font-bold text-primary">${item.price * item.quantity}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Special Note */}
          <Card className="p-4 mb-8">
            <label className="block text-sm font-medium mb-2">
              Add a special note for your pooja (optional)
            </label>
            <Textarea
              placeholder="Any special requirements or preferences..."
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </Card>

          {/* Summary */}
          <Card className="p-6 sticky bottom-0 bg-card">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${getCartTotal()}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold">
                <span>Total</span>
                <span className="text-primary">${getCartTotal()}</span>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full text-lg"
              onClick={() => navigate("/checkout", { state: { specialNote } })}
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
