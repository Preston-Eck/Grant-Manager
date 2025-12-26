import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseReceiptImage = async (base64Image: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  // Strip prefix if present (e.g. data:image/png;base64,)
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity, realistically detect type
              data: base64Data
            }
          },
          {
            text: `Analyze this receipt. Return ONLY a JSON object with the following keys: "vendor" (string), "date" (YYYY-MM-DD string), "amount" (number), "category" (string, guess based on vendor e.g., Supplies, Travel, Meals). Do not include markdown formatting or backticks.`
          }
        ]
      }
    });

    return response.text;
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
      model: 'gemini-3-flash-preview',
      contents: `You are a professional grant writer. Write the "${topic}" section for a grant proposal.
      
      Grant Name: ${grantName}
      Funder: ${funder}
      Key Details provided by user: ${keyDetails}
      
      Keep it professional, persuasive, and concise. formatting: clean paragraphs.`
    });

    return response.text;
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
      model: 'gemini-3-flash-preview',
      contents: `You are an expert grant manager. Create an email template.
      Topic: ${topic}
      Context/Tone: ${context}
      
      Return valid JSON with keys "subject" and "body".
      The body should use placeholders like {{GrantName}}, {{Vendor}}, {{Date}} where appropriate.`,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    // The response text is guaranteed to be JSON due to responseMimeType
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Template Gen Error:", error);
    throw error;
  }
};