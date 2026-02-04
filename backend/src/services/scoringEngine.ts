/**
 * Proximity Scoring Engine
 * 
 * This is the "magic" part that calculates partial credit based on how close
 * a student's answer is to the correct position.
 * 
 * Scoring Logic:
 * - Perfect position (distance = 0): 100% of points
 * - 1 position away: 75% of points
 * - 2 positions away: 50% of points
 * - 3 positions away: 25% of points
 * - 4+ positions away: 0% of points
 * 
 * This encourages students who "almost had it" while still rewarding precision.
 */

import { ItemGradingResult, GradingResult, QuestionItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Points awarded based on distance from correct position
const DISTANCE_MULTIPLIERS: Record<number, number> = {
  0: 1.0,    // Perfect - 100%
  1: 0.75,   // One off - 75%
  2: 0.50,   // Two off - 50%
  3: 0.25,   // Three off - 25%
};

// Maximum distance that still gets partial credit
const MAX_CREDIT_DISTANCE = 3;

// Points per item (base score)
const POINTS_PER_ITEM = 10;

export interface ScoringInput {
  items: QuestionItem[];
  submittedOrder: string[]; // Array of item IDs in submitted order
}

export interface ItemScore {
  itemId: string;
  itemText: string;
  submittedPosition: number;
  correctPosition: number;
  distance: number;
  pointsEarned: number;
  maxPoints: number;
  feedback: string;
}

/**
 * Calculate the score for a single item based on its distance from correct position
 */
export function calculateItemScore(
  submittedPosition: number,
  correctPosition: number,
  itemText: string,
  itemId: string
): ItemScore {
  const distance = Math.abs(submittedPosition - correctPosition);
  const maxPoints = POINTS_PER_ITEM;
  
  // Get multiplier based on distance (0 if too far)
  const multiplier = distance <= MAX_CREDIT_DISTANCE 
    ? (DISTANCE_MULTIPLIERS[distance] ?? 0) 
    : 0;
  
  const pointsEarned = Math.round(maxPoints * multiplier * 100) / 100;
  
  // Generate helpful feedback
  const feedback = generateFeedback(submittedPosition, correctPosition, itemText, distance);
  
  return {
    itemId,
    itemText,
    submittedPosition,
    correctPosition,
    distance,
    pointsEarned,
    maxPoints,
    feedback,
  };
}

/**
 * Generate human-friendly feedback for an item result
 */
function generateFeedback(
  submitted: number,
  correct: number,
  itemText: string,
  distance: number
): string {
  if (distance === 0) {
    return `✅ Perfect! "${itemText}" is in the correct position (#${correct}).`;
  }
  
  if (distance === 1) {
    return `🟡 Almost! "${itemText}" should be #${correct}, you put it at #${submitted}. Just one spot off!`;
  }
  
  if (distance === 2) {
    return `🟠 Close! "${itemText}" belongs at #${correct}, but you placed it at #${submitted}.`;
  }
  
  if (distance === 3) {
    return `🟠 "${itemText}" should be at position #${correct}. You put it at #${submitted}.`;
  }
  
  return `❌ "${itemText}" is at position #${submitted}, but it should be at #${correct}.`;
}

/**
 * Grade a complete answer submission
 * 
 * @param items - The question items with their correct positions
 * @param submittedOrder - Array of item IDs in the order the student submitted
 * @returns Complete grading result with scores and feedback
 */
export function gradeSubmission(input: ScoringInput): {
  itemResults: ItemScore[];
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
} {
  const { items, submittedOrder } = input;
  
  // Create a map of item ID to item for quick lookup
  const itemMap = new Map(items.map(item => [item.id, item]));
  
  const itemResults: ItemScore[] = [];
  let totalScore = 0;
  const maxPossibleScore = items.length * POINTS_PER_ITEM;
  
  // Grade each item based on its submitted position
  submittedOrder.forEach((itemId, index) => {
    const submittedPosition = index + 1; // 1-indexed
    const item = itemMap.get(itemId);
    
    if (!item) {
      console.error(`Item not found: ${itemId}`);
      return;
    }
    
    const score = calculateItemScore(
      submittedPosition,
      item.correct_position,
      item.text,
      item.id
    );
    
    itemResults.push(score);
    totalScore += score.pointsEarned;
  });
  
  // Calculate percentage (rounded to 2 decimal places)
  const percentage = maxPossibleScore > 0 
    ? Math.round((totalScore / maxPossibleScore) * 10000) / 100 
    : 0;
  
  return {
    itemResults,
    totalScore,
    maxPossibleScore,
    percentage,
  };
}

/**
 * Get a summary message based on the percentage score
 */
export function getScoreSummary(percentage: number): {
  emoji: string;
  message: string;
  encouragement: string;
} {
  if (percentage === 100) {
    return {
      emoji: '🏆',
      message: 'Perfect Score!',
      encouragement: 'Outstanding! You got everything in the exact right order!'
    };
  }
  
  if (percentage >= 80) {
    return {
      emoji: '🌟',
      message: 'Excellent!',
      encouragement: 'Great job! You have a strong understanding of the material.'
    };
  }
  
  if (percentage >= 60) {
    return {
      emoji: '👍',
      message: 'Good Work!',
      encouragement: 'You\'re on the right track. Review the items you missed.'
    };
  }
  
  if (percentage >= 40) {
    return {
      emoji: '📚',
      message: 'Keep Learning!',
      encouragement: 'You\'re making progress. Focus on the order relationships.'
    };
  }
  
  return {
    emoji: '💪',
    message: 'Practice More',
    encouragement: 'Don\'t give up! Review the material and try again.'
  };
}
