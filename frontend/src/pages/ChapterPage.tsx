import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getChapter, getTopics, Chapter, Topic } from '../services/api';

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (chapterId) {
      loadChapter();
    }
  }, [chapterId]);

  async function loadChapter() {
    try {
      setLoading(true);
      const [chapterData, topicsData] = await Promise.all([
        getChapter(chapterId!),
        getTopics(chapterId!)
      ]);
      setChapter(chapterData);
      setTopics(topicsData);
      setError(null);
    } catch (err) {
      setError('Failed to load chapter.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading topics...</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2>Chapter Not Found</h2>
        <p>{error || 'This chapter does not exist.'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Chapters
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="btn btn-secondary" style={{ marginBottom: '16px' }}>
        ← Back to Chapters
      </Link>

      <h1 className="page-title">{chapter.name}</h1>
      {chapter.description && (
        <p className="page-subtitle">{chapter.description}</p>
      )}

      {topics.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h2>No Topics Yet</h2>
          <p>Topics for this chapter will appear here.</p>
        </div>
      ) : (
        <div>
          <p className="page-subtitle">
            {topics.length} topic{topics.length !== 1 ? 's' : ''} available
          </p>
          
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="card question-card"
              onClick={() => navigate(`/topic/${topic.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div className="question-number">{index + 1}</div>
                <div>
                  <h3 className="card-title" style={{ marginBottom: '4px' }}>
                    {topic.name}
                  </h3>
                  {topic.description && (
                    <p className="card-description">{topic.description}</p>
                  )}
                  <p className="card-meta" style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--gray)' }}>
                    {topic.question_count || 0} question{(topic.question_count || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                View →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
