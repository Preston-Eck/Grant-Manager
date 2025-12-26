import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseReceiptImage = async (base64Image: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  // 1. Dynamic Mime Type Detection
  // Check if the string starts with a data URI scheme
  let mimeType = 'image/jpeg'; // Default
  if (base64Image.startsWith('data:image/png;')) {
    mimeType = 'image/png';
  } else if (base64Image.startsWith('data:image/jpeg;') || base64Image.startsWith('data:image/jpg;')) {
    mimeType = 'image/jpeg';
  } else if (base64Image.startsWith('data:image/webp;')) {
    mimeType = 'image/webp';
  }

  // 2. Strip the header for the API payload
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: base64Data
            }
          },
          {
            text: `Extract data from this receipt. Return ONLY a JSON object (no markdown) with these keys: 
            - "vendor" (string)
            - "date" (YYYY-MM-DD string)
            - "amount" (number)
            - "category" (string, guess based on vendor e.g., Supplies, Travel, Meals).`
          }
        ]
      }
    });

    return response.text || "{}"; 
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const generateGrantSection = async (
  topic: string,
  grantName: string,
  funder: string,
  keyDetails: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `You are a professional grant writer. Write the "${topic}" section for a grant proposal.
      
      Grant Name: ${grantName}
      Funder: ${funder}
      Key Details provided by user: ${keyDetails}
      
      Keep it professional, persuasive, and concise. formatting: clean paragraphs.`
    });

    // FIX: Fallback to empty string
    return response.text || "";
  } catch (error) {
    console.error("Gemini Text Gen Error:", error);
    throw error;
  }
};

export const generateEmailTemplate = async (
  topic: string,
  context: string
): Promise<{ subject: string; body: string }> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `You are an expert grant manager. Create an email template.
      Topic: ${topic}
      Context/Tone: ${context}
      
      Return valid JSON with keys "subject" and "body".
      The body should use placeholders like {{GrantName}}, {{Vendor}}, {{Date}} where appropriate.`,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    // FIX: Fallback to empty JSON object string if undefined
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Template Gen Error:", error);
    throw error;
  }
};