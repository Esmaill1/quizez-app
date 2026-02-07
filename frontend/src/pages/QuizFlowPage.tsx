import { useState, useEffect, useCallback, useRef } from 'react';
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
import { AlertTriangle, Lightbulb, Clock, Trophy, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
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

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
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
      
      // Reset and start timer
      if (data.question.time_limit) {
        setTimeLeft(data.question.time_limit);
      } else {
        setTimeLeft(null);
      }
      startTimeRef.current = Date.now();
      setTimeTaken(0);
      
      setViewState('question');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load question');
    }
  }, [sessionId]);

  useEffect(() => {
    loadCurrentQuestion();
  }, [loadCurrentQuestion]);

  // Timer logic
  useEffect(() => {
    if (viewState === 'question' && timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timerRef.current!);
            if (prev === 0) handleSubmit(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewState, timeLeft]);

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
    if (!sessionId || items.length === 0 || submitting) return;

    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      const finalTimeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeTaken(finalTimeTaken);

      const submittedOrder = items.map((item) => item.id);
      const response = await submitQuizAnswer(sessionId, submittedOrder, finalTimeTaken);
      
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
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto my-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Oops!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Home
        </Link>
      </div>
    );
  }

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading question...</p>
      </div>
    );
  }

  const progress = ((questionNumber) / totalQuestions) * 100;

  if (viewState === 'feedback' && result) {
    const { score, summary, itemResults, explanation } = result;

    return (
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Question {questionNumber} of {totalQuestions}</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 p-8 text-center mb-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          <div className="text-5xl mb-4">{summary.emoji}</div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{summary.message}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{summary.encouragement}</p>
          
          <div className="flex items-center justify-center gap-6 mb-8">
             <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
               <Clock className="w-3.5 h-3.5" />
               <span>{timeTaken}s taken</span>
             </div>
          </div>
          
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-inner overflow-hidden" style={{
              background: `conic-gradient(rgb(99, 102, 241) ${score.percentage}%, rgb(229, 231, 235) 0)`
            }}>
              <div className="absolute inset-0 dark:hidden" style={{ background: `conic-gradient(transparent ${score.percentage}%, rgb(229, 231, 235) 0)` }}></div>
              <div className="absolute inset-0 hidden dark:block" style={{ background: `conic-gradient(transparent ${score.percentage}%, rgb(55, 65, 81) 0)` }}></div>
              
              <div className="relative w-28 h-28 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{Math.round(score.percentage)}%</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{score.earned}/{score.maximum}</span>
              </div>
            </div>
          </div>
        </div>

        {explanation && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 mb-8 border-l-4 border-indigo-500 flex gap-4">
            <Lightbulb className="w-6 h-6 text-indigo-500 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2">Explanation</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{explanation}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Item Breakdown</h3>
          <div className={`grid gap-4 ${itemResults.some(i => i.imageUrl) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {itemResults.map((item) => (
              <div 
                key={item.itemId}
                className={`flex rounded-2xl border-2 transition-colors ${
                  item.distance === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50' : 
                  item.distance <= 2 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50' : 
                  'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50'
                } ${item.imageUrl ? 'flex-col' : 'flex-row items-center p-4'}`}
              >
                {item.imageUrl && (
                  <div className="h-32 w-full rounded-t-xl overflow-hidden mb-0">
                    <img src={item.imageUrl} alt={item.text} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`flex-grow ${item.imageUrl ? 'p-4' : ''}`}>
                  <div className="font-bold text-gray-900 dark:text-white">{item.text}</div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                    Your: <span className="font-bold text-gray-700 dark:text-gray-200">#{item.yourPosition}</span> • Correct: <span className="font-bold text-emerald-600 dark:text-emerald-400">#{item.correctPosition}</span>
                  </div>
                </div>
                <div className={`${item.imageUrl ? 'px-4 pb-4 flex justify-between items-center' : 'text-right flex-shrink-0'}`}>
                  <div className={`font-black text-sm ${item.distance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    {item.pointsEarned} pts
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {item.feedback}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-200 dark:shadow-none hover:-translate-y-1 active:translate-y-0"
          onClick={handleNext}
        >
          {isComplete ? (
            <>
              <Trophy className="w-6 h-6" />
              <span>VIEW FINAL RESULTS</span>
            </>
          ) : (
            <>
              <span>NEXT QUESTION</span>
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Question {questionNumber} of {totalQuestions}</span>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider transition-all ${
                timeLeft < 10 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse border border-red-200 dark:border-red-800' 
                  : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}S</span>
              </div>
            )}
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(((questionNumber - 1) / totalQuestions) * 100)}%</span>
          </div>
        </div>
        <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex justify-between items-start gap-4 mb-4">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{question?.title}</h2>
          <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            question?.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
            question?.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {question?.difficulty || 'Medium'}
          </span>
        </div>
        {question?.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{question.description}</p>
        )}

        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 flex items-center gap-3 mb-8 border border-indigo-100 dark:border-indigo-800/50">
          <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
            <Lightbulb className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Drag and drop the items to arrange them in the correct order</span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((item, index) => (
                <DraggableItem key={item.id} item={item} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-none mt-8 hover:-translate-y-1 active:translate-y-0"
          onClick={handleSubmit}
          disabled={submitting || items.length === 0}
        >
          {submitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>CHECKING...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-6 h-6" />
              <span>SUBMIT ANSWER</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}