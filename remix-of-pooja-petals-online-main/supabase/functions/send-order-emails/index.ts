import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ownerEmail = Deno.env.get("OWNER_EMAIL") || "owner@example.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - only require order_id
const EmailRequestSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

// HTML encode function to prevent XSS
function htmlEncode(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const maxRequests = 10;
  
  const entry = rateLimitMap.get(clientIp);
  
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + oneHour });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

interface ShippingAddress {
  street: string;
  aptUnit?: string;
  city: string;
  state: string;
  zipCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    const allowed = checkRateLimit(clientIp);
    if (!allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const { orderId } = EmailRequestSchema.parse(body);
    
    console.log("Processing order emails for order_id:", orderId);

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order from database
    const { data: order, error: orderError } = await supabase
      .from("ipf_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch order items from database
    const { data: orderItems, error: itemsError } = await supabase
      .from("ipf_order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch order items" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Order found:", { 
      orderNumber: order.order_number, 
      itemCount: orderItems?.length || 0,
      total: order.total_amount,
      deliveryMethod: order.delivery_method
    });

    // Format items for email
    const itemsList = (orderItems || [])
      .map(item => `<li>${htmlEncode(item.product_name_snapshot)} - Quantity: ${item.qty} - $${item.line_total.toFixed(2)}</li>`)
      .join("");

    // Format dates - use America/New_York timezone
    const orderDateFormatted = new Date(order.created_at).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/New_York'
    });
    
    const poojaDateFormatted = new Date(order.pickup_date).toLocaleDateString('en-US', {
      dateStyle: 'long',
      timeZone: 'America/New_York'
    });

    // HTML encode all user inputs from database
    const safeFullName = htmlEncode(order.customer_name);
    const safePreferredTime = htmlEncode(order.preferred_time);
    const safeNotes = order.notes ? htmlEncode(order.notes) : '';
    const safeMobile = htmlEncode(order.customer_phone);
    const safeEmail = htmlEncode(order.customer_email);
    const safeOrderNumber = htmlEncode(order.order_number);

    const isShipping = order.delivery_method === 'shipping';
    const shippingAddress = order.shipping_address as ShippingAddress | null;

    // Format shipping address if present
    let shippingAddressHtml = '';
    if (isShipping && shippingAddress) {
      const aptLine = shippingAddress.aptUnit ? `, ${htmlEncode(shippingAddress.aptUnit)}` : '';
      shippingAddressHtml = `
        ${htmlEncode(shippingAddress.street)}${aptLine}<br/>
        ${htmlEncode(shippingAddress.city)}, ${htmlEncode(shippingAddress.state)} ${htmlEncode(shippingAddress.zipCode)}
      `;
    }

    // Customer email - different content for shipping vs pickup
    let customerEmailHtml: string;
    let customerSubject: string;

    if (isShipping) {
      customerSubject = `Order ${safeOrderNumber} Received - Confirmation Pending`;
      customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d97706;">Order Received</h1>
          <p style="font-size: 16px; color: #666;"><strong>Order Number:</strong> ${safeOrderNumber}</p>
          <p>Dear ${safeFullName},</p>
          <p>Thank you for your order! We have received your request for pooja flowers with shipping.</p>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
            <p style="margin: 0; font-weight: bold; color: #92400e;">📦 What happens next?</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
              <li>We will verify the availability of your requested items</li>
              <li>Once confirmed, we will send you an invoice with the shipping charges</li>
              <li>Your order will be shipped after payment is received</li>
            </ul>
          </div>
          
          <h2 style="color: #d97706; margin-top: 30px;">Order Details</h2>
          <p><strong>Order Date:</strong> ${orderDateFormatted}</p>
          <p><strong>Requested Delivery Date:</strong> ${poojaDateFormatted}</p>
          <p><strong>Preferred Time:</strong> ${safePreferredTime}</p>
          
          <h3 style="margin-top: 20px;">Items Ordered:</h3>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          
          <p style="font-size: 18px; font-weight: bold; margin-top: 20px;">Items Subtotal: $${order.total_amount.toFixed(2)}</p>
          <p style="color: #666; font-size: 14px;">* Shipping charges will be calculated and included in your invoice</p>
          
          ${safeNotes ? `<p><strong>Special Note:</strong> ${safeNotes}</p>` : ''}
          
          <h3 style="margin-top: 20px;">Shipping Address:</h3>
          <p>${shippingAddressHtml}</p>
          
          <p style="margin-top: 20px; color: #666;">We will contact you shortly to confirm your order. Thank you for choosing us for your pooja needs!</p>
        </div>
      `;
    } else {
      customerSubject = `Order ${safeOrderNumber} Confirmed - Pooja Flowers`;
      customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d97706;">Order Confirmation</h1>
          <p style="font-size: 16px; color: #666;"><strong>Order Number:</strong> ${safeOrderNumber}</p>
          <p>Dear ${safeFullName},</p>
          <p>Thank you for your order! We have received your request for pooja flowers.</p>
          
          <h2 style="color: #d97706; margin-top: 30px;">Order Details</h2>
          <p><strong>Order Date:</strong> ${orderDateFormatted}</p>
          <p><strong>Pooja Date:</strong> ${poojaDateFormatted}</p>
          <p><strong>Preferred Time:</strong> ${safePreferredTime}</p>
          
          <h3 style="margin-top: 20px;">Items Ordered:</h3>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          
          <p style="font-size: 18px; font-weight: bold; margin-top: 20px;">Total Amount: $${order.total_amount.toFixed(2)}</p>
          
          ${safeNotes ? `<p><strong>Special Note:</strong> ${safeNotes}</p>` : ''}
          
          <h3 style="margin-top: 20px;">Pickup Information:</h3>
          <p><strong>Method:</strong> Pickup</p>
          <p>New England Siva Temple, 255 Great Rd, Littleton, MA</p>
          
          <p style="margin-top: 20px; color: #666;">Thank you for choosing us for your pooja needs!</p>
        </div>
      `;
    }

    await resend.emails.send({
      from: "Pooja Flowers <orders@mail.indianpoojaflowers.com>",
      to: [order.customer_email],
      subject: customerSubject,
      html: customerEmailHtml,
      replyTo: ownerEmail,
    });
    
    console.log("Customer confirmation email sent successfully");

    // Owner notification email - different for shipping
    let ownerEmailHtml: string;
    let ownerSubject: string;

    if (isShipping) {
      ownerSubject = `🚚 SHIPPING - ${safeOrderNumber} - New Order from ${safeFullName}`;
      ownerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #d97706; margin: 0;">🚚 SHIPPING ORDER</h1>
            <p style="margin: 5px 0 0 0; color: #92400e;">This order requires shipping - please confirm availability and send invoice</p>
          </div>
          
          <p style="font-size: 20px; font-weight: bold; color: #d97706;">Order: ${safeOrderNumber}</p>
          
          <h2 style="color: #d97706; margin-top: 30px;">Customer Details</h2>
          <p><strong>Name:</strong> ${safeFullName}</p>
          <p><strong>Mobile:</strong> ${safeMobile}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          
          <h2 style="color: #d97706; margin-top: 30px;">Shipping Address</h2>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px;">
            <p style="margin: 0;">${shippingAddressHtml}</p>
          </div>
          
          <h2 style="color: #d97706; margin-top: 30px;">Order Information</h2>
          <p><strong>Order Date:</strong> ${orderDateFormatted}</p>
          <p><strong>Requested Delivery Date:</strong> ${poojaDateFormatted}</p>
          <p><strong>Preferred Time:</strong> ${safePreferredTime}</p>
          
          <h3 style="margin-top: 20px;">Items Ordered:</h3>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          
          <p style="font-size: 18px; font-weight: bold; margin-top: 20px;">Items Subtotal: $${order.total_amount.toFixed(2)}</p>
          <p style="color: #d97706; font-weight: bold;">⚠️ Please calculate shipping charges and send invoice to customer</p>
          
          ${safeNotes ? `<div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px;"><strong>Special Note:</strong> ${safeNotes}</div>` : ''}
          
          <p style="margin-top: 30px; padding: 15px; background: #fee2e2; border-radius: 5px;">
            <strong>Customer Contact:</strong> ${safeMobile}
          </p>
          
          <p style="margin-top: 20px; padding: 15px; background: #d1fae5; border-radius: 5px; color: #065f46;">
            <strong>💡 Tip:</strong> Simply reply to this email to respond directly to the customer at ${safeEmail}
          </p>
        </div>
      `;
    } else {
      ownerSubject = `${safeOrderNumber} - New Order from ${safeFullName}`;
      ownerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d97706;">New Order Received!</h1>
          <p style="font-size: 20px; font-weight: bold; color: #d97706;">Order: ${safeOrderNumber}</p>
          
          <h2 style="color: #d97706; margin-top: 30px;">Customer Details</h2>
          <p><strong>Name:</strong> ${safeFullName}</p>
          <p><strong>Mobile:</strong> ${safeMobile}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          
          <h2 style="color: #d97706; margin-top: 30px;">Order Information</h2>
          <p><strong>Order Date:</strong> ${orderDateFormatted}</p>
          <p><strong>Pooja Date:</strong> ${poojaDateFormatted}</p>
          <p><strong>Preferred Time:</strong> ${safePreferredTime}</p>
          
          <h3 style="margin-top: 20px;">Items Ordered:</h3>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          
          <p style="font-size: 18px; font-weight: bold; margin-top: 20px;">Total Amount: $${order.total_amount.toFixed(2)}</p>
          
          ${safeNotes ? `<div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px;"><strong>Special Note:</strong> ${safeNotes}</div>` : ''}
          
          <h3 style="margin-top: 20px;">Pickup Information:</h3>
          <p><strong>Method:</strong> Pickup</p>
          
          <p style="margin-top: 30px; padding: 15px; background: #fee2e2; border-radius: 5px;">
            <strong>Customer Contact:</strong> ${safeMobile}
          </p>
          
          <p style="margin-top: 20px; padding: 15px; background: #d1fae5; border-radius: 5px; color: #065f46;">
            <strong>💡 Tip:</strong> Simply reply to this email to respond directly to the customer at ${safeEmail}
          </p>
        </div>
      `;
    }

    await resend.emails.send({
      from: "Pooja Flowers <orders@mail.indianpoojaflowers.com>",
      to: [ownerEmail],
      subject: ownerSubject,
      html: ownerEmailHtml,
      replyTo: order.customer_email,
    });
    
    console.log("Owner notification email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-emails function:", error);
    
    if (error.name === "ZodError") {
      return new Response(
        JSON.stringify({ error: "Invalid request. Please try again." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "An error occurred while processing your order. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);