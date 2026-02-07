# 🛠️ Developer Guide

Welcome to the **Ordering Quiz App**! This guide will help you set up your development environment, understand the project structure, and start contributing.

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL Database**: We use [Neon](https://neon.tech) (serverless Postgres), but any PostgreSQL instance works.

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd quizez-app

# Install dependencies for both frontend and backend (from root)
npm install
```

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:

```env
# backend/.env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PORT=3001
NODE_ENV=development
OLLAMA_API_KEY=your_ollama_cloud_key_here
```

### 3. Database Setup

Initialize your database schema and seed it with sample data:

```bash
# Run from the root directory
npm run db:migrate
npm run seed
```

### 4. Run the App

Start both the backend API and frontend dev server concurrently:

```bash
# Run from the root directory
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

---

## 🏗️ Monorepo Structure

The project is organized as an npm workspace with two main packages:

```
quizez-app/
├── package.json          # Root scripts (install, dev, build)
├── backend/              # Express API
│   ├── src/
│   │   ├── database/     # Migrations & connection
│   │   ├── routes/       # API endpoints
│   │   └── services/     # Core logic (Scoring Engine)
│   └── package.json
└── frontend/             # React App
    ├── src/
    │   ├── components/   # Reusable UI (DraggableItem, Layout)
    │   ├── pages/        # Route views (QuizFlow, Admin)
    │   └── services/     # API client
    └── package.json
```

## 💻 Tech Stack

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database Driver**: `postgres` (via `postgres.js` style tagged template literals in `connection.ts`)
- **Dev Tool**: `ts-node-dev` for hot reloading

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Drag & Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`

---

## 🧪 Testing

Currently, manual testing is the primary method.
- **Admin Panel**: Create/Edit chapters, topics, and questions at `/admin`.
- **Quiz Flow**: Take a quiz to verify scoring logic and timer.
- **Results**: Check if the "Proximity Scoring" accurately reflects your answers.

## 📦 Deployment

### Build
Compile both frontend and backend:

```bash
npm run start
```
*This script builds the frontend to `frontend/dist` and compiles the backend TS to JS.*

### Serve
The backend is configured to serve the static frontend files in production:

```typescript
// backend/src/index.ts
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
```

---

## 🎨 UI Guidelines

- **Tailwind CSS**: Use utility classes for styling.
- **Dark Mode**: All components must support dark mode (`dark:` variant).
- **Icons**: Use `lucide-react` components (e.g., `<BookOpen />`, `<Trophy />`).
- **Responsiveness**: Mobile-first design. Ensure grids collapse to single columns on small screens.