
import { GoogleGenAI } from "@google/genai";
import { Product, Customer } from "../types";

// Strictly adhering to naming convention and named parameter requirement
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdCopy = async (product: Product): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a professional and persuasive WhatsApp advertisement for:
      Product: ${product.name}
      Details: ${product.description}
      Price: ${product.price}
      
      Requirements:
      1. Use engaging emojis.
      2. Clear call to action.
      3. Format specifically for WhatsApp mobile reading.
      4. Be concise but high-impact.`,
    });
    
    // Use .text property as per guidelines (not a method)
    return response.text || "AI Agent could not formulate ad copy at this time.";
  } catch (error) {
    console.error("Gemini Creative Agent Error:", error);
    throw new Error("Creative Agent offline. Please verify API key configuration.");
  }
};

export const generateProductImage = async (product: Product): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A clean, professional studio product shot for a digital advertisement. Product: ${product.name}. Theme: ${product.description}. 4k resolution, centered, white background.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Iterate through parts to find inlineData
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
    // Logic for personalized greeting
    const greeting = customer.sex === 'Male' ? 'Mr.' : (customer.sex === 'Female' ? 'Ms.' : '');
    return `Hello ${greeting} ${customer.name}!\n\n${adCopy}`;
};
