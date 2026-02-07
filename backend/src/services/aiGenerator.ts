import cache from './cache';

const OLLAMA_API_URL = 'https://api.ollama.com/api/generate';
const MODEL_NAME = 'llama3.1'; // High-performance model for cloud
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
  console.log(`🤖 Generating AI question for topic: "${topic}" using Ollama Cloud...`);

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
    const generatedText = data.response;
    
    try {
      const parsed: AIGeneratedQuestion = JSON.parse(generatedText);
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse AI JSON response:', generatedText);
      throw new Error('AI returned an invalid response format. Please try again.');
    }
  } catch (error) {
    console.error('AI Generation error:', error);
    throw error;
  }
}
