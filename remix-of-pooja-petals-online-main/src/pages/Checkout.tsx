import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar, MapPin, Truck, Package, CheckCircle2, Clock, User, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateBreadcrumbSchema } from "@/utils/seo";
import { supabase } from "@/integrations/supabase/client";

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  mobile: z.string().trim().regex(/^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, "Please enter a valid 10-digit phone number"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email too long"),
  poojaDate: z.date({ required_error: "Please select a date" }),
  preferredTime: z.string().min(1, "Please select a time"),
  deliveryMethod: z.enum(["pickup", "shipping"]),
  street: z.string().max(200, "Street address too long").optional(),
  aptUnit: z.string().max(50, "Apt/Unit too long").optional(),
  city: z.string().max(100, "City too long").optional(),
  state: z.string().max(50, "State too long").optional(),
  zipCode: z.string().max(20, "ZIP code too long").optional(),
}).refine((data) => {
  if (data.deliveryMethod === "shipping") {
    return data.street && data.street.trim().length > 0 &&
           data.city && data.city.trim().length > 0 &&
           data.state && data.state.trim().length > 0 &&
           data.zipCode && data.zipCode.trim().length > 0;
  }
  return true;
}, {
  message: "Please fill in all required address fields",
  path: ["street"],
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }
];

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const specialNote = location.state?.specialNote || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryMethod: "pickup",
    },
  });

  const selectedDate = watch("poojaDate");
  const deliveryMethod = watch("deliveryMethod");
  const selectedTime = watch("preferredTime");

  const minShippingDate = addDays(new Date(), 7);

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    
    try {
      const pickupDateStr = data.poojaDate.toISOString().slice(0, 10);
      
      const basePayload = {
        customer_name: data.fullName,
        customer_phone: data.mobile.replace(/\D/g, ''),
        customer_email: data.email.toLowerCase(),
        pickup_date: pickupDateStr,
        preferred_time: data.preferredTime,
        notes: specialNote || null,
        delivery_method: data.deliveryMethod,
        items: cartItems.map(item => ({
          product_key: item.id,
          qty: item.quantity
        })),
        shipping_address: data.deliveryMethod === "shipping" ? {
          street: data.street || "",
          aptUnit: data.aptUnit || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
        } : null,
      };

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'ipf_create_order_with_items',
        { payload: basePayload }
      );

      const rpcResult = rpcData as {
        order_id?: string;
        order_number?: string;
        total_amount?: number;
        delivery_method?: string;
        success?: boolean;
        error?: string;
      } | null;

      if (rpcError || rpcResult?.success === false || !rpcResult?.order_id || !rpcResult?.order_number) {
        const errorMessage = rpcError?.message || rpcResult?.error || 'Failed to place order';
        console.error("RPC error:", rpcError || rpcResult?.error);
        toast({
          title: "Order Failed",
          description: errorMessage,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { order_number, total_amount } = rpcResult;

      const toastMessage = data.deliveryMethod === "shipping"
        ? `Order ${order_number} received. We'll confirm availability and contact you shortly.`
        : `Order ${order_number} confirmed successfully!`;
      toast({
        title: "Order placed successfully!",
        description: toastMessage,
      });

      clearCart();
      navigate("/confirmation", { 
        state: { 
          orderData: {
            fullName: data.fullName,
            email: data.email,
            poojaDate: data.poojaDate,
            preferredTime: data.preferredTime,
            items: cartItems,
            total: total_amount,
            specialNote,
            deliveryMethod: data.deliveryMethod,
          },
          orderNumber: order_number 
        } 
      });

    } catch (error) {
      console.error("Error processing order:", error);
      toast({
        title: "Order failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    navigate("/");
    return null;
  }

  const structuredData = [
    generateBreadcrumbSchema([
      { name: "Home", url: "/" }, 
      { name: "Cart", url: "/cart" }, 
      { name: "Checkout", url: "/checkout" }
    ])
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <SEO
        title="Checkout"
        description="Complete your order for fresh Vinayaka pooja flowers and Hindu temple offerings."
        canonical="/checkout"
        noindex={true}
        structuredData={structuredData}
      />
      <Header />
      
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/cart")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Cart</span>
            </Button>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Main Form - 3 columns */}
            <div className="lg:col-span-3 space-y-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="checkout-form">
                
                {/* Step 1: Delivery Method - First for better UX */}
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3 border-b">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      How would you like to receive your order?
                    </h2>
                  </div>
                  <div className="p-4 grid sm:grid-cols-2 gap-3">
                    {/* Pickup Card */}
                    <button
                      type="button"
                      onClick={() => setValue("deliveryMethod", "pickup")}
                      className={cn(
                        "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                        deliveryMethod === "pickup" 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      {deliveryMethod === "pickup" && (
                        <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
                      )}
                      <MapPin className={cn(
                        "h-8 w-8 mb-3",
                        deliveryMethod === "pickup" ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="font-semibold mb-1">Temple Pickup</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        New England Siva Temple<br />
                        255 Great Rd, Littleton, MA
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        💳 Pay at pickup
                      </div>
                    </button>

                    {/* Shipping Card */}
                    <button
                      type="button"
                      onClick={() => setValue("deliveryMethod", "shipping")}
                      className={cn(
                        "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                        deliveryMethod === "shipping" 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      {deliveryMethod === "shipping" && (
                        <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
                      )}
                      <Truck className={cn(
                        "h-8 w-8 mb-3",
                        deliveryMethod === "shipping" ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="font-semibold mb-1">Ship to Me</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Nationwide shipping available<br />
                        7-10 days advance notice required
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                        📦 Shipping charges apply
                      </div>
                    </button>
                  </div>
                </Card>

                {/* Shipping Address - Conditional */}
                {deliveryMethod === "shipping" && (
                  <Card className="overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3 border-b">
                      <h2 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Shipping Address
                      </h2>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <Label htmlFor="street">Street Address *</Label>
                        <Input 
                          id="street" 
                          {...register("street")} 
                          placeholder="123 Main Street"
                          className="mt-1.5" 
                        />
                        {errors.street && <p className="text-sm text-destructive mt-1">{errors.street.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="aptUnit">Apt, Suite, Unit <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input 
                          id="aptUnit" 
                          {...register("aptUnit")} 
                          placeholder="Apt 4B"
                          className="mt-1.5" 
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 sm:col-span-2">
                          <Label htmlFor="city">City *</Label>
                          <Input 
                            id="city" 
                            {...register("city")} 
                            placeholder="Boston"
                            className="mt-1.5" 
                          />
                          {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
                        </div>

                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Select onValueChange={(value) => setValue("state", value)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {US_STATES.map((state) => (
                                <SelectItem key={state.value} value={state.value}>{state.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
                        </div>

                        <div>
                          <Label htmlFor="zipCode">ZIP *</Label>
                          <Input 
                            id="zipCode" 
                            {...register("zipCode")} 
                            placeholder="02101"
                            maxLength={10}
                            className="mt-1.5" 
                          />
                          {errors.zipCode && <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Step 2: Date & Time */}
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3 border-b">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {deliveryMethod === "pickup" ? "When do you need the flowers?" : "Preferred Delivery Date"}
                    </h2>
                  </div>
                  <div className="p-4 grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                        {deliveryMethod === "pickup" ? "Pickup Date" : "Delivery Date"}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1.5 h-11",
                              !selectedDate && "text-muted-foreground",
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setValue("poojaDate", date)}
                            disabled={(date) => {
                              if (deliveryMethod === "shipping") {
                                return date < minShippingDate;
                              }
                              return date < new Date();
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      {deliveryMethod === "shipping" && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Minimum 7 days advance notice for shipping
                        </p>
                      )}
                      {errors.poojaDate && <p className="text-sm text-destructive mt-1">{errors.poojaDate.message}</p>}
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">Preferred Time</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setValue("preferredTime", "morning")}
                          className={cn(
                            "p-3 rounded-lg border-2 text-center transition-all",
                            selectedTime === "morning"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          <div className="text-lg mb-0.5">🌅</div>
                          <div className="text-xs font-medium">Morning</div>
                          <div className="text-[10px] text-muted-foreground">10 AM - 12 PM</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue("preferredTime", "evening")}
                          className={cn(
                            "p-3 rounded-lg border-2 text-center transition-all",
                            selectedTime === "evening"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          <div className="text-lg mb-0.5">🌆</div>
                          <div className="text-xs font-medium">Evening</div>
                          <div className="text-[10px] text-muted-foreground">6 - 8:30 PM</div>
                        </button>
                      </div>
                      {errors.preferredTime && <p className="text-sm text-destructive mt-1">{errors.preferredTime.message}</p>}
                    </div>
                  </div>
                </Card>

                {/* Step 3: Contact Info */}
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3 border-b">
                    <h2 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Your Contact Information
                    </h2>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Full Name
                      </Label>
                      <Input id="fullName" {...register("fullName")} placeholder="Your full name" className="mt-1.5" />
                      {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mobile" className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          Mobile Number
                        </Label>
                        <Input
                          id="mobile"
                          {...register("mobile")}
                          placeholder="(978) 555-1234"
                          className="mt-1.5"
                        />
                        {errors.mobile && <p className="text-sm text-destructive mt-1">{errors.mobile.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="email" className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          Email Address
                        </Label>
                        <Input id="email" type="email" {...register("email")} placeholder="you@example.com" className="mt-1.5" />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                      </div>
                    </div>
                  </div>
                </Card>
              </form>
            </div>

            {/* Order Summary Sidebar - 2 columns */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 space-y-4">
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3 border-b">
                    <h2 className="font-semibold">Order Summary</h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3 max-h-[240px] overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {specialNote && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Special Note:</p>
                        <p className="text-sm">{specialNote}</p>
                      </div>
                    )}

                    <div className="border-t mt-4 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${getCartTotal().toFixed(2)}</span>
                      </div>
                      {deliveryMethod === "shipping" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="text-xs text-muted-foreground italic">Calculated after confirmation</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">${getCartTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Place Order Button */}
                <Button 
                  type="submit" 
                  form="checkout-form"
                  size="lg" 
                  className="w-full text-lg h-14 shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      Place Order
                      <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
                    </>
                  )}
                </Button>

                {/* Trust Indicators */}
                <div className="text-center space-y-1 text-xs text-muted-foreground">
                  <p>🔒 Secure checkout</p>
                  <p>Confirmation email will be sent immediately</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;