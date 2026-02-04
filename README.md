# 📚 Quiz App - Proximity-Based Ordering Questions

A modern, interactive quiz application that grades ordering questions using **proximity-based scoring**. Students receive partial credit based on how close their answers are to the correct positions, encouraging learning even when answers aren't perfect.

![Quiz App](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-purple)

---

## 🎯 Key Features

### Proximity-Based Scoring System
Unlike traditional all-or-nothing grading, this app rewards students based on **how close** their answers are to the correct position:

| Distance from Correct | Points Earned |
|-----------------------|---------------|
| 0 (Perfect)           | 100%          |
| 1 position away       | 75%           |
| 2 positions away      | 50%           |
| 3 positions away      | 25%           |
| 4+ positions away     | 0%            |

**Example:** For ranking A → B → C → D → E, if a student places 'A' in:
- Position 1 (correct): Full points ✓
- Position 2: 75% of points
- Position 3: 50% of points

### Other Features
- 🎨 **Drag & Drop Interface** - Intuitive ordering with smooth animations
- 📊 **Sequential Quiz Flow** - Complete topics question by question
- 📈 **Detailed Results** - See exactly how each item was scored
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🗂️ **Hierarchical Organization** - Chapters → Topics → Questions

---

## 🏗️ Architecture

```
quizez-app/
├── backend/                 # Express.js API Server
│   └── src/
│       ├── database/        # Database connection, migrations, seeds
│       ├── routes/          # API endpoints
│       ├── services/        # Business logic (scoring engine)
│       └── types/           # TypeScript interfaces
│
├── frontend/                # React SPA
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── services/        # API client
│       └── styles/          # Global CSS
│
└── database/                # Database documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (we use [Neon](https://neon.tech) - free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quizez-app
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment**
   
   Create `backend/.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   PORT=3001
   ```

4. **Setup database**
   ```bash
   cd backend
   
   # Run migrations (creates tables)
   npm run migrate
   
   # Seed example data (optional)
   npm run seed
   ```

5. **Build and run**
   ```bash
   # From project root
   cd frontend && npm run build
   cd ../backend && npm start
   ```

6. **Open the app**
   
   Navigate to `http://localhost:3001`

---

## 📖 Data Model

### Hierarchy
```
Chapter (e.g., "Science")
  └── Topic (e.g., "Nature Cycles")
       └── Question (e.g., "Order the water cycle stages")
            └── Question Items (e.g., "Evaporation", "Condensation", etc.)
```

### Database Schema

#### `chapters`
| Column      | Type         | Description                    |
|-------------|--------------|--------------------------------|
| id          | UUID         | Primary key                    |
| name        | VARCHAR(255) | Chapter name                   |
| description | TEXT         | Optional description           |
| order_index | INTEGER      | Display order                  |

#### `topics`
| Column      | Type         | Description                    |
|-------------|--------------|--------------------------------|
| id          | UUID         | Primary key                    |
| chapter_id  | UUID         | Foreign key to chapters        |
| name        | VARCHAR(255) | Topic name                     |
| description | TEXT         | Optional description           |
| order_index | INTEGER      | Display order within chapter   |

#### `questions`
| Column      | Type         | Description                    |
|-------------|--------------|--------------------------------|
| id          | UUID         | Primary key                    |
| topic_id    | UUID         | Foreign key to topics          |
| title       | VARCHAR(500) | Question title                 |
| description | TEXT         | Instructions for students      |
| order_index | INTEGER      | Display order within topic     |

#### `question_items`
| Column           | Type    | Description                    |
|------------------|---------|--------------------------------|
| id               | UUID    | Primary key                    |
| question_id      | UUID    | Foreign key to questions       |
| item_text        | TEXT    | The text to display            |
| correct_position | INTEGER | The correct order (1-based)    |

#### `quiz_sessions`
| Column                 | Type      | Description                    |
|------------------------|-----------|--------------------------------|
| id                     | UUID      | Primary key                    |
| topic_id               | UUID      | Topic being quizzed            |
| student_session_id     | VARCHAR   | Browser session identifier     |
| current_question_index | INTEGER   | Progress tracker               |
| total_questions        | INTEGER   | Total questions in topic       |
| total_score            | DECIMAL   | Running score                  |
| max_possible_score     | DECIMAL   | Running max possible           |
| is_completed           | BOOLEAN   | Quiz completion status         |

---

## 🔌 API Reference

### Chapters

| Method | Endpoint              | Description                |
|--------|-----------------------|----------------------------|
| GET    | `/api/chapters`       | List all chapters          |
| GET    | `/api/chapters/:id`   | Get chapter with topics    |
| POST   | `/api/chapters`       | Create a chapter           |
| DELETE | `/api/chapters/:id`   | Delete a chapter           |

### Topics

| Method | Endpoint                        | Description                |
|--------|---------------------------------|----------------------------|
| GET    | `/api/topics?chapter_id=:id`    | List topics in chapter     |
| GET    | `/api/topics/:id`               | Get topic with questions   |
| POST   | `/api/topics`                   | Create a topic             |
| DELETE | `/api/topics/:id`               | Delete a topic             |

### Questions

| Method | Endpoint                        | Description                |
|--------|---------------------------------|----------------------------|
| GET    | `/api/questions?topic_id=:id`   | List questions in topic    |
| GET    | `/api/questions/:id?shuffle=true` | Get question with shuffled items |
| POST   | `/api/questions`                | Create a question          |
| PUT    | `/api/questions/:id`            | Update a question          |
| DELETE | `/api/questions/:id`            | Delete a question          |

### Quiz Sessions

| Method | Endpoint                        | Description                |
|--------|---------------------------------|----------------------------|
| POST   | `/api/quiz/start`               | Start a new quiz session   |
| GET    | `/api/quiz/:sessionId/current`  | Get current question       |
| POST   | `/api/quiz/:sessionId/submit`   | Submit answer & get next   |
| GET    | `/api/quiz/:sessionId/results`  | Get final results          |

---

## 🎮 User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Home Page  │ ──▶ │   Chapter   │ ──▶ │    Topic    │
│ (Chapters)  │     │  (Topics)   │     │  (Preview)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                        [Start Quiz]
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Results   │ ◀── │  Feedback   │ ◀── │  Question   │
│  (Summary)  │     │ (Per Q)     │     │ (Drag&Drop) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   ▲
                           └───────────────────┘
                              [Next Question]
```

---

## 🧮 Scoring Engine

The scoring engine is located at `backend/src/services/scoringEngine.ts`.

### Algorithm

```typescript
function calculateScore(submittedPosition: number, correctPosition: number): number {
  const distance = Math.abs(submittedPosition - correctPosition);
  
  const multipliers = {
    0: 1.00,  // Perfect
    1: 0.75,  // Close
    2: 0.50,  // Partial
    3: 0.25,  // Far
  };
  
  return distance <= 3 ? POINTS_PER_ITEM * multipliers[distance] : 0;
}
```

### Example Calculation

**Question:** Order the planets by distance from the sun (Mercury, Venus, Earth, Mars)

**Student's Answer:** Venus, Mercury, Earth, Mars

| Item    | Submitted | Correct | Distance | Points (max 10) |
|---------|-----------|---------|----------|-----------------|
| Venus   | 1         | 2       | 1        | 7.5 (75%)       |
| Mercury | 2         | 1       | 1        | 7.5 (75%)       |
| Earth   | 3         | 3       | 0        | 10.0 (100%)     |
| Mars    | 4         | 4       | 0        | 10.0 (100%)     |

**Total Score:** 35/40 = **87.5%**

---

## 🛠️ Development

### Running in Development Mode

```bash
# Terminal 1: Backend with hot reload
cd backend
npm run dev

# Terminal 2: Frontend with Vite dev server
cd frontend
npm run dev
```

### Scripts

**Backend:**
| Script        | Description                    |
|---------------|--------------------------------|
| `npm start`   | Run production server          |
| `npm run dev` | Run with hot reload (nodemon)  |
| `npm run migrate` | Run database migrations    |
| `npm run seed`    | Seed example data          |

**Frontend:**
| Script        | Description                    |
|---------------|--------------------------------|
| `npm run dev` | Start Vite dev server          |
| `npm run build` | Build for production         |
| `npm run preview` | Preview production build   |

---

## 🧪 Sample Data

The seed script creates example content:

- **4 Chapters:** Daily Routine, Science, History, Math Steps
- **7 Topics:** Morning Activities, Cooking & Food, Nature Cycles, etc.
- **10 Questions:** Morning Routine, Water Cycle, Plant Growth, etc.

Run `npm run seed` in the backend folder to populate the database.

---

## 📝 Creating Questions

### Via API

```bash
curl -X POST http://localhost:3001/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "uuid-here",
    "title": "Order the rainbow colors",
    "description": "Arrange from top to bottom of the rainbow",
    "items": ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"]
  }'
```

### Item Order
Items are stored with `correct_position` based on the order you provide. The first item = position 1, second = position 2, etc.

---

## 🎨 Customization

### Styling
Global styles are in `frontend/src/styles/global.css`. Key CSS variables:

```css
:root {
  --primary: #6366f1;       /* Main brand color */
  --primary-dark: #4f46e5;  /* Hover states */
  --success: #10b981;       /* Correct answers */
  --error: #ef4444;         /* Wrong answers */
  --radius: 12px;           /* Border radius */
}
```

### Scoring Multipliers
Adjust in `backend/src/services/scoringEngine.ts`:

```typescript
const DISTANCE_MULTIPLIERS = {
  0: 1.0,   // Perfect
  1: 0.75,  // Adjust these values
  2: 0.50,  // to change scoring
  3: 0.25,  // strictness
};

const POINTS_PER_ITEM = 10;  // Points per item
```

---

## 🔒 Security Considerations

- Student sessions are browser-based (localStorage)
- No authentication system (add your own for production)
- All API endpoints are public (add middleware for production)
- Database credentials should be in environment variables

---

## 📦 Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, @dnd-kit          |
| Backend   | Node.js, Express, TypeScript                  |
| Database  | PostgreSQL (Neon Serverless)                  |
| Styling   | CSS3 with CSS Variables                       |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this project for educational purposes.

---

## 🙋 FAQ

**Q: Can I use a different database?**  
A: Yes! Replace the Neon serverless driver with `pg` for standard PostgreSQL, or adapt for MySQL/SQLite.

**Q: How do I add authentication?**  
A: Add middleware to Express routes and integrate with your auth provider (JWT, OAuth, etc.)

**Q: Can questions have images?**  
A: The current schema supports text only. Extend `question_items.item_text` to store image URLs or add an `item_image` column.

**Q: How do I deploy this?**  
A: Build the frontend, then deploy the backend to any Node.js host (Vercel, Railway, Render, etc.)

---

<div align="center">
  <p>Built with ❤️ for educators and students</p>
</div>
