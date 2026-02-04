const API_BASE = '/api';

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
  chapter_name?: string;
  question_count?: number;
  questions?: Question[];
}

export interface Question {
  id: string;
  topic_id: string;
  title: string;
  description?: string;
  topic_name?: string;
  chapter_name?: string;
  order_index: number;
  items?: QuestionItem[];
  itemCount?: number;
}

export interface QuestionItem {
  id: string;
  question_id: string;
  text: string;
  correct_position?: number;
}

export interface SubmissionResult {
  answerId: string;
  score: {
    earned: number;
    maximum: number;
    percentage: number;
  };
  summary: {
    emoji: string;
    message: string;
    encouragement: string;
  };
  itemResults: ItemResult[];
}

export interface ItemResult {
  itemId: string;
  text: string;
  yourPosition: number;
  correctPosition: number;
  distance: number;
  pointsEarned: number;
  maxPoints: number;
  feedback: string;
}

export interface QuizSession {
  id: string;
  topic_id: string;
  student_session_id: string;
  current_question_index: number;
  total_questions: number;
  scores: QuestionScore[];
  is_completed: boolean;
  created_at: string;
  topic_name?: string;
  chapter_name?: string;
}

export interface QuestionScore {
  question_id: string;
  question_title: string;
  earned: number;
  maximum: number;
  percentage: number;
}

export interface QuizResults {
  session: QuizSession;
  totalScore: {
    earned: number;
    maximum: number;
    percentage: number;
  };
  questions: QuestionResultDetail[];
}

export interface QuestionResultDetail {
  question_id: string;
  question_title: string;
  earned: number;
  maximum: number;
  percentage: number;
  items: ItemResult[];
}

// Chapters API
export async function getChapters(): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/chapters`);
  if (!res.ok) throw new Error('Failed to fetch chapters');
  return res.json();
}

export async function getChapter(id: string): Promise<Chapter & { questions: Question[] }> {
  const res = await fetch(`${API_BASE}/chapters/${id}`);
  if (!res.ok) throw new Error('Failed to fetch chapter');
  return res.json();
}

export async function createChapter(data: { name: string; description?: string }): Promise<Chapter> {
  const res = await fetch(`${API_BASE}/chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create chapter');
  return res.json();
}

export async function deleteChapter(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chapters/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete chapter');
}

// Questions API
export async function getQuestions(chapterId?: string): Promise<Question[]> {
  const url = chapterId 
    ? `${API_BASE}/questions?chapter_id=${chapterId}`
    : `${API_BASE}/questions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function getQuestion(id: string, shuffle = true): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions/${id}?shuffle=${shuffle}`);
  if (!res.ok) throw new Error('Failed to fetch question');
  return res.json();
}

export async function createQuestion(data: {
  chapter_id: string;
  title: string;
  description?: string;
  items: string[];
}): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create question');
  }
  return res.json();
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete question');
}

// Answers API
export async function submitAnswer(data: {
  question_id: string;
  student_session_id: string;
  submitted_order: string[];
}): Promise<SubmissionResult> {
  const res = await fetch(`${API_BASE}/answers/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

export async function getAnswerResult(answerId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/answers/result/${answerId}`);
  if (!res.ok) throw new Error('Failed to fetch result');
  return res.json();
}

export async function getAnswerHistory(sessionId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/answers/history/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

// Session management
const SESSION_KEY = 'quiz_student_session';

export function getStudentSession(): string {
  let session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    session = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

// Topics API
export async function getTopics(chapterId?: string): Promise<Topic[]> {
  const url = chapterId 
    ? `${API_BASE}/topics?chapter_id=${chapterId}`
    : `${API_BASE}/topics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch topics');
  return res.json();
}

export async function getTopic(id: string): Promise<Topic> {
  const res = await fetch(`${API_BASE}/topics/${id}`);
  if (!res.ok) throw new Error('Failed to fetch topic');
  return res.json();
}

export async function createTopic(data: { 
  chapter_id: string; 
  name: string; 
  description?: string 
}): Promise<Topic> {
  const res = await fetch(`${API_BASE}/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create topic');
  return res.json();
}

export async function deleteTopic(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/topics/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete topic');
}

// Quiz Session API
export async function startQuiz(topicId: string): Promise<{ id: string; totalQuestions: number }> {
  const res = await fetch(`${API_BASE}/quiz/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      topic_id: topicId, 
      student_session_id: getStudentSession() 
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to start quiz');
  }
  const data = await res.json();
  // Map quizSessionId to id for consistency
  return {
    id: data.quizSessionId,
    totalQuestions: data.totalQuestions,
  };
}

export async function getCurrentQuestion(sessionId: string): Promise<{
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}> {
  const res = await fetch(`${API_BASE}/quiz/${sessionId}/current`);
  if (!res.ok) throw new Error('Failed to fetch current question');
  const data = await res.json();
  
  // Check if quiz is completed
  if (data.isCompleted) {
    throw new Error('QUIZ_COMPLETED');
  }
  
  // Map backend response to frontend interface
  return {
    question: data.question,
    questionNumber: data.currentQuestionIndex + 1, // Convert 0-indexed to 1-indexed
    totalQuestions: data.totalQuestions,
  };
}

export async function submitQuizAnswer(sessionId: string, submittedOrder: string[]): Promise<{
  result: SubmissionResult;
  isComplete: boolean;
  nextQuestion?: number;
}> {
  const res = await fetch(`${API_BASE}/quiz/${sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submitted_order: submittedOrder }),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  const data = await res.json();
  
  // Map backend response to frontend interface
  return {
    result: {
      answerId: sessionId, // Use sessionId as reference
      score: {
        earned: data.questionResult.score,
        maximum: data.questionResult.maxScore,
        percentage: data.questionResult.percentage,
      },
      summary: getScoreSummary(data.questionResult.percentage),
      itemResults: data.questionResult.itemResults.map((item: any) => ({
        itemId: item.text, // Use text as identifier
        text: item.text,
        yourPosition: item.yourPosition,
        correctPosition: item.correctPosition,
        distance: item.distance,
        pointsEarned: item.pointsEarned,
        maxPoints: item.maxPoints,
        feedback: item.feedback,
      })),
    },
    isComplete: data.quizProgress.isCompleted,
    nextQuestion: data.quizProgress.currentQuestionIndex + 1,
  };
}

// Helper function to generate score summary
function getScoreSummary(percentage: number): { emoji: string; message: string; encouragement: string } {
  if (percentage >= 90) {
    return { emoji: '🏆', message: 'Excellent!', encouragement: 'Outstanding work!' };
  } else if (percentage >= 70) {
    return { emoji: '⭐', message: 'Great Job!', encouragement: 'You really know your stuff!' };
  } else if (percentage >= 50) {
    return { emoji: '👍', message: 'Good Effort!', encouragement: 'Keep practicing, you\'re getting there!' };
  } else if (percentage >= 25) {
    return { emoji: '💪', message: 'Nice Try!', encouragement: 'Review and try again!' };
  } else {
    return { emoji: '📚', message: 'Keep Learning!', encouragement: 'Don\'t give up, practice makes perfect!' };
  }
}

export async function getQuizResults(sessionId: string): Promise<QuizResults> {
  const res = await fetch(`${API_BASE}/quiz/${sessionId}/results`);
  if (!res.ok) throw new Error('Failed to fetch results');
  const data = await res.json();
  
  // Map backend response to frontend interface
  return {
    session: {
      id: data.quizSessionId,
      topic_id: '', // Not needed for display
      student_session_id: '',
      current_question_index: data.totalQuestions,
      total_questions: data.totalQuestions,
      scores: [],
      is_completed: data.isCompleted,
      created_at: data.startedAt,
      topic_name: data.topicName,
      chapter_name: data.chapterName,
    },
    totalScore: {
      earned: data.totalScore,
      maximum: data.maxPossibleScore,
      percentage: data.percentage,
    },
    questions: data.questionResults.map((q: any) => ({
      question_id: q.questionTitle, // Use title as identifier
      question_title: q.questionTitle,
      earned: q.score,
      maximum: q.maxScore,
      percentage: q.percentage,
      items: q.itemResults.map((item: any) => ({
        itemId: item.text,
        text: item.text,
        yourPosition: item.yourPosition,
        correctPosition: item.correctPosition,
        distance: item.distance,
        pointsEarned: item.pointsEarned,
        maxPoints: item.maxPoints,
        feedback: item.distance === 0 ? 'Perfect!' : 
                  item.distance === 1 ? 'Close!' : 
                  item.distance === 2 ? 'Almost!' : 'Keep trying!',
      })),
    })),
  };
}
