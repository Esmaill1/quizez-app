import cache from './cache';

const OLLAMA_API_URL = 'https://ollama.com/api/generate';
const MODEL_NAME = 'deepseek-v3.1:671b-cloud'; // High-performance cloud model
const API_KEY = process.env.OLLAMA_API_KEY;

export interface AIGeneratedQuestion {
  title: string;
  items: string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

/**
 * Generates an ordering question using Ollama Cloud
 */
export async function generateAIQuestion(topic: string): Promise<AIGeneratedQuestion> {
  console.log(`🤖 Generating AI question for topic: "${topic}" using DeepSeek on Ollama Cloud...`);

  if (!API_KEY) {
    throw new Error('OLLAMA_API_KEY is not configured in the environment.');
  }

  const prompt = `
    Task: Generate an educational ordering/ranking question about "${topic}".
    Requirement: The items must have a clear, logical, and universally accepted chronological or sequential order.
    
    Output Format: You MUST respond ONLY with a valid JSON object. No preamble, no explanation outside the JSON.
    
    JSON Structure:
    {
      "title": "A short, descriptive title for the question",
      "items": ["Item 1 (Correct First)", "Item 2", "Item 3", "Item 4", "Item 5"],
      "explanation": "A rich educational explanation of why this is the correct order",
      "difficulty": "easy" | "medium" | "hard",
      "tags": ["tag1", "tag2"]
    }

    Constraints:
    - Provide exactly 4 to 6 items.
    - Ensure the 'items' array is in the CORRECT order.
    - Use 'easy', 'medium', or 'hard' for difficulty.
  `;

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
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
