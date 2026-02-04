import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import DraggableItem from '../components/DraggableItem';
import { 
  getCurrentQuestion, 
  submitQuizAnswer, 
  Question, 
  QuestionItem,
  SubmissionResult 
} from '../services/api';

type ViewState = 'question' | 'feedback' | 'loading';

export default function QuizFlowPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Minimal distance for instant response
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadCurrentQuestion = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setViewState('loading');
      const data = await getCurrentQuestion(sessionId);
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setItems(data.question.items || []);
      setResult(null);
      setViewState('question');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load question');
    }
  }, [sessionId]);

  useEffect(() => {
    loadCurrentQuestion();
  }, [loadCurrentQuestion]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  async function handleSubmit() {
    if (!sessionId || items.length === 0) return;

    try {
      setSubmitting(true);
      const submittedOrder = items.map((item) => item.id);
      const response = await submitQuizAnswer(sessionId, submittedOrder);
      
      setResult(response.result);
      setIsComplete(response.isComplete);
      setViewState('feedback');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (isComplete) {
      navigate(`/results/${sessionId}`);
    } else {
      loadCurrentQuestion();
    }
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  if (viewState === 'loading') {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading question...</p>
      </div>
    );
  }

  // Progress bar
  const progress = ((questionNumber) / totalQuestions) * 100;

  // Feedback view after submission
  if (viewState === 'feedback' && result) {
    const { score, summary, itemResults } = result;

    return (
      <div>
        <div className="progress-bar-container" style={{ marginBottom: '24px' }}>
          <div className="progress-info">
            <span>Question {questionNumber} of {totalQuestions}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="card result-card" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="result-emoji">{summary.emoji}</div>
          <h2 className="result-title">{summary.message}</h2>
          <p className="result-subtitle">{summary.encouragement}</p>
          
          <div className="score-display" style={{ marginTop: '20px' }}>
            <div className="score-circle" style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(var(--primary) ${score.percentage}%, var(--gray-light) 0)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(score.percentage)}%</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{score.earned}/{score.maximum}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Item Breakdown</h3>
          {itemResults.map((item) => (
            <div 
              key={item.itemId}
              className="item-result"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                background: item.distance === 0 ? 'rgba(46, 204, 113, 0.1)' : 
                           item.distance <= 2 ? 'rgba(241, 196, 15, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                borderRadius: '8px',
                borderLeft: `4px solid ${item.distance === 0 ? 'var(--success)' : 
                             item.distance <= 2 ? '#f1c40f' : 'var(--error)'}`
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{item.text}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginTop: '4px' }}>
                  You: #{item.yourPosition} → Correct: #{item.correctPosition}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: item.distance === 0 ? 'var(--success)' : 'var(--text)' }}>
                  {item.pointsEarned}/{item.maxPoints} pts
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                  {item.feedback}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={handleNext}
          style={{ width: '100%', padding: '16px' }}
        >
          {isComplete ? '🏆 View Final Results' : `Next Question →`}
        </button>
      </div>
    );
  }

  // Question view
  return (
    <div>
      <div className="progress-bar-container" style={{ marginBottom: '24px' }}>
        <div className="progress-info">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round(((questionNumber - 1) / totalQuestions) * 100)}% Complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}></div>
        </div>
      </div>

      <div className="card quiz-card">
        <h2 className="quiz-title">{question?.title}</h2>
        {question?.description && (
          <p className="quiz-description">{question.description}</p>
        )}

        <div className="instruction-box" style={{
          background: 'var(--gray-light)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <span style={{ marginRight: '8px' }}>💡</span>
          Drag and drop the items to arrange them in the correct order
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="items-container">
              {items.map((item, index) => (
                <DraggableItem key={item.id} item={item} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          className="btn btn-primary btn-large"
          onClick={handleSubmit}
          disabled={submitting || items.length === 0}
          style={{ width: '100%', marginTop: '24px', padding: '16px' }}
        >
          {submitting ? (
            <>
              <span className="spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></span>
              Checking...
            </>
          ) : (
            'Submit Answer ✓'
          )}
        </button>
      </div>
    </div>
  );
}
