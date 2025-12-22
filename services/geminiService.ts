
import { GoogleGenAI } from "@google/genai";
import { Product, Customer } from "../types.ts";

export const generateAdCopy = async (product: Product, companyName?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const brandContext = companyName ? `This advertisement is for "${companyName}". Ensure the tone aligns with this brand name.` : "This is a professional business advertisement.";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a professional and persuasive WhatsApp advertisement for:
      Product: ${product.name}
      Details: ${product.description}
      Price: ${product.price}
      Link: ${product.url}
      
      Brand Identity: ${brandContext}
      
      Requirements:
      1. Use engaging emojis appropriate for the product and brand.
      2. Integrate the pricing naturally.
      3. The Call to Action MUST feature the product link clearly.
      4. Format specifically for WhatsApp mobile reading (bullet points, bold text).
      5. Explicitly mention "${companyName || 'our store'}" as the provider.
      6. Be concise but high-impact.`,
    });
    
    return response.text || "AI Agent could not formulate ad copy at this time.";
  } catch (error) {
    console.error("Gemini Creative Agent Error:", error);
    throw new Error("Creative Agent offline. Please verify API key configuration.");
  }
};

export const generateProductImage = async (product: Product, companyName?: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const brandContext = companyName ? `aligned with the visual identity of "${companyName}"` : "";
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Use the standard, reliable flash image model
      contents: {
        parts: [
          { text: `A clean, professional studio product shot ${brandContext}. Product: ${product.name}. Theme: ${product.description}. Commercial lighting, centered, white background.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error: any) {
    console.error("Gemini Image Agent Error:", error);
    // Extract the clean message from the error object if possible
    const message = error.message || "Unknown API Error";
    throw new Error(`Failed to call the Gemini API: ${message}`);
  }
  return undefined;
};

export const personalizeMessage = async (adCopy: string, customer: Customer): Promise<string> => {
    const greeting = customer.sex === 'Male' ? 'Mr.' : (customer.sex === 'Female' ? 'Ms.' : '');
    return `Hello ${greeting} ${customer.name}!\n\n${adCopy}`;
};
