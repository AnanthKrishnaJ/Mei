
import { GoogleGenAI, Type } from "@google/genai";
import { ToxicityResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeToxicity = async (text: string, language: string): Promise<ToxicityResult> => {
  const systemInstruction = `
    You are an advanced game chat moderation system named Mei. 
    Analyze the provided chat text for toxicity across various dimensions.
    
    Dimensions to check: 
    - hate_speech: content that attacks people based on race, religion, etc.
    - harassment: repeated attacks or insults.
    - profanity: swear words or vulgar language.
    - threat: physical or hacking threats.
    - racism: specific racial slurs or discriminatory themes.
    - bullying: targeting specific players or noob-shaming.
    - sexual_content: sexually explicit language.
    - spam: repetitive meaningless text.
    - sarcasm: passive-aggressive comments, mocking, or ironic praise (e.g., "great aim buddy").
    - trash_talk: competitive banter that is acceptable in gaming (e.g., "get rekt", "gg easy"). Distinguish this from actual toxicity.

    Note: You must understand "Manglish" (Malayalam written in the English/Latin alphabet). If the text is Manglish, analyze it accurately and translate it to English.

    If the user chose "auto" for language, identify it.
    
    Return a valid JSON object with:
    - score: integer from 0 to 100 representing overall toxicity. (Trash talk should have a low toxicity score, e.g., 10-30. Sarcasm should be 20-40. CRITICAL: If 'hate_speech' or 'threat' is detected, the score MUST be heavily weighted and be very high, typically 80-100).
    - level: one of ["SAFE", "TRASH_TALK", "SARCASM", "MILD", "TOXIC", "HIGHLY_TOXIC", "EXTREME"]. (If 'hate_speech' or 'threat' is detected, the level MUST be "HIGHLY_TOXIC" or "EXTREME").
    - detectedLanguage: short string like "English", "Spanish", etc.
    - englishTranslation: If the detectedLanguage is NOT English, provide the English translation of the text. If it is English, leave this empty or omit it.
    - categories: array of detected category IDs from the list above.
    - highlights: array of objects { "word": string, "category": string } for specific problematic spans.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Analyze this chat text (${language === 'auto' ? 'Auto-detect' : 'Forcing Language: ' + language}): "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            level: { type: Type.STRING },
            detectedLanguage: { type: Type.STRING },
            englishTranslation: { type: Type.STRING },
            categories: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            highlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["word", "category"]
              }
            }
          },
          required: ["score", "level", "detectedLanguage", "categories", "highlights"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      ...result,
      timestamp: Date.now(),
      originalText: text
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Provide specific error messages based on the error type/status
    let errorMessage = "Failed to analyze text. Please check your connection and try again.";
    
    if (error.status === 401 || error.message?.includes('API key') || error.message?.includes('UNAUTHENTICATED')) {
      errorMessage = "Authentication failed. Please check your API key configuration.";
    } else if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
    } else if (error.status === 400 || error.message?.includes('INVALID_ARGUMENT')) {
      errorMessage = "Invalid request. Please check your input and try again.";
    } else if (error.status === 403 || error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = "Permission denied. Please check your API key permissions.";
    } else if (error.status >= 500 || error.message?.includes('INTERNAL')) {
      errorMessage = "Gemini API service is currently unavailable. Please try again later.";
    } else if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.message) {
      errorMessage = `Analysis failed: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};
