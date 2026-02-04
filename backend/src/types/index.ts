// Types for the Quiz Application

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at: Date;
}

export interface Question {
  id: string;
  chapter_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: Date;
}

export interface QuestionItem {
  id: string;
  question_id: string;
  text: string;
  correct_position: number; // 1-indexed position in the correct order
  created_at: Date;
}

export interface StudentAnswer {
  id: string;
  question_id: string;
  student_session_id: string;
  submitted_at: Date;
  total_score: number;
  max_possible_score: number;
  percentage: number;
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

// API Request/Response Types
export interface CreateChapterRequest {
  name: string;
  description?: string;
}

export interface CreateQuestionRequest {
  chapter_id: string;
  title: string;
  description?: string;
  items: string[]; // Array of item texts in CORRECT order
}

export interface SubmitAnswerRequest {
  question_id: string;
  student_session_id: string;
  submitted_order: string[]; // Array of item IDs in the order student submitted
}

export interface QuestionWithItems extends Question {
  items: QuestionItem[];
}

export interface ChapterWithQuestions extends Chapter {
  questions: Question[];
}

export interface GradingResult {
  student_answer_id: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  item_results: ItemGradingResult[];
}

export interface ItemGradingResult {
  item_id: string;
  item_text: string;
  submitted_position: number;
  correct_position: number;
  distance: number;
  points_earned: number;
  max_points: number;
  feedback: string;
}
