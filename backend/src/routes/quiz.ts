import { Router, Request, Response } from 'express';
import sql from '../database/connection';
import { gradeSubmission, getScoreSummary } from '../services/scoringEngine';
import { getStudentSessionId, requireStudentSession } from '../middleware/auth';
import { invalidateLeaderboardCache } from '../services/cache';

const router = Router();

// Start a new quiz session for a topic
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { topic_id, student_nickname } = req.body;
    // Prefer session ID from header (secure), fallback to body (legacy/initial claim)
    const student_session_id = getStudentSessionId(req) || req.body.student_session_id;
    
    if (!topic_id) {
      return res.status(400).json({ error: 'topic_id is required' });
    }
    
    if (!student_session_id) {
      return res.status(400).json({ error: 'student_session_id is required' });
    }
    
    // Verify topic exists and get question count
    const topics = await sql`
      SELECT t.*, c.name as chapter_name
      FROM topics t
      JOIN chapters c ON t.chapter_id = c.id
      WHERE t.id = ${topic_id}
    `;
    
    if (topics.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    const questions = await sql`
      SELECT id FROM questions 
      WHERE topic_id = ${topic_id}
      ORDER BY order_index ASC
    `;
    
    if (questions.length === 0) {
      return res.status(400).json({ error: 'Topic has no questions' });
    }
    
    // Create quiz session
    const session = await sql`
      INSERT INTO quiz_sessions (topic_id, student_session_id, student_nickname, total_questions, current_question_index)
      VALUES (${topic_id}, ${student_session_id}, ${student_nickname || null}, ${questions.length}, 0)
      RETURNING *
    `;
    
    res.status(201).json({
      quizSessionId: session[0].id,
      topic: topics[0],
      totalQuestions: questions.length,
      currentQuestionIndex: 0,
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// Get current question in a quiz session
router.get('/:sessionId/current', requireStudentSession, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const studentSessionId = getStudentSessionId(req);
    
    // Get quiz session and verify ownership
    const sessions = await sql`
      SELECT qs.*, t.name as topic_name, t.chapter_id, c.name as chapter_name
      FROM quiz_sessions qs
      JOIN topics t ON qs.topic_id = t.id
      JOIN chapters c ON t.chapter_id = c.id
      WHERE qs.id = ${sessionId} AND qs.student_session_id = ${studentSessionId}
    `;
    
    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Quiz session not found or access denied' });
    }
    
    const session = sessions[0];
    
    if (session.is_completed) {
      return res.json({
        isCompleted: true,
        quizSessionId: sessionId,
        message: 'Quiz already completed',
      });
    }
    
    // Get the current question
    const questions = await sql`
      SELECT q.*, 
        (SELECT COUNT(*) FROM question_items qi WHERE qi.question_id = q.id) as item_count
      FROM questions q
      WHERE q.topic_id = ${session.topic_id}
      ORDER BY q.order_index ASC
      LIMIT 1 OFFSET ${session.current_question_index}
    `;
    
    if (questions.length === 0) {
      return res.status(400).json({ error: 'No more questions' });
    }
    
    const question = questions[0];
    
    // Get shuffled items for the question
    let items = await sql`
      SELECT id, question_id, item_text as text, image_url
      FROM question_items 
      WHERE question_id = ${question.id}
    `;
    
    // Shuffle items
    items = shuffleArray([...items]);
    
    res.json({
      quizSessionId: sessionId,
      topicName: session.topic_name,
      chapterName: session.chapter_name,
      currentQuestionIndex: session.current_question_index,
      totalQuestions: session.total_questions,
      question: {
        ...question,
        items,
      },
      isLastQuestion: session.current_question_index === session.total_questions - 1,
    });
  } catch (error) {
    console.error('Error getting current question:', error);
    res.status(500).json({ error: 'Failed to get current question' });
  }
});

// Submit answer for current question and move to next
router.post('/:sessionId/submit', requireStudentSession, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { submitted_order, time_taken } = req.body;
    const studentSessionId = getStudentSessionId(req);
    
    if (!submitted_order || !Array.isArray(submitted_order) || submitted_order.length === 0) {
      return res.status(400).json({ error: 'submitted_order is required' });
    }
    
    // Get quiz session and verify ownership
    const sessions = await sql`
      SELECT * FROM quiz_sessions 
      WHERE id = ${sessionId} AND student_session_id = ${studentSessionId}
    `;
    
    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Quiz session not found or access denied' });
    }
    
    const session = sessions[0];
    
    if (session.is_completed) {
      return res.status(400).json({ error: 'Quiz already completed' });
    }
    
    // Get the current question
    const questions = await sql`
      SELECT * FROM questions
      WHERE topic_id = ${session.topic_id}
      ORDER BY order_index ASC
      LIMIT 1 OFFSET ${session.current_question_index}
    `;
    
    if (questions.length === 0) {
      return res.status(400).json({ error: 'No question found' });
    }
    
    const question = questions[0];
    
    // Get question items
    const items = await sql`
      SELECT id, question_id, item_text as text, image_url, correct_position
      FROM question_items 
      WHERE question_id = ${question.id}
      ORDER BY correct_position ASC
    `;
    
    // Grade the submission
    const gradingResult = gradeSubmission({
      items: items as any,
      submittedOrder: submitted_order,
    });
    
    // Save the answer
    const answerResult = await sql`
      INSERT INTO student_answers (
        question_id, student_session_id, quiz_session_id, 
        total_score, max_possible_score, percentage, time_taken
      )
      VALUES (
        ${question.id}, ${session.student_session_id}, ${sessionId}, 
        ${gradingResult.totalScore}, ${gradingResult.maxPossibleScore}, 
        ${gradingResult.percentage}, ${time_taken || 0}
      )
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
    
    // Update quiz session
    const newIndex = session.current_question_index + 1;
    const newTotalScore = parseFloat(session.total_score) + gradingResult.totalScore;
    const newMaxScore = parseFloat(session.max_possible_score) + gradingResult.maxPossibleScore;
    const isCompleted = newIndex >= session.total_questions;
    const newPercentage = newMaxScore > 0 ? Math.round((newTotalScore / newMaxScore) * 10000) / 100 : 0;
    
    await sql`
      UPDATE quiz_sessions
      SET 
        current_question_index = ${newIndex},
        total_score = ${newTotalScore},
        max_possible_score = ${newMaxScore},
        percentage = ${newPercentage},
        is_completed = ${isCompleted},
        completed_at = ${isCompleted ? new Date().toISOString() : null}
      WHERE id = ${sessionId}
    `;
    
    if (isCompleted) {
      invalidateLeaderboardCache(session.topic_id);
    }
    
    // Return result for this question
    res.json({
      questionResult: {
        questionTitle: question.title,
        explanation: question.explanation,
        score: gradingResult.totalScore,
        maxScore: gradingResult.maxPossibleScore,
        percentage: gradingResult.percentage,
        itemResults: gradingResult.itemResults.map(item => ({
          text: item.itemText,
          imageUrl: items.find(i => i.id === item.itemId)?.image_url,
          yourPosition: item.submittedPosition,
          correctPosition: item.correctPosition,
          distance: item.distance,
          pointsEarned: item.pointsEarned,
          maxPoints: item.maxPoints,
          feedback: item.feedback,
        })),
      },
      quizProgress: {
        currentQuestionIndex: newIndex,
        totalQuestions: session.total_questions,
        runningScore: newTotalScore,
        runningMaxScore: newMaxScore,
        runningPercentage: newPercentage,
        isCompleted,
      },
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get final results for a completed quiz session
router.get('/:sessionId/results', requireStudentSession, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const studentSessionId = getStudentSessionId(req);
    
    // Get quiz session and verify ownership
    const sessions = await sql`
      SELECT qs.*, t.name as topic_name, t.chapter_id, c.name as chapter_name
      FROM quiz_sessions qs
      JOIN topics t ON qs.topic_id = t.id
      JOIN chapters c ON t.chapter_id = c.id
      WHERE qs.id = ${sessionId} AND qs.student_session_id = ${studentSessionId}
    `;
    
    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Quiz session not found or access denied' });
    }
    
    const session = sessions[0];
    
    // Get all answers for this quiz session
    const answers = await sql`
      SELECT sa.*, q.title as question_title, q.explanation, q.order_index
      FROM student_answers sa
      JOIN questions q ON sa.question_id = q.id
      WHERE sa.quiz_session_id = ${sessionId}
      ORDER BY q.order_index ASC
    `;
    
    // Get detailed results for each answer
    const questionResults = [];
    for (const answer of answers) {
      const itemResults = await sql`
        SELECT sai.*, qi.item_text as text, qi.image_url
        FROM student_answer_items sai
        JOIN question_items qi ON sai.question_item_id = qi.id
        WHERE sai.student_answer_id = ${answer.id}
        ORDER BY sai.correct_position ASC
      `;
      
      questionResults.push({
        questionTitle: answer.question_title,
        explanation: answer.explanation,
        score: parseFloat(answer.total_score),
        maxScore: parseFloat(answer.max_possible_score),
        percentage: parseFloat(answer.percentage),
        timeTaken: answer.time_taken,
        itemResults: itemResults.map(item => ({
          text: item.text,
          imageUrl: item.image_url,
          yourPosition: item.submitted_position,
          correctPosition: item.correct_position,
          distance: item.distance,
          pointsEarned: parseFloat(item.points_earned),
          maxPoints: parseFloat(item.max_points),
        })),
      });
    }
    
    const summary = getScoreSummary(parseFloat(session.percentage));
    
    res.json({
      quizSessionId: sessionId,
      topicName: session.topic_name,
      chapterName: session.chapter_name,
      totalScore: parseFloat(session.total_score),
      maxPossibleScore: parseFloat(session.max_possible_score),
      percentage: parseFloat(session.percentage),
      totalQuestions: session.total_questions,
      isCompleted: session.is_completed,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      studentNickname: session.student_nickname,
      summary,
      questionResults,
    });
  } catch (error) {
    console.error('Error getting quiz results:', error);
    res.status(500).json({ error: 'Failed to get quiz results' });
  }
});

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default router;