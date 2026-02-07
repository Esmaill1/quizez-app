import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuizResults, QuizResults } from '../services/api';
import { 
  AlertTriangle, 
  BarChart3, 
  Home, 
  Trophy, 
  Star, 
  ThumbsUp, 
  Zap, 
  BookOpen, 
  ChevronDown, 
  ArrowLeft,
  Loader2,
  Target
} from 'lucide-react';

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
    if (percentage >= 90) return { grade: 'A+', icon: <Trophy className="w-16 h-16 text-amber-500" />, color: 'rgb(245, 158, 11)', message: 'Outstanding!' };
    if (percentage >= 80) return { grade: 'A', icon: <Star className="w-16 h-16 text-emerald-500" />, color: 'rgb(16, 185, 129)', message: 'Excellent work!' };
    if (percentage >= 70) return { grade: 'B', icon: <ThumbsUp className="w-16 h-16 text-blue-500" />, color: 'rgb(59, 130, 246)', message: 'Great job!' };
    if (percentage >= 60) return { grade: 'C', icon: <ThumbsUp className="w-16 h-16 text-indigo-500" />, color: 'rgb(99, 102, 241)', message: 'Good effort!' };
    if (percentage >= 50) return { grade: 'D', icon: <Zap className="w-16 h-16 text-orange-500" />, color: 'rgb(249, 115, 22)', message: 'Keep practicing!' };
    return { grade: 'F', icon: <BookOpen className="w-16 h-16 text-red-500" />, color: 'rgb(239, 68, 68)', message: 'Study more and try again!' };
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading results...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto my-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Could not load quiz results.'}</p>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const { totalScore, questions, session } = results;
  const gradeInfo = getGradeInfo(totalScore.percentage);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 p-8 text-center mb-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
            {gradeInfo.icon}
          </div>
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 leading-tight">Quiz Complete!</h1>
        <p className="text-lg text-indigo-600 dark:text-indigo-400 font-bold mb-8">{session.topic_name}</p>
        
        <div className="flex justify-center mb-10">
          <div className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-inner overflow-hidden" style={{
            background: `conic-gradient(${gradeInfo.color} ${totalScore.percentage}%, rgb(229, 231, 235) 0)`
          }}>
            <div className="absolute inset-0 dark:hidden" style={{ background: `conic-gradient(transparent ${totalScore.percentage}%, rgb(229, 231, 235) 0)` }}></div>
            <div className="absolute inset-0 hidden dark:block" style={{ background: `conic-gradient(transparent ${totalScore.percentage}%, rgb(55, 65, 81) 0)` }}></div>

            <div className="relative w-40 h-40 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center shadow-xl">
              <span className="text-5xl font-black leading-none" style={{ color: gradeInfo.color }}>
                {Math.round(totalScore.percentage)}%
              </span>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mt-2">
                Grade: {gradeInfo.grade}
              </span>
            </div>
          </div>
        </div>

        <p className="text-2xl font-bold mb-10" style={{ color: gradeInfo.color }}>
          {gradeInfo.message}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700/50">
          <div className="p-4">
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{totalScore.earned}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Points Earned</div>
          </div>
          <div className="p-4 border-y sm:border-y-0 sm:border-x border-gray-100 dark:border-gray-800">
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{totalScore.maximum}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Max Points</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{questions.length}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Questions</div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-indigo-500" />
          Question Breakdown
        </h2>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Click on any question to see your detailed performance breakdown
      </p>

      <div className="space-y-4 mb-12">
        {questions.map((q, index) => {
          const isExpanded = expandedQuestion === q.question_id;
          const qGrade = getGradeInfo(q.percentage);
          
          return (
            <div key={q.question_id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
              <div 
                onClick={() => toggleQuestion(q.question_id)}
                className={`flex items-center gap-4 p-5 cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-gray-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'}`}
              >
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-sm"
                  style={{ backgroundColor: qGrade.color }}
                >
                  {index + 1}
                </div>
                
                <div className="flex-grow min-w-0 pr-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate leading-snug">{q.question_title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                     <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500">
                       <Target className="w-3 h-3" />
                       <span>{q.earned}/{q.maximum} pts</span>
                     </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xl font-black leading-none" style={{ color: qGrade.color }}>
                      {Math.round(q.percentage)}%
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                </div>
              </div>

              {isExpanded && q.items && (
                <div className="p-5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    {q.items.map((item) => (
                      <div 
                        key={item.itemId}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                          item.distance === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50' : 
                          item.distance <= 2 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50' : 
                          'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50'
                        }`}
                      >
                        <div className="flex-grow min-w-0">
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{item.text}</div>
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Your: <span className="font-bold text-gray-700 dark:text-gray-200">#{item.yourPosition}</span> • Correct: <span className="font-bold text-emerald-600 dark:text-emerald-400">#{item.correctPosition}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`font-black text-sm ${item.distance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                            +{item.pointsEarned}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {item.feedback}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center py-8 border-t border-gray-100 dark:border-gray-800 mt-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-none hover:-translate-y-1 active:translate-y-0"
        >
          <Home className="w-6 h-6" />
          <span>BACK TO HOME</span>
        </Link>
      </div>
    </div>
  );
}
