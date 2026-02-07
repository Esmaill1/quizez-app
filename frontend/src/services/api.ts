const API_BASE = '/api';

const TOKEN_KEY = 'quiz_admin_token';

// Admin Login
export async function login(username: string, password: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// AI Generation API
export async function getAIModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/ai/models`, {
    headers: getHeaders(true)
  });
  if (!res.ok) throw new Error('Failed to fetch AI models');
  return res.json();
}

export async function generateAIQuestion(topic: string, model?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/generate`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ topic, model }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'AI Generation failed');
  }
  
  return res.json();
}

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
  explanation?: string;
  time_limit?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
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
  image_url?: string;
  correct_position?: number;
}

export interface SubmissionResult {
  answerId: string;
  explanation?: string;
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
  imageUrl?: string;
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
  student_nickname?: string;
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
  explanation?: string;
  earned: number;
  maximum: number;
  percentage: number;
  timeTaken?: number;
  items: ItemResult[];
}

export interface LeaderboardEntry {
  student_nickname: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  completed_at: string;
  total_time: number;
}

// Helper to get headers
function getHeaders(admin = false) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-student-session': getStudentSessionSync() || '',
  };
  
  if (admin) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

// Chapters API
export async function getChapters(): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/chapters`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch chapters');
  return res.json();
}

export async function getChapter(id: string): Promise<Chapter & { topics: Topic[] }> {
  const res = await fetch(`${API_BASE}/chapters/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch chapter');
  return res.json();
}

export async function createChapter(data: { name: string; description?: string }): Promise<Chapter> {
  const res = await fetch(`${API_BASE}/chapters`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create chapter');
  return res.json();
}

export async function deleteChapter(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chapters/${id}`, { 
    method: 'DELETE',
    headers: getHeaders(true)
  });
  if (!res.ok) throw new Error('Failed to delete chapter');
}

// Questions API
export async function getQuestions(params?: { 
  chapter_id?: string; 
  topic_id?: string;
  difficulty?: string;
  tag?: string;
}): Promise<Question[]> {
  const query = new URLSearchParams();
  if (params?.chapter_id) query.append('chapter_id', params.chapter_id);
  if (params?.topic_id) query.append('topic_id', params.topic_id);
  if (params?.difficulty) query.append('difficulty', params.difficulty);
  if (params?.tag) query.append('tag', params.tag);

  const url = `${API_BASE}/questions?${query.toString()}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function getQuestion(id: string, shuffle = true): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions/${id}?shuffle=${shuffle}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch question');
  return res.json();
}

export interface CreateQuestionItemInput {
  text: string;
  image_url?: string;
}

export async function createQuestion(data: {
  topic_id: string;
  title: string;
  description?: string;
  explanation?: string;
  time_limit?: number;
  difficulty?: string;
  tags?: string[];
  items: (string | CreateQuestionItemInput)[];
}): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create question');
  }
  return res.json();
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/questions/${id}`, { 
    method: 'DELETE',
    headers: getHeaders(true)
  });
  if (!res.ok) throw new Error('Failed to delete question');
}

// Answers API
export async function submitAnswer(data: {
  question_id: string;
  student_session_id: string;
  submitted_order: string[];
  time_taken?: number;
}): Promise<SubmissionResult> {
  const res = await fetch(`${API_BASE}/answers/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

// Session management
const SESSION_KEY = 'quiz_student_session';

function getStudentSessionSync(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export async function getStudentSession(): Promise<string> {
  let session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    try {
      const res = await fetch(`${API_BASE}/auth/session`);
      if (res.ok) {
        const data = await res.json();
        session = data.sessionId;
        localStorage.setItem(SESSION_KEY, session!);
      } else {
        session = `student_${Date.now()}`;
        localStorage.setItem(SESSION_KEY, session);
      }
    } catch (e) {
      session = `student_${Date.now()}`;
      localStorage.setItem(SESSION_KEY, session);
    }
  }
  return session!;
}

// Topics API
export async function getTopics(chapterId?: string): Promise<Topic[]> {
  const url = chapterId 
    ? `${API_BASE}/topics?chapter_id=${chapterId}`
    : `${API_BASE}/topics`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch topics');
  return res.json();
}

export async function getTopic(id: string): Promise<Topic & { questions: Question[] }> {
  const res = await fetch(`${API_BASE}/topics/${id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch topic');
  return res.json();
}

export async function getLeaderboard(topicId: string): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_BASE}/topics/${topicId}/leaderboard`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function createTopic(data: { 
  chapter_id: string; 
  name: string; 
  description?: string 
}): Promise<Topic> {
  const res = await fetch(`${API_BASE}/topics`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create topic');
  return res.json();
}

export async function deleteTopic(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/topics/${id}`, { 
    method: 'DELETE',
    headers: getHeaders(true) 
  });
  if (!res.ok) throw new Error('Failed to delete topic');
}

// Quiz Session API
export async function startQuiz(topicId: string, nickname?: string): Promise<{ id: string; totalQuestions: number }> {
  const sessionId = await getStudentSession();
  
  const res = await fetch(`${API_BASE}/quiz/start`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      topic_id: topicId, 
      student_session_id: sessionId,
      student_nickname: nickname
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to start quiz');
  }
  const data = await res.json();
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
  const res = await fetch(`${API_BASE}/quiz/${sessionId}/current`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch current question');
  const data = await res.json();
  
  if (data.isCompleted) {
    throw new Error('QUIZ_COMPLETED');
  }
  
  return {
    question: data.question,
    questionNumber: data.currentQuestionIndex + 1,
    totalQuestions: data.totalQuestions,
  };
}

export async function submitQuizAnswer(sessionId: string, submittedOrder: string[], timeTaken?: number): Promise<{
  result: SubmissionResult;
  isComplete: boolean;
  nextQuestion?: number;
}> {
  const res = await fetch(`${API_BASE}/quiz/${sessionId}/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      submitted_order: submittedOrder,
      time_taken: timeTaken
    }),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  const data = await res.json();
  
  return {
    result: {
      answerId: sessionId,
      explanation: data.questionResult.explanation,
      score: {
        earned: data.questionResult.score,
        maximum: data.questionResult.maxScore,
        percentage: data.questionResult.percentage,
      },
      summary: getScoreSummary(data.questionResult.percentage),
      itemResults: data.questionResult.itemResults.map((item: any) => ({
        itemId: item.text,
        text: item.text,
        imageUrl: item.imageUrl,
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
  const res = await fetch(`${API_BASE}/quiz/${sessionId}/results`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch results');
  const data = await res.json();
  
  return {
    session: {
      id: data.quizSessionId,
      topic_id: '',
      student_session_id: '',
      student_nickname: data.studentNickname,
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
      question_id: q.questionTitle,
      question_title: q.questionTitle,
      explanation: q.explanation,
      earned: q.score,
      maximum: q.maxScore,
      percentage: q.percentage,
      timeTaken: q.timeTaken,
      items: q.itemResults.map((item: any) => ({
        itemId: item.text,
        text: item.text,
        imageUrl: item.imageUrl,
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
