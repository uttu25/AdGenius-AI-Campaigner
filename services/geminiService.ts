
import { GoogleGenAI } from "@google/genai";
import { Product, Customer } from "../types";

// Always initialize with the direct process.env.API_KEY as per core guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdCopy = async (product: Product): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a compelling WhatsApp advertisement for the following product:
      Name: ${product.name}
      Description: ${product.description}
      Price: ${product.price}
      
      The ad should be engaging, include emojis, and have a clear call to action. 
      Format it ready for a WhatsApp message. Keep it concise.`,
    });
    return response.text || "Failed to generate ad copy.";
  } catch (error) {
    console.error("Ad copy generation failed:", error);
    throw new Error("AI Creative Agent failed to generate copy. Check API key status.");
  }
};

export const generateProductImage = async (product: Product): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `High quality commercial product photography for an advertisement. Product: ${product.name}. Description: ${product.description}. White background, professional lighting.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed", error);
  }
  return undefined;
};

export const personalizeMessage = async (adCopy: string, customer: Customer): Promise<string> => {
    const salutation = customer.sex === 'Male' ? 'Mr.' : (customer.sex === 'Female' ? 'Ms.' : '');
    return `Hi ${salutation} ${customer.name},\n\n${adCopy}`;
};
