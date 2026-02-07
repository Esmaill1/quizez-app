import NodeCache from 'node-cache';

// TTL of 1 hour by default, check for expired keys every 2 minutes
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

export const CACHE_KEYS = {
  CHAPTERS: 'all_chapters',
  TOPICS: 'all_topics',
  TOPIC_DETAIL: (id: string) => `topic_${id}`,
  CHAPTER_DETAIL: (id: string) => `chapter_${id}`,
  QUESTIONS: (topicId: string) => `questions_${topicId}`,
  QUESTION_DETAIL: (id: string) => `question_${id}`,
  LEADERBOARD: (topicId: string) => `leaderboard_${topicId}`,
};

/**
 * Clear all cached data related to content (Chapters, Topics, Questions)
 * Call this after any Admin modification (POST/PUT/DELETE)
 */
export const invalidateContentCache = () => {
  const keys = cache.keys();
  const contentKeys = keys.filter(key => 
    key === CACHE_KEYS.CHAPTERS || 
    key === CACHE_KEYS.TOPICS || 
    key.startsWith('topic_') || 
    key.startsWith('chapter_') || 
    key.startsWith('questions_') || 
    key.startsWith('question_')
  );
  
  if (contentKeys.length > 0) {
    cache.del(contentKeys);
    console.log(`🧹 Cache invalidated: ${contentKeys.length} keys removed`);
  }
};

/**
 * Invalidate specifically leaderboard cache for a topic
 */
export const invalidateLeaderboardCache = (topicId: string) => {
  cache.del(CACHE_KEYS.LEADERBOARD(topicId));
};

export default cache;
