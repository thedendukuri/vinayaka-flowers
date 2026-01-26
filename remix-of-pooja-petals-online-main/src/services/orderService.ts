interface OrderEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Sends order confirmation emails by providing the order_id
 * The edge function fetches all order details from the database
 * @param orderId - The UUID of the order in the database
 * @returns Promise with success status
 */
export const sendOrderEmails = async (
  orderId: string
): Promise<OrderEmailResponse> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error("Supabase URL not configured");
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-order-emails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to send emails");
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Error sending order emails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
