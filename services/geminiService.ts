import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseReceiptImage = async (base64Image: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  // Dynamic Mime Type Detection
  let mimeType = 'image/jpeg';
  if (base64Image.startsWith('data:image/png;')) {
    mimeType = 'image/png';
  } else if (base64Image.startsWith('data:image/webp;')) {
    mimeType = 'image/webp';
  }

  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: `Extract receipt data. Return ONLY a valid JSON object. Keys: "vendor" (string), "date" (YYYY-MM-DD), "amount" (number). No markdown.` }
        ]
      }
    });

    const text = response.text || "{}";
    return text.replace(/```json/g, '').replace(/```/g, '').trim(); 
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const generateGrantSection = async (topic: string, grantName: string, funder: string, keyDetails: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Write "${topic}" for grant: ${grantName} (Funder: ${funder}). Details: ${keyDetails}`
    });
    return response.text || "";
  } catch (error) { return "Error generating text."; }
};

export const generateEmailTemplate = async (topic: string, context: string): Promise<{ subject: string; body: string }> => {
  if (!apiKey) throw new Error("API Key missing");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Email template for "${topic}", context "${context}". Return JSON {subject, body}`,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) { return { subject: "", body: "" }; }
};