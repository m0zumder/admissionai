import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThinkingDots, UpgradeModal } from '@/components/SharedUI';
import { ErrorReportModal } from '@/components/ErrorReportModal';
import { useXP } from '@/hooks/useXP';
import { useToast } from '@/hooks/use-toast';
import { Bookmark, Share2, Swords } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type MCQQuestion = {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
};

const IMPORTANCE_CONFIG: Record<string, { color: string; dot: string; label: string; desc: string }> = {
  critical: { color: 'bg-destructive text-destructive-foreground', dot: 'circle', dotColor: 'text-destructive', label: 'অতি গুরুত্বপূর্ণ', desc: 'বোর্ডে ৫+ বার এসেছে' },
  high: { color: 'bg-secondary text-secondary-foreground', dot: 'circle', dotColor: 'text-yellow-500', label: 'গুরুত্বপূর্ণ', desc: 'বোর্ডে ৩-৪ বার এসেছে' },
  medium: { color: 'bg-primary/20 text-primary', dot: 'circle', dotColor: 'text-green-500', label: 'মাঝারি', desc: 'বোর্ডে ১-২ বার এসেছে' },
  low: { color: 'bg-muted text-muted-foreground', dot: 'circle', dotColor: 'text-muted-foreground', label: 'কম গুরুত্বপূর্ণ', desc: 'কম আসে' },
};

const ImportanceBadge: React.FC<{ importance: string }> = ({ importance }) => {
  const cfg = IMPORTANCE_CONFIG[importance] || IMPORTANCE_CONFIG.medium;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
          <FontAwesomeIcon icon={cfg.dot as any} className={`mr-1 text-xs ${cfg.dotColor}`} /> {cfg.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{cfg.desc}</p>
        <p className="text-xs text-muted-foreground">গত ১০ বছরের board exam বিশ্লেষণ</p>
      </TooltipContent>
    </Tooltip>
  );
};

const MCQPage: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { addXP, checkAndAwardBadges } = useXP();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [step, setStep] = useState<'select' | 'quiz' | 'result'>('select');
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [highChanceOnly, setHighChanceOnly] = useState(false);
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);

  const classLevel = profile?.class_level || 'SSC';
  const targetExam = profile?.target_exam || '';
  const hscStream = targetExam.match(/\((science|humanities|commerce)\)/)?.[1] || '';

  useEffect(() => {
    let query = supabase.from('subjects').select('*').eq('class_level', classLevel);
    if (classLevel === 'HSC' && hscStream) {
      query = query.or(`stream.eq.${hscStream},stream.eq.compulsory`);
    }
    query.then(({ data }) => setSubjects(data || []));
  }, [classLevel, hscStream]);

  useEffect(() => {
    if (selectedSubject) {
      supabase.from('topics').select('*').eq('subject_id', selectedSubject)
        .order('chapter_number')
        .then(({ data }) => setTopics(data || []));
    }
  }, [selectedSubject]);

  // Track page visit
  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const entry = { title: 'MCQ অনুশীলন', path: '/mcq' };
    const filtered = existing.filter((e: any) => e.path !== entry.path);
    localStorage.setItem('recentlyViewed', JSON.stringify([entry, ...filtered].slice(0, 10)));
  }, []);

  const filteredTopics = highChanceOnly
    ? topics.filter(t => t.importance === 'critical' || t.importance === 'high')
    : topics;

  const checkLimit = () => {
    if (!profile) return false;
    if (profile.subscription_plan !== 'free') return true;
    if (profile.daily_mcq_count >= 10) { setShowUpgrade(true); return false; }
    return true;
  };

  const startQuiz = async () => {
    if (!checkLimit()) return;
    setLoading(true);
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name_en || '';
    const topicName = topics.find(t => t.id === selectedTopic)?.name_en || '';
    try {
      const { data, error } = await supabase.functions.invoke('generate-mcq', {
        body: { subject: subjectName, topic: topicName, classLevel, count: questionCount },
      });
      if (error) throw error;
      setQuestions(data.questions || []);
      setStep('quiz'); setCurrentQ(0); setScore(0); setSelectedAnswer(null); setShowExplanation(false);
    } catch {
      const sampleQs: MCQQuestion[] = Array.from({ length: questionCount }, (_, i) => ({
        question: `${subjectName} - ${topicName} থেকে নমুনা প্রশ্ন ${i + 1}`,
        options: [
          { text: 'বিকল্প ক', isCorrect: i % 4 === 0 },
          { text: 'বিকল্প খ', isCorrect: i % 4 === 1 },
          { text: 'বিকল্প গ', isCorrect: i % 4 === 2 },
          { text: 'বিকল্প ঘ', isCorrect: i % 4 === 3 },
        ],
        explanation: 'নমুনা ব্যাখ্যা।',
      }));
      setQuestions(sampleQs);
      setStep('quiz'); setCurrentQ(0); setScore(0); setSelectedAnswer(null); setShowExplanation(false);
    }
    setLoading(false);
  };

  const handleAnswer = async (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    const correct = questions[currentQ].options[idx].isCorrect;
    if (correct) {
      setScore(s => s + 1);
      await addXP(10);
    } else {
      await addXP(5);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) { finishQuiz(); } else {
      setCurrentQ(c => c + 1); setSelectedAnswer(null); setShowExplanation(false);
    }
  };

  const finishQuiz = async () => {
    setStep('result');
    const pct = (score / questions.length) * 100;
    if (profile) {
      await supabase.from('mcq_sessions').insert({
        user_id: profile.id, subject_id: selectedSubject, topic_id: selectedTopic,
        questions_attempted: questions.length, correct_answers: score, score_percentage: pct,
      });
      const today = new Date().toISOString().split('T')[0];
      const resetNeeded = profile.last_reset_date < today;
      await supabase.from('profiles').update({
        daily_mcq_count: resetNeeded ? questionCount : profile.daily_mcq_count + questionCount,
        last_reset_date: today,
      }).eq('id', profile.id);
      refreshProfile();
      checkAndAwardBadges();
    }
  };

  const handleDeepExplain = () => {
    const topicName = topics.find(t => t.id === selectedTopic)?.name_bn || '';
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name_bn || '';
    const query = topicName || subjectName || questions[currentQ]?.question?.slice(0, 60) || '';
    navigate(`/explain?topic=${encodeURIComponent(query)}`);
  };

  const handleBookmarkQuestion = async () => {
    if (!user) return;
    const q = questions[currentQ];
    await supabase.from('bookmarks' as any).insert({
      user_id: user.id,
      content_type: 'mcq',
      content_preview: q.question.slice(0, 200),
      subject: subjects.find(s => s.id === selectedSubject)?.name_bn || '',
    });
    toast({ title: '🔖 বুকমার্ক করা হয়েছে' });
  };

  const handleChallenge = async () => {
    if (!user || !selectedSubject) return;
    setChallengeLoading(true);
    const code = Math.random().toString(36).substring(2, 8);
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name_bn || '';

    // Generate 10 questions for the challenge
    const subjectEn = subjects.find(s => s.id === selectedSubject)?.name_en || '';
    let qs: MCQQuestion[] = [];
    try {
      const { data } = await supabase.functions.invoke('generate-mcq', {
        body: { subject: subjectEn, topic: 'General', classLevel, count: 10 },
      });
      qs = data?.questions || [];
    } catch {
      qs = Array.from({ length: 10 }, (_, i) => ({
        question: `${subjectEn} চ্যালেঞ্জ প্রশ্ন ${i + 1}`,
        options: [
          { text: 'বিকল্প ক', isCorrect: i % 4 === 0 },
          { text: 'বিকল্প খ', isCorrect: i % 4 === 1 },
          { text: 'বিকল্প গ', isCorrect: i % 4 === 2 },
          { text: 'বিকল্প ঘ', isCorrect: i % 4 === 3 },
        ],
        explanation: 'ব্যাখ্যা',
      }));
    }

    await supabase.from('challenges' as any).insert({
      code,
      creator_id: user.id,
      subject_name: subjectName,
      questions: qs,
    });

    setChallengeLoading(false);
    const link = `${window.location.origin}/challenge/${code}`;
    const whatsappMsg = `আমি তোমাকে ${subjectName} MCQ তে চ্যালেঞ্জ করছি! ১০টি প্রশ্নে আমার score beat করতে পারবে? এখানে click করো: ${link}`;
    
    toast({
      title: '⚔️ চ্যালেঞ্জ তৈরি হয়েছে!',
      description: 'লিংক কপি হয়েছে। বন্ধুকে পাঠাও!',
    });
    navigator.clipboard.writeText(link);
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
  };

  if (step === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const correctIdx = q.options.findIndex(o => o.isCorrect);
    const isWrong = selectedAnswer !== null && !q.options[selectedAnswer].isCorrect;
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">প্রশ্ন {currentQ + 1}/{questions.length}</span>
          <span className="text-sm text-muted-foreground">স্কোর: {score}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-lg font-medium mb-6">{q.question}</p>
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                const labels = ['ক', 'খ', 'গ', 'ঘ'];
                let bg = 'bg-muted hover:bg-muted/80 card-hover';
                let bounceClass = '';
                if (selectedAnswer !== null) {
                  if (idx === correctIdx) { bg = 'bg-green-500/20 border-green-500'; bounceClass = 'animate-answer-bounce'; }
                  else if (idx === selectedAnswer && !opt.isCorrect) { bg = 'bg-red-500/20 border-red-500'; bounceClass = 'animate-answer-bounce'; }
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={selectedAnswer !== null}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${bg} ${bounceClass}`}>
                    <span className="font-semibold mr-2">{labels[idx]})</span>{opt.text}
                    {selectedAnswer !== null && idx === correctIdx && ' ✓'}
                  </button>
                );
              })}
            </div>
            {/* Action buttons below question */}
            <div className="flex items-center gap-2 mt-4 text-xs">
              <Button variant="ghost" size="sm" onClick={handleBookmarkQuestion}><Bookmark className="h-4 w-4 mr-1" /> বুকমার্ক</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowErrorReport(true)}>⚠️ সমস্যা আছে</Button>
            </div>
          </CardContent>
        </Card>
        {showExplanation && (
          <Card className="border-primary/30 animate-fade-in">
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-1"><FontAwesomeIcon icon="book-open" className="mr-1 text-primary" /> ব্যাখ্যা:</p>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
              {isWrong && (
                <Button variant="outline" size="sm" className="mt-3 btn-ripple" onClick={handleDeepExplain}>
                  💡 বিস্তারিত বুঝতে চাই
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {selectedAnswer !== null && (
          <Button className="w-full btn-ripple" onClick={nextQuestion}>
            {currentQ + 1 >= questions.length ? 'ফলাফল দেখো' : 'পরের প্রশ্ন →'}
          </Button>
        )}
        <ErrorReportModal open={showErrorReport} onClose={() => setShowErrorReport(false)}
          questionText={q.question} subject={subjects.find(s => s.id === selectedSubject)?.name_bn} />
      </div>
    );
  }

  if (step === 'result') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pb-20 md:pb-0 animate-fade-in">
        <Card className="card-hover">
          <CardContent className="p-8">
            <div className="text-6xl mb-4 text-primary">{pct >= 70 ? <FontAwesomeIcon icon="champagne-glasses" /> : pct >= 40 ? <FontAwesomeIcon icon="thumbs-up" /> : <FontAwesomeIcon icon="dumbbell" />}</div>
            <h2 className="text-2xl font-bold mb-2">তোমার স্কোর</h2>
            <p className="text-4xl font-bold text-primary">{score}/{questions.length}</p>
            <p className="text-lg text-muted-foreground">({pct}%)</p>
            <p className="text-sm text-primary mt-2">+{score * 10 + (questions.length - score) * 5} XP অর্জিত! 🎯</p>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button className="flex-1 btn-ripple" onClick={() => { setStep('select'); setQuestions([]); }}>অন্য বিষয় পড়ো</Button>
          <Button variant="outline" className="flex-1 btn-ripple" onClick={startQuiz}>আবার চেষ্টা করো</Button>
        </div>
        <Button variant="outline" className="w-full" onClick={() => {
          const text = `আমি Admission AI তে ${subjects.find(s => s.id === selectedSubject)?.name_bn} MCQ তে ${score}/${questions.length} পেয়েছি! তুমিও চেষ্টা করো!`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.origin)}`, '_blank');
        }}>
          📤 WhatsApp এ Share করো
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon="pen-to-square" className="mr-2 text-primary" />MCQ অনুশীলন</h2>
      <p className="text-muted-foreground">বিষয় ও অধ্যায় বেছে নিয়ে MCQ প্র্যাক্টিস শুরু করো</p>

      {/* Subject selection */}
      <div>
        <p className="font-semibold mb-3">বিষয় নির্বাচন করো:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map((s) => (
            <button key={s.id} onClick={() => { setSelectedSubject(s.id); setSelectedTopic(null); }}
              className={`p-4 rounded-xl border text-left transition-all card-hover ${selectedSubject === s.id ? 'bg-primary text-primary-foreground border-primary shadow-lg' : 'bg-card border-border hover:border-primary/50'}`}>
              <span className="text-2xl block mb-1">{s.icon}</span>
              <span className="text-sm font-medium">{s.name_bn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Topic selection with importance badges */}
      {topics.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">অধ্যায় নির্বাচন করো:</p>
            <div className="flex items-center gap-2">
              <Label htmlFor="high-chance" className="text-xs text-muted-foreground">শুধু গুরুত্বপূর্ণ topics</Label>
              <Switch id="high-chance" checked={highChanceOnly} onCheckedChange={setHighChanceOnly} />
            </div>
          </div>
          <div className="space-y-2">
            {filteredTopics.map((t) => (
              <button key={t.id} onClick={() => setSelectedTopic(t.id)}
                className={`w-full p-3 rounded-lg border text-left transition-all card-hover ${selectedTopic === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm">অধ্যায় {t.chapter_number}: {t.name_bn}</span>
                  <ImportanceBadge importance={t.importance || 'medium'} />
                </div>
              </button>
            ))}
            {filteredTopics.length === 0 && highChanceOnly && (
              <p className="text-sm text-muted-foreground text-center py-4">কোনো গুরুত্বপূর্ণ topic পাওয়া যায়নি</p>
            )}
          </div>
        </div>
      )}

      {/* Count selector */}
      {selectedSubject && (
        <div>
          <p className="font-semibold mb-3">কতটি প্রশ্ন?</p>
          <div className="flex gap-3">
            {[5, 10, 20].map((n) => (
              <Button key={n} variant={questionCount === n ? 'default' : 'outline'} onClick={() => setQuestionCount(n)} className="btn-ripple">
                {n}টি
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedSubject && (
        <>
          <Button className="w-full btn-ripple" size="lg" onClick={startQuiz} disabled={loading}>
            {loading ? <ThinkingDots /> : <><FontAwesomeIcon icon="rocket" className="mr-2" />শুরু করো</>}
          </Button>
          <Button variant="outline" className="w-full" size="lg" onClick={handleChallenge} disabled={challengeLoading}>
            {challengeLoading ? <ThinkingDots /> : <><Swords className="h-5 w-5 mr-2" /> ⚔️ বন্ধুকে চ্যালেঞ্জ করো</>}
          </Button>
        </>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};

export default MCQPage;
