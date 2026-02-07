# 📚 Ordering Quiz App

A modern, full-stack interactive quiz application designed for **ordering/ranking questions**.

![Quiz App](https://img.shields.io/badge/React-18-blue) ![Tailwind-4-cyan] ![Node.js-Express-green] ![PostgreSQL-Neon-purple]

## ✨ Key Features

- **Proximity-Based Scoring**: Get partial credit for being "close" to the correct order.
- **Drag & Drop UI**: Smooth, intuitive interface using `@dnd-kit`.
- **Real-time Feedback**: Instant detailed breakdown of your answers.
- **Modern UI**: Built with Tailwind CSS v4 and Lucide Icons.
- **Dark Mode**: Fully supported out of the box.

## 🚀 Quick Start

1.  **Install**: `npm install` (Installs both frontend & backend)
2.  **Setup DB**: 
    - Create `backend/.env` with your `DATABASE_URL`.
    - Run `npm run db:migrate` and `npm run seed`.
3.  **Run**: `npm run dev`
    - Frontend: http://localhost:5173
    - Backend: http://localhost:3001

## 📖 Documentation

- **[Developer Guide](DEVELOPER_GUIDE.md)**: Setup, testing, and contribution guide.
- **[Architecture](ARCHITECTURE.md)**: Deep dive into the Scoring Engine and Database Schema.
- **[API Reference](API_REFERENCE.md)**: Endpoints and payload examples.

## 🏗️ Project Structure

This is a **monorepo** containing:
- **/frontend**: React + Vite + Tailwind CSS application.
- **/backend**: Express + TypeScript API + Scoring Logic.

## 🤝 Contributing

See the [Developer Guide](DEVELOPER_GUIDE.md) for details on how to add new features or fix bugs.

---
*Built with ❤️ for better learning assessment.*