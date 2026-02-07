import { Router, Request, Response } from 'express';
import sql from '../database/connection';
import { Chapter, CreateChapterRequest } from '../types';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET all chapters with topic count
router.get('/', async (req: Request, res: Response) => {
  try {
    const chapters = await sql`
      SELECT c.*, 
             COALESCE(COUNT(t.id), 0)::int as topic_count
      FROM chapters c
      LEFT JOIN topics t ON c.id = t.chapter_id
      GROUP BY c.id
      ORDER BY c.order_index ASC, c.created_at ASC
    `;
    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// GET single chapter with its topics
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const chapters = await sql`
      SELECT * FROM chapters WHERE id = ${id}
    `;
    
    if (chapters.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    const topics = await sql`
      SELECT t.*, 
             COALESCE(COUNT(q.id), 0)::int as question_count
      FROM topics t
      LEFT JOIN questions q ON t.id = q.topic_id
      WHERE t.chapter_id = ${id}
      GROUP BY t.id
      ORDER BY t.order_index ASC, t.created_at ASC
    `;
    
    res.json({
      ...chapters[0],
      topics,
    });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

// POST create new chapter
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description }: CreateChapterRequest = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Chapter name is required' });
    }
    
    // Get the next order index
    const maxOrder = await sql`
      SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM chapters
    `;
    const nextOrder = maxOrder[0]?.next_order || 1;
    
    const result = await sql`
      INSERT INTO chapters (name, description, order_index)
      VALUES (${name.trim()}, ${description || null}, ${nextOrder})
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ error: 'Failed to create chapter' });
  }
});

// PUT update chapter
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, order_index } = req.body;
    
    const result = await sql`
      UPDATE chapters 
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        order_index = COALESCE(${order_index}, order_index)
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ error: 'Failed to update chapter' });
  }
});

// DELETE chapter
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await sql`
      DELETE FROM chapters WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    res.json({ message: 'Chapter deleted successfully', chapter: result[0] });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

export default router;
