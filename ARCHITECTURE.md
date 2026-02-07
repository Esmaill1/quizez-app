# 🏛️ Architecture & Database

This document details the system architecture, core logic, and database schema of the Ordering Quiz App.

## 🧠 Core Logic: Proximity Scoring Engine

The heart of this application is the **Proximity Scoring Engine** (`backend/src/services/scoringEngine.ts`). Unlike binary "correct/incorrect" grading, this system awards partial credit based on how close an item is to its correct position.

### The Algorithm
For each item in a submission:
1. Calculate `distance = abs(submitted_index - correct_index)`
2. Apply a multiplier based on distance:

| Distance | Multiplier | Credit | Status |
|:---:|:---:|:---:|:---|
| **0** | 1.00 | 100% | ✅ Perfect |
| **1** | 0.75 | 75% | 🟡 Almost |
| **2** | 0.50 | 50% | 🟠 Close |
| **3** | 0.25 | 25% | 🟠 Far |
| **4+** | 0.00 | 0% | ❌ Incorrect |

### Example
**Question**: Order items [A, B, C, D]
**Correct**: 1:A, 2:B, 3:C, 4:D
**Submitted**: 1:B, 2:A, 3:C, 4:D

- **Item A**: Submitted at 2, Correct is 1. Distance = 1. Score = 75%
- **Item B**: Submitted at 1, Correct is 2. Distance = 1. Score = 75%
- **Item C**: Submitted at 3, Correct is 3. Distance = 0. Score = 100%
- **Item D**: Submitted at 4, Correct is 4. Distance = 0. Score = 100%

**Total**: (7.5 + 7.5 + 10 + 10) / 40 = **87.5%**

---

## 🗄️ Database Schema

The application uses PostgreSQL with the following relational schema.

### Content Hierarchy
The static content is organized in a strict hierarchy: `Chapter` -> `Topic` -> `Question` -> `QuestionItems`.

#### 1. `chapters`
High-level categories (e.g., "Math", "Science").
- `id` (UUID, PK)
- `name` (VARCHAR)
- `description` (TEXT)
- `order_index` (INT)

#### 2. `topics`
Sub-categories within a chapter.
- `id` (UUID, PK)
- `chapter_id` (UUID, FK -> chapters)
- `name` (VARCHAR)

#### 3. `questions`
The actual ordering tasks.
- `id` (UUID, PK)
- `topic_id` (UUID, FK -> topics)
- `title` (VARCHAR)
- `difficulty` (ENUM: 'easy', 'medium', 'hard')
- `time_limit` (INT, seconds)
- `explanation` (TEXT) - Shown after submission

#### 4. `question_items`
The individual draggable items for a question.
- `id` (UUID, PK)
- `question_id` (UUID, FK -> questions)
- `item_text` (TEXT)
- `correct_position` (INT) - The truth for grading (1-based)

---

### Session & Scoring Data
User progress is tracked via "Sessions".

#### 5. `quiz_sessions`
Represents a user taking a specific topic quiz.
- `id` (UUID, PK)
- `student_session_id` (VARCHAR) - Browser fingerprint/localStorage ID
- `topic_id` (UUID, FK)
- `current_question_index` (INT)
- `total_score` (DECIMAL)
- `is_completed` (BOOLEAN)

#### 6. `student_answers`
A record of a user submitting an answer for a specific question.
- `id` (UUID, PK)
- `quiz_session_id` (UUID, FK)
- `question_id` (UUID, FK)
- `submitted_at` (TIMESTAMP)
- `time_taken` (INT)
- `percentage` (DECIMAL)

#### 7. `student_answer_items`
Granular detail of where the user placed *each* item.
- `student_answer_id` (UUID, FK)
- `question_item_id` (UUID, FK)
- `submitted_position` (INT)
- `correct_position` (INT)
- `distance` (INT)
- `points_earned` (DECIMAL)

---

## 🔄 Data Flow

1. **Start Quiz**: Frontend calls `POST /api/quiz/start`. Backend creates a `quiz_sessions` record.
2. **Get Question**: `GET /api/quiz/:session/current` fetches the next question based on `current_question_index`. Items are **shuffled** before sending to frontend.
3. **Submit**: `POST /api/quiz/:session/submit`. Backend receives item IDs in submitted order.
    - `scoringEngine` calculates score.
    - Records saved to `student_answers` and `student_answer_items`.
    - Session stats (`total_score`, `current_question_index`) updated.
4. **Results**: `GET /api/quiz/:session/results` aggregates all answers for the session.
