import cache from './cache';

const OLLAMA_API_URL = 'https://ollama.com/api/generate';
const DEFAULT_MODEL = 'ministral-3:8b'; 
const API_KEY = process.env.OLLAMA_API_KEY;

export interface AIGeneratedQuestion {
  title: string;
  items: string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

/**
 * Fetches available models from Ollama Cloud
 */
export async function listAIModels(): Promise<string[]> {
  const cacheKey = 'ollama_models';
  const cachedModels = cache.get<string[]>(cacheKey);
  if (cachedModels) return cachedModels;

  try {
    const response = await fetch('https://ollama.com/api/tags', {
      headers: API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}
    });

    if (!response.ok) {
      // Fallback models if API fails
      return [DEFAULT_MODEL, 'deepseek-v3.1:671b-cloud', 'gemma3:27b-cloud', 'gpt-oss:20b-cloud'];
    }

    const data = await response.json();
    const models = data.models?.map((m: any) => m.name) || [];
    
    // Cache the list for 24 hours
    cache.set(cacheKey, models, 86400);
    return models;
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    return [DEFAULT_MODEL, 'deepseek-v3.1:671b-cloud', 'gemma3:27b-cloud', 'gpt-oss:20b-cloud'];
  }
}

/**
 * Generates an ordering question using Ollama Cloud
 */
export async function generateAIQuestion(promptContext: string, model: string = DEFAULT_MODEL): Promise<AIGeneratedQuestion> {
  console.log(`🤖 Generating AI question using ${model}...`);

  if (!API_KEY) {
    throw new Error('OLLAMA_API_KEY is not configured.');
  }

  const isLongContext = promptContext.length > 500;
  
  const prompt = isLongContext 
    ? `
      Below is text from a document. Find a logical process, sequence, or chronological set of events within this text and create an ordering quiz question about it.
      
      Document Content:
      "${promptContext.substring(0, 10000)}" 

      Response MUST be ONLY JSON:
      {
        "title": "Clear title for the sequence found",
        "items": ["First step/event", "Second", "Third", "Fourth", "Fifth"],
        "explanation": "Brief explanation of the sequence based on the text",
        "difficulty": "easy" | "medium" | "hard",
        "tags": ["extracted", "document"]
      }
      Constraints: 4-6 items in CORRECT order.
    `
    : `
      Create a JSON ordering quiz about "${promptContext}".
      The items must have a clear logical/chronological sequence.
      
      Response MUST be ONLY JSON:
      {
        "title": "Question Title",
        "items": ["First Item", "Second", "Third", "Fourth"],
        "explanation": "Why this order is correct",
        "difficulty": "easy" | "medium" | "hard",
        "tags": ["tag1", "tag2"]
      }
      Constraints: 4-6 items in CORRECT order.
    `;

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        format: 'json'
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama Cloud error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const generatedText = data.response || '';
    
    try {
      // Find the first '{' and last '}' to extract only the JSON object
      // This handles markdown blocks or reasoning text that some models might include
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in AI response');
      }
      
      const cleanJson = jsonMatch[0];
      const parsed: AIGeneratedQuestion = JSON.parse(cleanJson);
      
      // Basic validation of the required fields
      if (!parsed.title || !Array.isArray(parsed.items) || parsed.items.length < 2) {
        throw new Error('AI response missing required fields or has too few items');
      }

      return parsed;
    } catch (parseError: any) {
      console.error('❌ Failed to parse AI JSON response:', generatedText);
      console.error('🔍 Parse error detail:', parseError.message);
      throw new Error(`AI returned an invalid response format: ${parseError.message}`);
    }
  } catch (error) {
    console.error('AI Generation error:', error);
    throw error;
  }
}
