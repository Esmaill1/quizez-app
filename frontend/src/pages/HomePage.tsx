import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getChapters, Chapter } from '../services/api';

export default function HomePage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    try {
      setLoading(true);
      const data = await getChapters();
      setChapters(data);
      setError(null);
    } catch (err) {
      setError('Failed to load chapters. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading chapters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadChapters} style={{ marginTop: '16px' }}>
          Try Again
        </button>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📖</div>
        <h2>No Chapters Yet</h2>
        <p>Chapters will appear here once they're added.</p>
        <Link to="/admin" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Go to Admin Panel
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Choose a Chapter</h1>
      <p className="page-subtitle">Select a chapter to practice ordering questions</p>

      <div className="grid">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="card chapter-card"
            onClick={() => navigate(`/chapter/${chapter.id}`)}
          >
            <h2 className="card-title">{chapter.name}</h2>
            {chapter.description && (
              <p className="card-description">{chapter.description}</p>
            )}
            <div className="question-count">
              📝 View Questions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
