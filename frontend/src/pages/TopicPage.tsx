import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTopic, startQuiz, getLeaderboard, Topic, LeaderboardEntry } from '../services/api';
import { AlertTriangle, ClipboardList, Play, Trophy, ArrowLeft, Clock, FileQuestion, Loader2, User } from 'lucide-react';

export default function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState(localStorage.getItem('quiz_nickname') || '');
  const navigate = useNavigate();

  useEffect(() => {
    if (topicId) {
      loadData();
    }
  }, [topicId]);

  async function loadData() {
    try {
      setLoading(true);
      const [topicData, leaderboardData] = await Promise.all([
        getTopic(topicId!),
        getLeaderboard(topicId!)
      ]);
      setTopic(topicData);
      setLeaderboard(leaderboardData);
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
    
    // Save nickname for future use
    if (nickname.trim()) {
      localStorage.setItem('quiz_nickname', nickname.trim());
    }

    try {
      setStarting(true);
      const session = await startQuiz(topicId, nickname.trim() || undefined);
      navigate(`/quiz/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start quiz');
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading topic...</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto my-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Topic Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This topic does not exist.'}</p>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const questionCount = topic.questions?.length || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <Link 
        to={`/chapter/${topic.chapter_id}`} 
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {topic.chapter_name || 'Chapter'}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center sm:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">{topic.name}</h1>
            {topic.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">{topic.description}</p>
            )}
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-8 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <FileQuestion className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{questionCount}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Questions</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">~{Math.ceil(questionCount * 1.5)} min</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Est. Time</div>
                </div>
              </div>
            </div>

            {questionCount === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Questions Yet</h2>
                <p className="text-gray-600 dark:text-gray-400">This topic doesn't have any questions yet.</p>
              </div>
            ) : (
              <div className="max-w-md mx-auto sm:mx-0">
                <div className="mb-6 group">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-indigo-600">
                    Your Nickname (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all text-gray-900 dark:text-white" 
                      placeholder="Enter name for leaderboard..."
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0"
                  onClick={handleStartQuiz}
                  disabled={starting}
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      <span>Start Quiz</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {topic.questions && topic.questions.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-indigo-500" />
                Questions Preview
              </h2>
              <div className="space-y-3">
                {topic.questions.map((question, index) => (
                  <div key={question.id} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold rounded-lg text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white truncate">{question.title}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          question.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          question.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {question.difficulty || 'Medium'}
                        </span>
                        {question.tags?.map(tag => (
                          <span key={tag} className="text-[11px] font-medium text-gray-400 dark:text-gray-500">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-24">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Leaderboard
          </h2>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No scores yet. Be the first!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div className={`flex-shrink-0 w-6 text-center font-black ${
                    index === 0 ? 'text-amber-500' : 
                    index === 1 ? 'text-gray-400' : 
                    index === 2 ? 'text-amber-700' : 
                    'text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white truncate">
                      {entry.student_nickname || 'Anonymous'}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      {new Date(entry.completed_at).toLocaleDateString()} • {Math.floor(entry.total_time)}s
                    </div>
                  </div>
                  <div className="flex-shrink-0 font-black text-indigo-600 dark:text-indigo-400">
                    {Math.round(entry.percentage)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}