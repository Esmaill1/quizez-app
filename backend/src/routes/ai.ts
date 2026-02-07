import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import { generateAIQuestion } from '../services/aiGenerator';

const router = Router();

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
