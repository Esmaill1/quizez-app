import cache from './cache';

const OLLAMA_API_URL = 'https://esmailx50-ollama.hf.space/api/generate';
const MODEL_NAME = 'gemma3:4b';

export interface AIGeneratedQuestion {
  title: string;
  items: string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

/**
 * Generates an ordering question using Ollama
 */
export async function generateAIQuestion(topic: string): Promise<AIGeneratedQuestion> {
  console.log(`🤖 Generating AI question for topic: "${topic}"...`);

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        format: 'json' // Telling Ollama to return JSON
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.response;
    
    // Attempt to parse the JSON from the response
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
