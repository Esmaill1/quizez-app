import { Router, Request, Response } from 'express';
import multer from 'multer';
const pdf = require('pdf-parse');
import { requireAdmin } from '../middleware/auth';
import { generateAIQuestion, listAIModels } from '../services/aiGenerator';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/ai/models - List available AI models
router.get('/models', requireAdmin, async (req: Request, res: Response) => {
  try {
    const models = await listAIModels();
    res.json(models);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// POST /api/ai/generate - Secure AI question generation (Supports PDF or Topic)
router.post('/generate', requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    let promptContext = req.body.topic;
    const model = req.body.model;

    // If a PDF is uploaded, extract its text
    if (req.file && req.file.mimetype === 'application/pdf') {
      const pdfData = await pdf(req.file.buffer);
      promptContext = pdfData.text;
    }

    if (!promptContext || promptContext.trim() === '') {
      return res.status(400).json({ error: 'Topic or PDF file is required for AI generation' });
    }

    const question = await generateAIQuestion(promptContext, model);
    res.json(question);
  } catch (error: any) {
    console.error('AI Generation Route error:', error);
    res.status(500).json({ 
      error: 'Failed to generate question with AI',
      message: error.message 
    });
  }
});

export default router;
