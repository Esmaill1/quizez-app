# 📡 API Reference

Base URL: `/api`

## 📚 Content Endpoints

### Chapters
- **GET** `/chapters` - List all chapters
- **GET** `/chapters/:id` - Get details for a chapter

### Topics
- **GET** `/topics?chapter_id={id}` - List topics (optional filter by chapter)
- **GET** `/topics/:id` - Get topic details including its questions

### Questions
- **GET** `/questions/:id` - Get a single question.
  - Query Param: `?shuffle=true` (randomizes item order for display)

---

## 🎮 Quiz Session Endpoints

These endpoints manage the active student experience.

### Start Quiz
**POST** `/quiz/start`
Starts a new session for a specific topic.
```json
// Request
{
  "topic_id": "uuid",
  "student_session_id": "browser-generated-id",
  "student_nickname": "optional-name"
}

// Response
{
  "quizSessionId": "uuid",
  "totalQuestions": 5,
  "currentQuestionIndex": 0
}
```

### Get Current Question
**GET** `/quiz/:sessionId/current`
Returns the next unanswered question for the session.
```json
// Response
{
  "question": {
    "id": "uuid",
    "title": "Order the planets...",
    "items": [ ...shuffled items... ]
  },
  "questionNumber": 1,
  "totalQuestions": 5
}
```

### Submit Answer
**POST** `/quiz/:sessionId/submit`
Grades the submission and advances the session.
```json
// Request
{
  "submitted_order": ["item_uuid_1", "item_uuid_2", ...],
  "time_taken": 45
}

// Response
{
  "result": {
    "score": { "earned": 35, "percentage": 87.5 },
    "summary": { "emoji": "🌟", "message": "Excellent!" },
    "explanation": "Mercury is closest, followed by...",
    "itemResults": [
      { "text": "Mercury", "distance": 0, "feedback": "Perfect!" },
      { "text": "Mars", "distance": 1, "feedback": "Close!" }
    ]
  },
  "isComplete": false
}
```

### Get Results
**GET** `/quiz/:sessionId/results`
Returns the final summary for a completed session.
```json
// Response
{
  "totalScore": { "percentage": 92.5 },
  "questions": [
    // Detailed breakdown of every question answered
  ]
}
```

---

## 🛡️ Admin / Management

### Create Content
- **POST** `/chapters`
- **POST** `/topics`
- **POST** `/questions`

### Delete Content
- **DELETE** `/chapters/:id`
- **DELETE** `/topics/:id`
- **DELETE** `/questions/:id`

> **Note:** Creation endpoints expect an `x-admin-secret` header in production, though currently open in dev mode.
