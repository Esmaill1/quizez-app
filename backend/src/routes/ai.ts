import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import { generateAIQuestion, listAIModels } from '../services/aiGenerator';

const router = Router();

// GET /api/ai/models - List available AI models
router.get('/models', requireAdmin, async (req: Request, res: Response) => {
  try {
    const models = await listAIModels();
    res.json(models);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// POST /api/ai/generate - Secure AI question generation
router.post('/generate', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { topic, model } = req.body;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({ error: 'Topic is required for AI generation' });
    }

    const question = await generateAIQuestion(topic, model);
    res.json(question);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to generate question with AI',
      message: error.message 
    });
  }
});

export default router;
