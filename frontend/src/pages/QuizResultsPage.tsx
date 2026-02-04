import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuizResults, QuizResults } from '../services/api';

export default function QuizResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadResults();
    }
  }, [sessionId]);

  async function loadResults() {
    try {
      setLoading(true);
      const data = await getQuizResults(sessionId!);
      setResults(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }

  function toggleQuestion(questionId: string) {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  }

  function getGradeInfo(percentage: number) {
    if (percentage >= 90) return { grade: 'A+', emoji: '🏆', color: '#27ae60', message: 'Outstanding!' };
    if (percentage >= 80) return { grade: 'A', emoji: '🌟', color: '#2ecc71', message: 'Excellent work!' };
    if (percentage >= 70) return { grade: 'B', emoji: '👏', color: '#3498db', message: 'Great job!' };
    if (percentage >= 60) return { grade: 'C', emoji: '👍', color: '#f39c12', message: 'Good effort!' };
    if (percentage >= 50) return { grade: 'D', emoji: '💪', color: '#e67e22', message: 'Keep practicing!' };
    return { grade: 'F', emoji: '📚', color: '#e74c3c', message: 'Study more and try again!' };
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2>Results Not Found</h2>
        <p>{error || 'Could not load quiz results.'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const { totalScore, questions, session } = results;
  const gradeInfo = getGradeInfo(totalScore.percentage);

  return (
    <div>
      <Link to="/" className="btn btn-secondary" style={{ marginBottom: '16px' }}>
        ← Back to Home
      </Link>

      {/* Main Results Card */}
      <div className="card" style={{ textAlign: 'center', padding: '40px', marginBottom: '24px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>{gradeInfo.emoji}</div>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>Quiz Complete!</h1>
        <p className="page-subtitle" style={{ marginBottom: '24px' }}>{session.topic_name}</p>
        
        {/* Score Circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: `conic-gradient(${gradeInfo.color} ${totalScore.percentage}%, var(--gray-light) 0)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: gradeInfo.color }}>
                {Math.round(totalScore.percentage)}%
              </span>
              <span style={{ fontSize: '1.2rem', color: 'var(--gray)', marginTop: '4px' }}>
                Grade: {gradeInfo.grade}
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '1.1rem', color: gradeInfo.color, fontWeight: 600, marginBottom: '16px' }}>
          {gradeInfo.message}
        </p>

        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '40px',
          flexWrap: 'wrap',
          marginTop: '24px',
          padding: '20px',
          background: 'var(--gray-light)',
          borderRadius: '12px'
        }}>
          <div className="stat-box">
            <div className="stat-value">{totalScore.earned}</div>
            <div className="stat-label">Points Earned</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{totalScore.maximum}</div>
            <div className="stat-label">Maximum Points</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{questions.length}</div>
            <div className="stat-label">Questions</div>
          </div>
        </div>
      </div>

      {/* Question-by-Question Breakdown */}
      <h2 style={{ marginBottom: '16px' }}>📊 Question Breakdown</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Click on any question to see the detailed item breakdown
      </p>

      {questions.map((q, index) => {
        const isExpanded = expandedQuestion === q.question_id;
        const qGrade = getGradeInfo(q.percentage);
        
        return (
          <div key={q.question_id} className="card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
            {/* Question Header - Clickable */}
            <div 
              onClick={() => toggleQuestion(q.question_id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '16px',
                background: isExpanded ? 'var(--gray-light)' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: qGrade.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginRight: '16px',
                flexShrink: 0
              }}>
                {index + 1}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{q.question_title}</h3>
              </div>
              
              <div style={{ 
                textAlign: 'right', 
                marginRight: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: qGrade.color }}>
                    {Math.round(q.percentage)}%
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                    {q.earned}/{q.maximum} pts
                  </div>
                </div>
              </div>
              
              <div style={{ 
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: 'var(--gray)'
              }}>
                ▼
              </div>
            </div>

            {/* Expanded Item Details */}
            {isExpanded && q.items && (
              <div style={{ 
                padding: '16px', 
                borderTop: '1px solid var(--gray-light)',
                background: 'rgba(0,0,0,0.02)'
              }}>
                {q.items.map((item) => (
                  <div 
                    key={item.itemId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      marginBottom: '8px',
                      background: item.distance === 0 ? 'rgba(46, 204, 113, 0.1)' : 
                                 item.distance <= 2 ? 'rgba(241, 196, 15, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${item.distance === 0 ? 'var(--success)' : 
                                   item.distance <= 2 ? '#f1c40f' : 'var(--error)'}`
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{item.text}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '2px' }}>
                        Your answer: #{item.yourPosition} • Correct: #{item.correctPosition}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: item.distance === 0 ? 'var(--success)' : 'var(--text)',
                        fontSize: '0.95rem'
                      }}>
                        +{item.pointsEarned}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                        {item.feedback}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Try Again Button */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link 
          to="/" 
          className="btn btn-primary btn-large"
          style={{ padding: '16px 48px' }}
        >
          🏠 Back to Home
        </Link>
      </div>
    </div>
  );
}
