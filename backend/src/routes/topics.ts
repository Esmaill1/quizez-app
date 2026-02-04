import { Router, Request, Response } from 'express';
import sql from '../database/connection';

const router = Router();

// GET all topics (optionally filter by chapter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { chapter_id } = req.query;
    
    let topics;
    if (chapter_id) {
      topics = await sql`
        SELECT t.*, c.name as chapter_name,
          (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count
        FROM topics t
        JOIN chapters c ON t.chapter_id = c.id
        WHERE t.chapter_id = ${chapter_id as string}
        ORDER BY t.order_index ASC, t.created_at ASC
      `;
    } else {
      topics = await sql`
        SELECT t.*, c.name as chapter_name,
          (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count
        FROM topics t
        JOIN chapters c ON t.chapter_id = c.id
        ORDER BY c.order_index ASC, t.order_index ASC, t.created_at ASC
      `;
    }
    
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// GET single topic with its questions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const topics = await sql`
      SELECT t.*, c.name as chapter_name
      FROM topics t
      JOIN chapters c ON t.chapter_id = c.id
      WHERE t.id = ${id}
    `;
    
    if (topics.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    const questions = await sql`
      SELECT q.*, 
        (SELECT COUNT(*) FROM question_items qi WHERE qi.question_id = q.id) as item_count
      FROM questions q
      WHERE q.topic_id = ${id}
      ORDER BY q.order_index ASC, q.created_at ASC
    `;
    
    res.json({
      ...topics[0],
      questions,
      questionCount: questions.length,
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// POST create new topic
router.post('/', async (req: Request, res: Response) => {
  try {
    const { chapter_id, name, description } = req.body;
    
    if (!chapter_id) {
      return res.status(400).json({ error: 'chapter_id is required' });
    }
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Topic name is required' });
    }
    
    // Verify chapter exists
    const chapters = await sql`SELECT id FROM chapters WHERE id = ${chapter_id}`;
    if (chapters.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Get next order index
    const maxOrder = await sql`
      SELECT COALESCE(MAX(order_index), 0) + 1 as next_order 
      FROM topics 
      WHERE chapter_id = ${chapter_id}
    `;
    const nextOrder = maxOrder[0]?.next_order || 1;
    
    const result = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter_id}, ${name.trim()}, ${description || null}, ${nextOrder})
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// PUT update topic
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, order_index } = req.body;
    
    const result = await sql`
      UPDATE topics 
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        order_index = COALESCE(${order_index}, order_index)
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// DELETE topic
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await sql`
      DELETE FROM topics WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json({ message: 'Topic deleted successfully', topic: result[0] });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

export default router;
