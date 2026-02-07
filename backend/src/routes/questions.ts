import { Router, Request, Response } from "express";
import sql from "../database/connection";
import {
  CreateQuestionRequest,
  QuestionItem,
  CreateQuestionItemInput,
} from "../types";
import { requireAdmin } from "../middleware/auth";
import cache, { CACHE_KEYS, invalidateContentCache } from "../services/cache";

const router = Router();

// GET all questions (optionally filter by chapter, topic, difficulty, or tag)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { chapter_id, topic_id, difficulty, tag } = req.query;
    const cacheKey = `questions_list_${chapter_id || 'all'}_${topic_id || 'all'}_${difficulty || 'all'}_${tag || 'all'}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    let whereConditions = [];

    if (topic_id) {
      whereConditions.push(sql`q.topic_id = ${topic_id as string}`);
    }

    if (chapter_id) {
      whereConditions.push(sql`t.chapter_id = ${chapter_id as string}`);
    }

    if (difficulty) {
      whereConditions.push(sql`q.difficulty = ${difficulty as string}`);
    }

    if (tag) {
      whereConditions.push(sql`${tag as string} = ANY(q.tags)`);
    }

    let query = sql`
      SELECT q.*, t.name as topic_name, c.name as chapter_name
      FROM questions q
      LEFT JOIN topics t ON q.topic_id = t.id
      LEFT JOIN chapters c ON t.chapter_id = c.id
      WHERE 1=1
    `;

    for (const condition of whereConditions) {
      query = sql`${query} AND ${condition}`;
    }

    const questions = await query.then((result) => result).catch(() => []);
    
    cache.set(cacheKey, questions);
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// GET single question with its items (shuffled for students)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { shuffle } = req.query; // Add ?shuffle=true to get shuffled items
    
    const cacheKey = CACHE_KEYS.QUESTION_DETAIL(id);
    let questionData: any = cache.get(cacheKey);

    if (!questionData) {
      const questions = await sql`
        SELECT q.*, t.name as topic_name, c.name as chapter_name
        FROM questions q
        LEFT JOIN topics t ON q.topic_id = t.id
        LEFT JOIN chapters c ON t.chapter_id = c.id
        WHERE q.id = ${id}
      `;

      if (questions.length === 0) {
        return res.status(404).json({ error: "Question not found" });
      }

      const items = await sql`
        SELECT id, question_id, item_text as text, image_url, correct_position, created_at
        FROM question_items 
        WHERE question_id = ${id}
        ORDER BY correct_position ASC
      `;

      questionData = {
        ...questions[0],
        items,
        itemCount: items.length,
      };
      
      cache.set(cacheKey, questionData);
    }

    // Process for student view if shuffle is requested
    if (shuffle === "true") {
      const responseData = { ...questionData };
      responseData.items = shuffleArray([...questionData.items]);
      // Remove correct_position from response when shuffled
      responseData.items = responseData.items.map(({ correct_position, ...item }: any) => item);
      return res.json(responseData);
    }

    res.json(questionData);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

// POST create new question with items
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      topic_id,
      title,
      description,
      explanation,
      time_limit,
      difficulty,
      tags,
      items,
    }: CreateQuestionRequest = req.body;

    if (!topic_id) {
      return res.status(400).json({ error: "topic_id is required" });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Question title is required" });
    }

    if (!items || !Array.isArray(items) || items.length < 2) {
      return res
        .status(400)
        .json({
          error: "At least 2 items are required for an ordering question",
        });
    }

    // Verify topic exists
    const topics = await sql`SELECT id FROM topics WHERE id = ${topic_id}`;
    if (topics.length === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Get next order index for questions in this topic
    const maxOrder = await sql`
      SELECT COALESCE(MAX(order_index), 0) + 1 as next_order 
      FROM questions 
      WHERE topic_id = ${topic_id}
    `;
    const nextOrder = maxOrder[0]?.next_order || 1;

    // Create the question
    const questionResult = await sql`
      INSERT INTO questions (
        topic_id, title, description, explanation, 
        time_limit, difficulty, tags, order_index
      )
      VALUES (
        ${topic_id}, ${title.trim()}, ${description || null}, ${explanation || null}, 
        ${time_limit || null}, ${difficulty || "medium"}, ${tags || null}, ${nextOrder}
      )
      RETURNING *
    `;

    const question = questionResult[0];

    // Create the items with their correct positions
    const createdItems: QuestionItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const itemInput = items[i];
      const text = typeof itemInput === "string" ? itemInput : itemInput.text;
      const imageUrl =
        typeof itemInput === "string" ? null : itemInput.image_url || null;

      const itemResult = await sql`
        INSERT INTO question_items (question_id, item_text, image_url, correct_position)
        VALUES (${question.id}, ${text.trim()}, ${imageUrl}, ${i + 1})
        RETURNING id, question_id, item_text as text, image_url, correct_position, created_at
      `;
      createdItems.push(itemResult[0] as QuestionItem);
    }

    invalidateContentCache();
    res.status(201).json({
      ...question,
      items: createdItems,
    });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
});

// PUT update question
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      explanation,
      time_limit,
      difficulty,
      tags,
      items,
    } = req.body;

    // Update question metadata
    const result = await sql`
      UPDATE questions 
      SET 
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        explanation = COALESCE(${explanation}, explanation),
        time_limit = COALESCE(${time_limit}, time_limit),
        difficulty = COALESCE(${difficulty}, difficulty),
        tags = COALESCE(${tags}, tags)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    // If items are provided, replace all items
    if (items && Array.isArray(items) && items.length >= 2) {
      // Delete existing items
      await sql`DELETE FROM question_items WHERE question_id = ${id}`;

      // Create new items
      const createdItems: QuestionItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const itemInput = items[i];
        const text = typeof itemInput === "string" ? itemInput : itemInput.text;
        const imageUrl =
          typeof itemInput === "string" ? null : itemInput.image_url || null;

        const itemResult = await sql`
          INSERT INTO question_items (question_id, item_text, image_url, correct_position)
          VALUES (${id}, ${text.trim()}, ${imageUrl}, ${i + 1})
          RETURNING id, question_id, item_text as text, image_url, correct_position, created_at
        `;
        createdItems.push(itemResult[0] as QuestionItem);
      }

      invalidateContentCache();
      return res.json({
        ...result[0],
        items: createdItems,
      });
    }

    // Return updated question with existing items
    const existingItems = await sql`
      SELECT id, question_id, item_text as text, image_url, correct_position, created_at
      FROM question_items 
      WHERE question_id = ${id}
      ORDER BY correct_position ASC
    `;

    invalidateContentCache();
    res.json({
      ...result[0],
      items: existingItems,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// DELETE question
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM questions WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    invalidateContentCache();
    res.json({ message: "Question deleted successfully", question: result[0] });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default router;
