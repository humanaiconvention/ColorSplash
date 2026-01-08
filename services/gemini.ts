import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY_API = 'colorsplash_api_key';
export const GENERATION_MODEL_NAME = 'gemini-2.5-flash-image';

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_API);
};

export const setStoredApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY_API, key);
};

export const clearStoredApiKey = () => {
  localStorage.removeItem(STORAGE_KEY_API);
};

export const STYLES_PROMPTS: Record<string, string> = {
  cute: "Create a cute, simple, vibrant, vector-style illustration. Use flat, distinct, prominent colors. Do not use gradients or complex textures. The style should be suitable for a children's pixel art coloring book.",
  anime: "Create an anime style illustration. Use vibrant colors, distinct cell shading, expressive eyes, and dynamic compositions. Keep details clear and distinct for pixelation.",
  abstract: "Create an abstract, geometric, cubist style art piece. Use bold shapes, patterns, and strong contrasting colors. Focus on the composition of forms.",
  pixel: "Create an 8-bit pixel art style illustration. Use a retro game aesthetic with chunky, clear pixels and a limited but vibrant color palette.",
  cartoon: "Create a classic cartoon style illustration. Use thick bold outlines, flat bright colors, and expressive features. Avoid gradients or realistic shading.",
};

export const constructGenerationPrompt = (prompt: string, style: string, modifiers?: string): string => {
  const styleInstruction = STYLES_PROMPTS[style] || STYLES_PROMPTS['cute'];
  const modifierInstruction = modifiers ? `ADJUSTMENTS: ${modifiers}.` : "";
  
  return `${styleInstruction}
            Subject: ${prompt}. 
            ${modifierInstruction}
            The subject should fill the main part of the frame.
            IMPORTANT: Do NOT use a white background. Fill the background with a simple, colorful environment natural to the subject.
            The image should be completely filled with color. 
            Only use white for small details like eyes or teeth.`;
};

interface GenerationResult {
  imageUrl: string;
  stats: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
  };
}

/**
 * Generates an illustration based on the user's prompt and selected style.
 * Uses localStorage key first, then process.env.API_KEY.
 */
export const generateConceptImage = async (prompt: string, style: string = 'cute', modifiers?: string): Promise<GenerationResult> => {
  // 1. Try Local Storage (User provided)
  let apiKey = getStoredApiKey();

  // 2. Fallback to Environment Variable (Build provided)
  if (!apiKey) {
    apiKey = process.env.API_KEY;
  }

  if (!apiKey) {
    console.error("Critical: API_KEY is missing.");
    throw new Error("Missing Magic Key. Please add your Google AI Key in the settings.");
  }

  // Defensive: Strip extra quotes if they were included
  apiKey = apiKey.replace(/["']/g, "").trim();

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const finalPrompt = constructGenerationPrompt(prompt, style, modifiers);

    const response = await ai.models.generateContent({
      model: GENERATION_MODEL_NAME,
      contents: {
        parts: [
          {
            text: finalPrompt
          }
        ]
      }
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      throw new Error("The magic paintbrush failed to start. Try again!");
    }

    const content = response.candidates[0].content;
    
    // Extract Metadata
    const stats = {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
        model: GENERATION_MODEL_NAME
    };
    
    for (const part of content.parts) {
      if (part.inlineData) {
        return {
            imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            stats
        };
      }
    }
    
    console.error("AI Response content:", content);
    throw new Error("No image was returned by the AI.");

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    const msg = error.message || "An unknown error occurred.";
    
    if (msg.includes("API key")) throw new Error("Check your Magic Key (API Key is invalid or expired).");
    if (msg.includes("403")) throw new Error("Magic Key doesn't have permission.");
    if (msg.includes("429")) throw new Error("The magic pencil is tired. Wait a few seconds!");
    if (msg.includes("safety")) throw new Error("That idea is a bit too wild! Try a different animal.");
    if (msg.includes("fetch failed")) throw new Error("Could not connect to the magic cloud. Check your internet!");
    
    throw new Error(msg);
  }
};