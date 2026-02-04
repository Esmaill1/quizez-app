# 🛠️ Quiz App Developer & AI Agent Guide

This document provides a deep-dive into the technical architecture, scoring algorithms, and development workflows of the Proximity-Based Quiz Application.

## 🏗️ System Architecture

The project is structured as an **NPM Workspace** for unified dependency management and execution.

- **Root**: Workspace management, global configuration, and orchestration scripts.
- **`backend/`**: Node.js/Express/TypeScript API.
  - **Database**: PostgreSQL (via `@neondatabase/serverless`).
  - **Scoring Engine**: Pure logic for calculating partial credit.
- **`frontend/`**: React/TypeScript SPA.
  - **Build Tool**: Vite.
  - **DND Logic**: `@dnd-kit` for accessible, performant sorting.

---

## 🧮 Proximity Scoring Algorithm

The core value proposition is the "Proximity Score". Instead of binary (Correct/Wrong), we use a linear decay model for points based on position distance.

### Mathematical Model
For any item $i$:
$$Distance = |SubmittedPosition_i - CorrectPosition_i|$$

**Point Distribution:**
- $d = 0$: $100\%$ points
- $d = 1$: $75\%$ points
- $d = 2$: $50\%$ points
- $d = 3$: $25\%$ points
- $d \ge 4$: $0\%$ points

**Implementation Location**: `backend/src/services/scoringEngine.ts`

---

## 💾 Data Model (ERD Summary)

| Entity | Purpose | Key Relationships |
| :--- | :--- | :--- |
| **Chapter** | Top-level container (e.g., "Science") | 1:N with Topics |
| **Topic** | Quizzable unit (e.g., "Water Cycle") | 1:N with Questions |
| **Question** | Specific ordering challenge | 1:N with QuestionItems |
| **QuestionItem** | Draggable element with `correct_position` | Part of a Question |
| **QuizSession** | Tracks student progress through a Topic | References Topic & StudentSession |
| **StudentAnswer** | Snapshot of a submitted question | Links to QuizSession & Question |

---

## 🚦 API Flow for Quiz Sessions

AI tools should follow this sequence to implement or test quiz logic:

1. **Start**: `POST /api/quiz/start` (Initializes `QuizSession`).
2. **Fetch**: `GET /api/quiz/:sessionId/current` (Retrieves current question + shuffled items).
3. **Submit**: `POST /api/quiz/:sessionId/submit` (Grades answer, saves to DB, increments `current_question_index`).
4. **Result**: `GET /api/quiz/:sessionId/results` (Summary of total score and feedback).

---

## 🛠️ Development Workflows

### Setup
```bash
npm run setup    # Installs root and workspace dependencies
npm run db:migrate # Set up schema
npm run seed     # Populate with sample chapters/questions
```

### Execution
- **Unified Dev Mode**: `npm run dev` (Runs backend on `:3001` and frontend on `:5173` with proxy).
- **Production Simulation**: `npm start` (Builds frontend and starts backend to serve it).

### Code Conventions
- **Naming**: `snake_case` for DB columns, `camelCase` for TypeScript variables/JSON keys.
- **Safety**: Always use `sql` tagged templates for queries to prevent SQL injection.
- **Types**: Shared types should be defined in `backend/src/types/index.ts`.

---

## 🤖 AI Agent Context

When working on this repo, observe these patterns:
- **Backend Routing**: Check `backend/src/routes/quiz.ts` for session logic.
- **Frontend State**: `QuizFlowPage.tsx` manages a three-state machine: `loading` | `question` | `feedback`.
- **Styling**: Uses CSS Variables in `frontend/src/styles/global.css`. Avoid hardcoding hex codes.

---

## 🧪 Testing Strategies
- **Algorithm Verification**: The scoring engine is pure functions; unit tests should target `gradeSubmission` in `scoringEngine.ts`.
- **Integration**: Verify session advancement by checking `current_question_index` after a successful `POST /submit`.
