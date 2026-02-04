import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTopic, startQuiz, Topic } from '../services/api';

export default function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (topicId) {
      loadTopic();
    }
  }, [topicId]);

  async function loadTopic() {
    try {
      setLoading(true);
      const data = await getTopic(topicId!);
      setTopic(data);
      setError(null);
    } catch (err) {
      setError('Failed to load topic.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartQuiz() {
    if (!topicId) return;
    
    try {
      setStarting(true);
      const session = await startQuiz(topicId);
      navigate(`/quiz/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start quiz');
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading topic...</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2>Topic Not Found</h2>
        <p>{error || 'This topic does not exist.'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const questionCount = topic.questions?.length || 0;

  return (
    <div>
      <Link to={`/chapter/${topic.chapter_id}`} className="btn btn-secondary" style={{ marginBottom: '16px' }}>
        ← Back to {topic.chapter_name || 'Chapter'}
      </Link>

      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>{topic.name}</h1>
        {topic.description && (
          <p className="page-subtitle" style={{ marginBottom: '24px' }}>{topic.description}</p>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '40px', 
          marginBottom: '32px',
          flexWrap: 'wrap'
        }}>
          <div className="stat-box">
            <div className="stat-value">{questionCount}</div>
            <div className="stat-label">Question{questionCount !== 1 ? 's' : ''}</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">~{Math.ceil(questionCount * 1.5)} min</div>
            <div className="stat-label">Estimated Time</div>
          </div>
        </div>

        {questionCount === 0 ? (
          <div className="empty-state" style={{ marginTop: '24px' }}>
            <div className="empty-state-icon">📋</div>
            <h2>No Questions Yet</h2>
            <p>This topic doesn't have any questions yet.</p>
          </div>
        ) : (
          <>
            <div className="info-box" style={{ 
              background: 'var(--gray-light)', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>📝 How it works:</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                <li>You'll answer {questionCount} ordering questions</li>
                <li>Drag items to arrange them in the correct order</li>
                <li>Get partial credit based on how close you are!</li>
                <li>See your results after each question</li>
                <li>View your final score and detailed breakdown at the end</li>
              </ul>
            </div>

            <button
              className="btn btn-primary btn-large"
              onClick={handleStartQuiz}
              disabled={starting}
              style={{ 
                padding: '16px 48px', 
                fontSize: '1.2rem',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              {starting ? (
                <>
                  <span className="spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></span>
                  Starting...
                </>
              ) : (
                '🚀 Start Quiz'
              )}
            </button>
          </>
        )}
      </div>

      {topic.questions && topic.questions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Questions Preview:
          </h2>
          {topic.questions.map((question, index) => (
            <div key={question.id} className="card" style={{ padding: '12px 16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: 'var(--gray-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}>
                  {index + 1}
                </span>
                <span>{question.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
