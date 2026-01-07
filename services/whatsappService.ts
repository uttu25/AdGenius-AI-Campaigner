import { WhatsAppConfig } from "../types";

/**
 * Sends a WhatsApp message using the "Template" method required for business-initiated conversations.
 * * REAL WORLD REQUIREMENT:
 * 1. Go to Meta Business Manager -> WhatsApp Manager -> Templates.
 * 2. Create a template named "marketing_alert" (or similar).
 * 3. Body text: "Hello {{1}}, we have a new update regarding {{2}}. Check it out here: {{3}}"
 */
export const sendWhatsAppMessage = async (
  config: WhatsAppConfig,
  to: string,
  message: string, // In a real app, this would be the dynamic variable content
  isTemplate: boolean = true // Default to true for safety
): Promise<{ success: boolean; error?: string }> => {
  if (!config.accessToken || !config.phoneNumberId) {
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  const sanitizedTo = to.replace(/\D/g, "");

  // Payload structure depends on whether we are starting a chat (Template) or replying (Text)
  let bodyPayload: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: sanitizedTo,
  };

  if (isTemplate) {
    // FEASIBLE APPROACH: Send a Template
    // We assume the user has a template named 'marketing_campaign' with 1 variable (the ad copy or product name)
    // Note: In production, you would pass the template name dynamically.
    bodyPayload = {
      ...bodyPayload,
      type: "template",
      template: {
        name: "marketing_opening", // You must create this in Facebook Business Manager
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
              // We pass the AI message as the first variable {{1}}
              // WARNING: Meta limits variable length. Keep it short or use headers.
              { type: "text", text: message.substring(0, 1024) } 
            ]
          }
        ]
      }
    };
  } else {
    // TRADITIONAL APPROACH: Only works if customer replied <24h ago
    bodyPayload = {
      ...bodyPayload,
      type: "text",
      text: { body: message }
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle the specific "24-hour window" error (Code 131047)
      if (data.error?.code === 131047) {
        return { success: false, error: "Failed: 24h Window Closed. Use a Template." };
      }
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
