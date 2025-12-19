
import { WhatsAppConfig } from "../types";

/**
 * Sends a text message via WhatsApp Cloud API.
 * Note: Free-form text messages usually require the customer to have messaged the business in the last 24h.
 * For true outbound cold-messaging, WhatsApp requires pre-approved Templates.
 * This service implements the standard message sending endpoint.
 */
export const sendWhatsAppMessage = async (
  config: WhatsAppConfig,
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  if (!config.accessToken || !config.phoneNumberId) {
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  // Sanitize phone number: Remove non-digits and ensure it has a country code
  const sanitizedTo = to.replace(/\D/g, "");

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: sanitizedTo,
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error?.message || `API Error: ${response.status}` 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown network error" 
    };
  }
};
