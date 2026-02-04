import { Router, Request, Response } from 'express';
import sql from '../database/connection';
import { SubmitAnswerRequest, QuestionItem } from '../types';
import { gradeSubmission, getScoreSummary, ItemScore } from '../services/scoringEngine';

const router = Router();

// POST submit an answer and get grading
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { question_id, student_session_id, submitted_order }: SubmitAnswerRequest = req.body;
    
    if (!question_id) {
      return res.status(400).json({ error: 'question_id is required' });
    }
    
    if (!student_session_id) {
      return res.status(400).json({ error: 'student_session_id is required' });
    }
    
    if (!submitted_order || !Array.isArray(submitted_order) || submitted_order.length === 0) {
      return res.status(400).json({ error: 'submitted_order must be a non-empty array of item IDs' });
    }
    
    // Fetch the question items
    const items = await sql`
      SELECT id, question_id, item_text as text, correct_position, created_at 
      FROM question_items 
      WHERE question_id = ${question_id}
      ORDER BY correct_position ASC
    ` as QuestionItem[];
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Question not found or has no items' });
    }
    
    // Verify all submitted item IDs exist
    const itemIds = new Set(items.map(i => i.id));
    const invalidIds = submitted_order.filter(id => !itemIds.has(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ error: `Invalid item IDs: ${invalidIds.join(', ')}` });
    }
    
    // Grade the submission using our scoring engine
    const gradingResult = gradeSubmission({
      items,
      submittedOrder: submitted_order,
    });
    
    // Save the answer to database
    const answerResult = await sql`
      INSERT INTO student_answers (question_id, student_session_id, total_score, max_possible_score, percentage)
      VALUES (${question_id}, ${student_session_id}, ${gradingResult.totalScore}, ${gradingResult.maxPossibleScore}, ${gradingResult.percentage})
      RETURNING *
    `;
    
    const studentAnswer = answerResult[0];
    
    // Save individual item results
    for (const itemResult of gradingResult.itemResults) {
      await sql`
        INSERT INTO student_answer_items 
        (student_answer_id, question_item_id, submitted_position, correct_position, distance, points_earned, max_points)
        VALUES (
          ${studentAnswer.id}, 
          ${itemResult.itemId}, 
          ${itemResult.submittedPosition}, 
          ${itemResult.correctPosition}, 
          ${itemResult.distance}, 
          ${itemResult.pointsEarned}, 
          ${itemResult.maxPoints}
        )
      `;
    }
    
    // Get summary message
    const summary = getScoreSummary(gradingResult.percentage);
    
    res.json({
      answerId: studentAnswer.id,
      score: {
        earned: gradingResult.totalScore,
        maximum: gradingResult.maxPossibleScore,
        percentage: gradingResult.percentage,
      },
      summary,
      itemResults: gradingResult.itemResults.map(item => ({
        itemId: item.itemId,
        text: item.itemText,
        yourPosition: item.submittedPosition,
        correctPosition: item.correctPosition,
        distance: item.distance,
        pointsEarned: item.pointsEarned,
        maxPoints: item.maxPoints,
        feedback: item.feedback,
      })),
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// GET answer history for a student session
router.get('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const answers = await sql`
      SELECT 
        sa.*,
        q.title as question_title,
        c.name as chapter_name
      FROM student_answers sa
      JOIN questions q ON sa.question_id = q.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE sa.student_session_id = ${sessionId}
      ORDER BY sa.submitted_at DESC
    `;
    
    res.json(answers);
  } catch (error) {
    console.error('Error fetching answer history:', error);
    res.status(500).json({ error: 'Failed to fetch answer history' });
  }
});

// GET detailed result for a specific answer
router.get('/result/:answerId', async (req: Request, res: Response) => {
  try {
    const { answerId } = req.params;
    
    const answers = await sql`
      SELECT 
        sa.*,
        q.title as question_title,
        q.description as question_description,
        c.name as chapter_name
      FROM student_answers sa
      JOIN questions q ON sa.question_id = q.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE sa.id = ${answerId}
    `;
    
    if (answers.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }
    
    const answer = answers[0];
    
    const itemResults = await sql`
      SELECT 
        sai.*,
        qi.item_text
      FROM student_answer_items sai
      JOIN question_items qi ON sai.question_item_id = qi.id
      WHERE sai.student_answer_id = ${answerId}
      ORDER BY sai.submitted_position ASC
    `;
    
    const summary = getScoreSummary(parseFloat(answer.percentage));
    
    res.json({
      ...answer,
      total_score: parseFloat(answer.total_score),
      max_possible_score: parseFloat(answer.max_possible_score),
      percentage: parseFloat(answer.percentage),
      summary,
      itemResults: itemResults.map(item => ({
        itemId: item.question_item_id,
        text: item.item_text,
        yourPosition: item.submitted_position,
        correctPosition: item.correct_position,
        distance: item.distance,
        pointsEarned: parseFloat(item.points_earned),
        maxPoints: parseFloat(item.max_points),
      })),
    });
  } catch (error) {
    console.error('Error fetching answer result:', error);
    res.status(500).json({ error: 'Failed to fetch answer result' });
  }
});

// GET stats for a question (admin view)
router.get('/stats/:questionId', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    
    const stats = await sql`
      SELECT 
        COUNT(*) as total_attempts,
        ROUND(AVG(percentage)::numeric, 2) as average_score,
        MAX(percentage) as highest_score,
        MIN(percentage) as lowest_score,
        COUNT(CASE WHEN percentage = 100 THEN 1 END) as perfect_scores
      FROM student_answers
      WHERE question_id = ${questionId}
    `;
    
    // Get most commonly misplaced items
    const itemStats = await sql`
      SELECT 
        qi.item_text,
        qi.correct_position,
        ROUND(AVG(sai.distance)::numeric, 2) as avg_distance,
        COUNT(CASE WHEN sai.distance = 0 THEN 1 END) as correct_count,
        COUNT(*) as total_count
      FROM student_answer_items sai
      JOIN question_items qi ON sai.question_item_id = qi.id
      WHERE qi.question_id = ${questionId}
      GROUP BY qi.id, qi.item_text, qi.correct_position
      ORDER BY avg_distance DESC
    `;
    
    res.json({
      overview: stats[0],
      itemStats,
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ error: 'Failed to fetch question stats' });
  }
});

export default router;
