import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MapPin, Truck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.orderData;

  if (!orderData) {
    navigate("/");
    return null;
  }

  const isShipping = orderData.deliveryMethod === "shipping";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Order Confirmed"
        description="Your pooja flower order is confirmed. We'll send email confirmation for your temple flower order."
        canonical="/confirmation"
        noindex={true}
      />
      <Header />
      <div className="container px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <CheckCircle2 className="w-20 h-20 text-accent mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Thank You!</h1>
            <p className="text-lg text-muted-foreground">
              Your pooja flower order has been received
            </p>
          </div>

          <Card className="p-6 text-left space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{orderData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile:</span>
                  <span className="font-medium">{orderData.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{orderData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isShipping ? "Expected Delivery:" : "Pooja Date:"}
                  </span>
                  <span className="font-medium">{format(orderData.poojaDate, "PPP")}</span>
                </div>
                {!isShipping && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium capitalize">{orderData.preferredTime}</span>
                  </div>
                )}
                
                {/* Delivery Method Section */}
                <div className="pt-2 border-t">
                  {isShipping ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-5 h-5 text-primary" />
                        <span className="font-medium">Ship to Me</span>
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <div className="font-medium text-foreground mb-1">Shipping Address:</div>
                        <div>{orderData.shippingAddress?.street}</div>
                        {orderData.shippingAddress?.apartment && (
                          <div>{orderData.shippingAddress.apartment}</div>
                        )}
                        <div>
                          {orderData.shippingAddress?.city}, {orderData.shippingAddress?.state} {orderData.shippingAddress?.zipCode}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="font-medium">Temple Pickup</span>
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <div className="font-medium text-foreground mb-1">Pickup Location:</div>
                        New England Siva Temple<br />
                        255 Great Rd, Littleton, MA
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-2">
                {orderData.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {orderData.specialNote && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Special Note</h3>
                <p className="text-sm text-muted-foreground">{orderData.specialNote}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total Amount</span>
                <span className="text-primary">${orderData.total}</span>
              </div>
            </div>
          </Card>

          {/* Different messaging based on delivery method */}
          <div className="mt-8 p-6 bg-accent/10 rounded-lg border border-accent/20">
            {isShipping ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  📦 Order received – confirmation pending.
                </p>
                <p className="text-sm text-muted-foreground">
                  Final confirmation, invoice, and shipping details will be shared shortly via email.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  🛕 Your order will be ready for pickup at the temple.
                </p>
                <p className="text-sm text-muted-foreground">
                  You will receive an email confirmation shortly. Please pick up your order at the
                  specified time from New England Siva Temple, Littleton MA.
                </p>
              </div>
            )}
          </div>

          <Button size="lg" onClick={() => navigate("/")} className="mt-8">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
