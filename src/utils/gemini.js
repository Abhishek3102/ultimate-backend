import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get keys from env (supports single or comma-separated list)
const getKeys = () => {
    // 1. Try GEMINI_API_KEYS (list)
    const list = (process.env.GEMINI_API_KEYS || "").split(",").map(k => k.trim()).filter(k => k);
    // 2. Add GEMINI_API_KEY (single) if not already in list
    if (process.env.GEMINI_API_KEY) {
        if (!list.includes(process.env.GEMINI_API_KEY)) {
            list.unshift(process.env.GEMINI_API_KEY);
        }
    }
    return [...new Set(list)]; // Unique keys
};

let currentKeyIndex = 0;

export const generateEmbedding = async (text) => {
    const keys = getKeys();
    
    // Fallback Mock if no keys provided at all (Development mode)
    if (keys.length === 0) {
        console.warn("No GEMINI_API_KEYS found. Using mock embedding.");
        return Array.from({ length: 768 }, () => Math.random() - 0.5);
    }

    // Try rotating through keys
    for (let attempt = 0; attempt < keys.length; attempt++) {
        // Calculate index allowing wrap-around
        const actualIndex = (currentKeyIndex + attempt) % keys.length;
        const key = keys[actualIndex];

        try {
            const genAI = new GoogleGenerativeAI(key);
            // Use 'text-embedding-004' (newer, better limits) instead of 'embedding-001'
            const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
            
            const result = await model.embedContent(text);
            
            // Success! Update index to stick with this working key
            currentKeyIndex = actualIndex;
            return result.embedding.values;

        } catch (error) {
            console.error(`Gemini Error (Key ...${key.slice(-4)}):`, error.message);
            
            const isQuotaError = error.message.includes("429") || 
                                 error.message.includes("Quota") ||
                                 error.message.includes("Too Many Requests");

            if (isQuotaError) {
                console.log("Quota limit hit. Rotating to next key...");
                continue; // Try next key in loop
            }
            
            // If it's not a quota error (e.g. network), we might still want to try next key or just fallback.
            // For robustness, let's continue.
        }
    }

    // If all keys fail (or loops finishes), return FALLBACK instead of crashing
    console.warn("All Gemini keys exhausted or failed. Returning random fallback embedding.");
    return Array.from({ length: 768 }, () => Math.random() - 0.5);
};

export const generateText = async (prompt) => {
    const keys = getKeys();
    
    if (keys.length === 0) {
        return "AI features unavailable: No API keys configured.";
    }

    // Try rotating through keys
    for (let attempt = 0; attempt < keys.length; attempt++) {
        const actualIndex = (currentKeyIndex + attempt) % keys.length;
        const key = keys[actualIndex];

        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            currentKeyIndex = actualIndex;
            return response.text();

        } catch (error) {
            console.error(`Gemini Text Error (Key ...${key.slice(-4)}):`, error.message);
            
            const isQuotaError = error.message.includes("429") || 
                                 error.message.includes("Quota") ||
                                 error.message.includes("Too Many Requests");

            if (isQuotaError) continue;
        }
    }
    
    return "Failed to generate content: Services busy.";
};

// Cosine Similarity Function
export const calculateSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
