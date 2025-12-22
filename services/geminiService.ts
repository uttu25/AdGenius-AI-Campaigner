
import { GoogleGenAI } from "@google/genai";
import { Product, Customer } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdCopy = async (product: Product, companyName?: string): Promise<string> => {
  try {
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
    const brandContext = companyName ? `aligned with the visual identity of "${companyName}"` : "";
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A clean, professional studio product shot ${brandContext}. Product: ${product.name}. Theme: ${product.description}. 4k resolution, centered, white background, commercial lighting.` }
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
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error) {
    console.error("Gemini Image Agent Error:", error);
  }
  return undefined;
};

export const personalizeMessage = async (adCopy: string, customer: Customer): Promise<string> => {
    const greeting = customer.sex === 'Male' ? 'Mr.' : (customer.sex === 'Female' ? 'Ms.' : '');
    return `Hello ${greeting} ${customer.name}!\n\n${adCopy}`;
};
