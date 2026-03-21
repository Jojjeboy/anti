import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with the key from environment variables
// Using VITE_GEMINI_KEY as requested, with fallback to VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

export interface GeneratedList {
    title: string;
    items: string[];
}

export const generateListContent = async (prompt: string): Promise<GeneratedList> => {
    if (!apiKey) {
        throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_KEY to your .env file.");
    }

    try {
        const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview";
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: 'Du är en expert på att skapa strukturerade listor. Ta hänsyn till alla detaljer i användarens prompt. Svara ALLTID med ett strikt JSON-objekt: { "title": string, "items": string[] }. Ge inga förklaringar eller annan text, bara JSON.'
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON from potential markdown blocks in case the model wraps it still
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, responseText];
        const jsonString = jsonMatch[1].trim();

        const data = JSON.parse(jsonString) as GeneratedList;

        if (!data.title || !Array.isArray(data.items)) {
            throw new Error("Invalid response format from AI.");
        }

        return data;
    } catch (error) {
        console.error("Error generating list with AI:", error);
        const errorMessage = error instanceof Error ? error.message : "Kunde inte generera lista. Kontrollera din prompt eller försök igen senare.";
        throw new Error(errorMessage);
    }
};
