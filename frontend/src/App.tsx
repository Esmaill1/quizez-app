import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ChapterPage from './pages/ChapterPage';
import TopicPage from './pages/TopicPage';
import QuizFlowPage from './pages/QuizFlowPage';
import QuizResultsPage from './pages/QuizResultsPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { isAuthenticated } from './services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="chapter/:chapterId" element={<ChapterPage />} />
        <Route path="topic/:topicId" element={<TopicPage />} />
        <Route path="quiz/:sessionId" element={<QuizFlowPage />} />
        <Route path="results/:sessionId" element={<QuizResultsPage />} />
        <Route path="admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
