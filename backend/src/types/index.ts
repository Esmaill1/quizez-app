// Types for the Quiz Application

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at: Date;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at: Date;
}

export interface Question {
  id: string;
  topic_id: string;
  title: string;
  description?: string;
  explanation?: string;
  time_limit?: number; // In seconds
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  order_index: number;
  created_at: Date;
}

export interface QuestionItem {
  id: string;
  question_id: string;
  text: string;
  image_url?: string;
  correct_position: number; // 1-indexed position in the correct order
  created_at: Date;
}

export interface StudentAnswer {
  id: string;
  question_id: string;
  student_session_id: string;
  quiz_session_id?: string;
  submitted_at: Date;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  time_taken?: number; // In seconds
}

export interface StudentAnswerItem {
  id: string;
  student_answer_id: string;
  question_item_id: string;
  submitted_position: number;
  correct_position: number;
  distance: number; // How far from correct position
  points_earned: number;
  max_points: number;
}

export interface QuizSession {
  id: string;
  topic_id: string;
  student_session_id: string;
  student_nickname?: string;
  started_at: Date;
  completed_at?: Date;
  current_question_index: number;
  total_questions: number;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  is_completed: boolean;
}

// API Request/Response Types
export interface CreateChapterRequest {
  name: string;
  description?: string;
}

export interface CreateTopicRequest {
  chapter_id: string;
  name: string;
  description?: string;
}

export interface CreateQuestionItemInput {
  text: string;
  image_url?: string;
}

export interface CreateQuestionRequest {
  topic_id: string;
  title: string;
  description?: string;
  explanation?: string;
  time_limit?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  items: (string | CreateQuestionItemInput)[]; // Support both plain text and detailed input
}

export interface SubmitAnswerRequest {
  question_id: string;
  student_session_id: string;
  submitted_order: string[]; // Array of item IDs in the order student submitted
  time_taken?: number; // In seconds
}

export interface QuestionWithItems extends Question {
  items: QuestionItem[];
}

export interface ChapterWithTopics extends Chapter {
  topics: Topic[];
}

export interface TopicWithQuestions extends Topic {
  questions: Question[];
}

export interface GradingResult {
  student_answer_id: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  explanation?: string;
  item_results: ItemGradingResult[];
}

export interface ItemGradingResult {
  item_id: string;
  item_text: string;
  item_image_url?: string;
  submitted_position: number;
  correct_position: number;
  distance: number;
  points_earned: number;
  max_points: number;
  feedback: string;
}