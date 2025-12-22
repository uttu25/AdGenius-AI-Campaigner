
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
      4. Format specifically for WhatsApp mobile reading (bold text, bullet points).
      5. Explicitly mention "${companyName || 'our store'}" as the provider.
      6. Be concise but high-impact.`,
    });
    
    return response.text || "AI Agent could not formulate ad copy at this time.";
  } catch (error) {
    console.error("Gemini Creative Agent Error:", error);
    throw error;
  }
};

/**
 * Generates an actual product image using the Gemini image generation model.
 * Returns the Base64 data of the generated image.
 */
export const generateProductImage = async (product: Product, companyName?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const brandContext = companyName ? `for the brand "${companyName}"` : "";
    
    const prompt = `A professional, high-end commercial product photograph of ${product.name}. 
    Context: ${product.description}. 
    The product should be the focal point, featuring premium studio lighting, a clean minimalist background ${brandContext}, and a modern commercial aesthetic. 
    High resolution, 4k, photorealistic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Iterate through parts to find the image data
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned by the model.");
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export const personalizeMessage = async (adCopy: string, customer: Customer): Promise<string> => {
    const greeting = customer.sex === 'Male' ? 'Mr.' : (customer.sex === 'Female' ? 'Ms.' : '');
    return `Hello ${greeting} ${customer.name}!\n\n${adCopy}`;
};
