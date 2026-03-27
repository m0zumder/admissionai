import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ThinkingDots } from '@/components/SharedUI';
import { Clock, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type MCQQuestion = {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
  subjectLabel?: string;
};

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'সহজ 🟢' },
  { id: 'medium', label: 'মাঝারি 🟡' },
  { id: 'hard', label: 'কঠিন 🔴' },
  { id: 'mixed', label: 'মিশ্র ⚡' },
];

const QUESTION_COUNTS = [10, 25, 50, 100];
const TIME_OPTIONS = [15, 30, 45, 60, 90];

const CustomExamPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  // Step management
  const [step, setStep] = useState<'content' | 'params' | 'preview' | 'exam' | 'review'>('content');

  // Step 1: Content selection
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<Record<string, any[]>>({});
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [weakTopicFocus, setWeakTopicFocus] = useState(false);
  const [boardQuestions, setBoardQuestions] = useState(false);

  // Step 2: Parameters
  const [questionCount, setQuestionCount] = useState(25);
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [customTime, setCustomTime] = useState('');
  const [difficulty, setDifficulty] = useState('mixed');
  const [negativeMarking, setNegativeMarking] = useState(false);

  // Exam state
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [examStartTime, setExamStartTime] = useState(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [lastQuestionTime, setLastQuestionTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Previous session for comparison
  const [prevScore, setPrevScore] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      const classLevel = profile.class_level || 'SSC';
      supabase.from('subjects').select('*').eq('class_level', classLevel)
        .then(({ data }) => setSubjects(data || []));

      // Fetch previous mock score for comparison
      supabase.from('mcq_sessions').select('score_percentage')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) setPrevScore(data[0].score_percentage);
        });
    }
  }, [profile]);

  const loadTopics = async (subjectId: string) => {
    if (topics[subjectId]) return;
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('chapter_number');
    setTopics(prev => ({ ...prev, [subjectId]: data || [] }));
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      if (!prev.includes(id)) loadTopics(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    loadTopics(id);
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const actualTime = customTime ? parseInt(customTime) : timeMinutes;

  const startExam = async () => {
    if (selectedSubjects.length === 0) {
      toast({ title: 'বিষয় নির্বাচন করো', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const perSubject = Math.ceil(questionCount / selectedSubjects.length);
    const allQuestions: MCQQuestion[] = [];

    for (const subjectId of selectedSubjects) {
      const subj = subjects.find(s => s.id === subjectId);
      const subjectName = subj?.name_en || '';
      const subjectBn = subj?.name_bn || subjectName;

      // Get selected topics for this subject
      const subjectTopics = (topics[subjectId] || []).filter(t => selectedTopics.includes(t.id));
      const topicStr = subjectTopics.length > 0 ? subjectTopics.map(t => t.name_en).join(', ') : 'General';

      try {
        const { data, error } = await supabase.functions.invoke('generate-mcq', {
          body: {
            subject: subjectName,
            topic: topicStr,
            classLevel: profile?.class_level || 'SSC',
            count: perSubject,
            difficulty,
            weakTopicFocus,
            boardQuestions,
          },
        });
        if (error) throw error;
        const qs = (data.questions || []).map((q: any) => ({ ...q, subjectLabel: subjectBn }));
        allQuestions.push(...qs);
      } catch {
        for (let i = 0; i < perSubject; i++) {
          allQuestions.push({
            question: `${subjectBn} থেকে নমুনা প্রশ্ন ${i + 1}`,
            options: [
              { text: 'বিকল্প ক', isCorrect: i % 4 === 0 },
              { text: 'বিকল্প খ', isCorrect: i % 4 === 1 },
              { text: 'বিকল্প গ', isCorrect: i % 4 === 2 },
              { text: 'বিকল্প ঘ', isCorrect: i % 4 === 3 },
            ],
            explanation: 'নমুনা ব্যাখ্যা।',
            subjectLabel: subjectBn,
          });
        }
      }
    }

    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount);
    setQuestions(shuffled);
    setAnswers(new Array(shuffled.length).fill(null));
    setQuestionTimes(new Array(shuffled.length).fill(0));
    setTimeLeft(actualTime * 60);
    setCurrentQ(0);
    setFlagged(new Set());
    setExamStartTime(Date.now());
    setLastQuestionTime(Date.now());
    setStep('exam');
    setLoading(false);
  };

  useEffect(() => {
    if (step === 'exam' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); finishExam(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [step]);

  // Track time per question
  useEffect(() => {
    if (step === 'exam') {
      const now = Date.now();
      setQuestionTimes(prev => {
        const next = [...prev];
        // Don't count the first render
        if (lastQuestionTime > 0 && currentQ < next.length) {
          const elapsed = (now - lastQuestionTime) / 1000;
          // Add time to previous question
          const prevQ = currentQ === 0 ? 0 : currentQ;
          if (prevQ < next.length) next[prevQ] += 0; // tracked on switch
        }
        return next;
      });
      setLastQuestionTime(now);
    }
  }, [currentQ]);

  const handleQuestionChange = (newQ: number) => {
    const now = Date.now();
    setQuestionTimes(prev => {
      const next = [...prev];
      next[currentQ] = (next[currentQ] || 0) + (now - lastQuestionTime) / 1000;
      return next;
    });
    setLastQuestionTime(now);
    setCurrentQ(newQ);
  };

  const getScore = useCallback(() => {
    const correct = questions.reduce((acc, q, i) => answers[i] !== null && q.options[answers[i]!]?.isCorrect ? acc + 1 : acc, 0);
    const attempted = answers.filter(a => a !== null).length;
    const wrong = attempted - correct;
    const unanswered = questions.length - attempted;
    const negMark = negativeMarking ? 0.25 : 0;
    const deduction = wrong * negMark;
    const rawScore = correct;
    const finalScore = Math.max(0, rawScore - deduction);
    return { correct, wrong, attempted, unanswered, rawScore, deduction, finalScore };
  }, [questions, answers, negativeMarking]);

  const finishExam = useCallback(async () => {
    // Record final question time
    const now = Date.now();
    setQuestionTimes(prev => {
      const next = [...prev];
      next[currentQ] = (next[currentQ] || 0) + (now - lastQuestionTime) / 1000;
      return next;
    });

    if (timerRef.current) clearInterval(timerRef.current);
    setStep('review');
    if (profile) {
      const { correct, attempted } = getScore();
      const pct = questions.length > 0 ? (correct / questions.length) * 100 : 0;
      await supabase.from('mcq_sessions').insert({
        user_id: profile.id,
        questions_attempted: attempted,
        correct_answers: correct,
        score_percentage: pct,
      });
      refreshProfile();
    }
  }, [questions, answers, profile, getScore, currentQ, lastQuestionTime]);

  const toggleFlag = (idx: number) => {
    setFlagged(prev => { const next = new Set(prev); next.has(idx) ? next.delete(idx) : next.add(idx); return next; });
  };

  // Get subject-wise breakdown
  const getSubjectBreakdown = () => {
    const breakdown: Record<string, { correct: number; wrong: number; skipped: number; total: number }> = {};
    questions.forEach((q, i) => {
      const label = q.subjectLabel || 'অন্যান্য';
      if (!breakdown[label]) breakdown[label] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
      breakdown[label].total++;
      if (answers[i] === null) breakdown[label].skipped++;
      else if (q.options[answers[i]!]?.isCorrect) breakdown[label].correct++;
      else breakdown[label].wrong++;
    });
    return breakdown;
  };

  // Get weak topics from results
  const getWeakTopics = () => {
    const subjectWrong: Record<string, number> = {};
    questions.forEach((q, i) => {
      const label = q.subjectLabel || 'অন্যান্য';
      if (answers[i] !== null && !q.options[answers[i]!]?.isCorrect) {
        subjectWrong[label] = (subjectWrong[label] || 0) + 1;
      }
    });
    return Object.entries(subjectWrong)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([subj, count]) => `${subj} — ${count}টি ভুল`);
  };

  const shareToFacebook = () => {
    const { finalScore } = getScore();
    const pct = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0;
    const text = encodeURIComponent(`আমি পড়াশোনা AI তে Custom Exam এ ${pct}% পেয়েছি! 🎯\nতুমিও চেষ্টা করো: ${window.location.origin}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, '_blank');
  };

  // ========== STEP: CONTENT SELECTION ==========
  if (step === 'content') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold">🎯 Custom Exam Builder</h2>
          <p className="text-muted-foreground">তোমার মতো করে পরীক্ষা তৈরি করো</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {['বিষয়বস্তু', 'প্যারামিটার', 'প্রিভিউ'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{label}</span>
              {i < 2 && <div className="flex-1 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        {/* Subject selection */}
        <div>
          <p className="font-semibold mb-3">📚 বিষয় নির্বাচন করো:</p>
          <div className="space-y-2">
            {subjects.map((s) => (
              <div key={s.id}>
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 transition-all">
                  <Checkbox
                    checked={selectedSubjects.includes(s.id)}
                    onCheckedChange={() => toggleSubject(s.id)}
                  />
                  <span className="text-xl">{s.icon}</span>
                  <span className="font-medium flex-1">{s.name_bn}</span>
                  <button onClick={() => toggleExpand(s.id)} className="p-1 rounded hover:bg-muted">
                    {expandedSubjects.includes(s.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>

                {expandedSubjects.includes(s.id) && topics[s.id] && (
                  <div className="ml-10 mt-1 space-y-1 mb-2">
                    {topics[s.id].map((t) => (
                      <label key={t.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm">
                        <Checkbox
                          checked={selectedTopics.includes(t.id)}
                          onCheckedChange={() => toggleTopic(t.id)}
                        />
                        <span>অধ্যায় {t.chapter_number}: {t.name_bn}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {t.importance === 'high' ? '🔴' : t.importance === 'medium' ? '🟡' : '🟢'}
                        </Badge>
                      </label>
                    ))}
                    {topics[s.id].length === 0 && <p className="text-xs text-muted-foreground p-2">কোনো অধ্যায় পাওয়া যায়নি</p>}
                  </div>
                )}
              </div>
            ))}
            {subjects.length === 0 && <p className="text-muted-foreground text-sm">বিষয় লোড হচ্ছে...</p>}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
            <div>
              <Label className="font-semibold">দুর্বল topics থেকে বেশি প্রশ্ন দাও</Label>
              <p className="text-xs text-muted-foreground">weak_topics থেকে ৭০% প্রশ্ন আসবে</p>
            </div>
            <Switch checked={weakTopicFocus} onCheckedChange={setWeakTopicFocus} />
          </div>
          <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
            <div>
              <Label className="font-semibold">Previous board questions অন্তর্ভুক্ত করো</Label>
              <p className="text-xs text-muted-foreground">গত বছরের বোর্ড প্রশ্ন যোগ হবে</p>
            </div>
            <Switch checked={boardQuestions} onCheckedChange={setBoardQuestions} />
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={() => {
          if (selectedSubjects.length === 0) { toast({ title: 'কমপক্ষে একটি বিষয় নির্বাচন করো', variant: 'destructive' }); return; }
          setStep('params');
        }}>
          পরবর্তী: প্যারামিটার সেট করো →
        </Button>
      </div>
    );
  }

  // ========== STEP: PARAMETERS ==========
  if (step === 'params') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold">⚙️ পরীক্ষার সেটিংস</h2>
          <p className="text-muted-foreground">প্রশ্নসংখ্যা, সময়, এবং কঠিনতা নির্ধারণ করো</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {['বিষয়বস্তু', 'প্যারামিটার', 'প্রিভিউ'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i < 1 ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{label}</span>
              {i < 2 && <div className="flex-1 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        {/* Question count */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="font-semibold">📝 প্রশ্নসংখ্যা: {questionCount}টি</Label>
            <div className="flex gap-2 flex-wrap">
              {QUESTION_COUNTS.map(c => (
                <button key={c} onClick={() => setQuestionCount(c)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${questionCount === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                  {c}টি
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="font-semibold">⏱️ সময়: {customTime || timeMinutes} মিনিট</Label>
            <div className="flex gap-2 flex-wrap">
              {TIME_OPTIONS.map(t => (
                <button key={t} onClick={() => { setTimeMinutes(t); setCustomTime(''); }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${!customTime && timeMinutes === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                  {t} মিনিট
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">অথবা:</span>
              <Input type="number" value={customTime} onChange={e => setCustomTime(e.target.value)}
                placeholder="Custom মিনিট" className="w-32" min={5} max={180} />
            </div>
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="font-semibold">🎯 কঠিনতা:</Label>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTY_OPTIONS.map(d => (
                <button key={d.id} onClick={() => setDifficulty(d.id)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${difficulty === d.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Negative marking */}
        <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
          <div>
            <Label className="font-semibold">নেগেটিভ মার্কিং</Label>
            <p className="text-xs text-muted-foreground">সঠিক: +1, ভুল: -0.25</p>
          </div>
          <Switch checked={negativeMarking} onCheckedChange={setNegativeMarking} />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('content')}>← আগে</Button>
          <Button className="flex-1" size="lg" onClick={() => setStep('preview')}>
            পরবর্তী: প্রিভিউ →
          </Button>
        </div>
      </div>
    );
  }

  // ========== STEP: PREVIEW ==========
  if (step === 'preview') {
    const selectedSubjectNames = subjects.filter(s => selectedSubjects.includes(s.id)).map(s => s.name_bn);
    const diffLabel = DIFFICULTY_OPTIONS.find(d => d.id === difficulty)?.label || difficulty;

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold">📋 পরীক্ষার সারসংক্ষেপ</h2>
          <p className="text-muted-foreground">সব ঠিক থাকলে শুরু করো!</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {['বিষয়বস্তু', 'প্যারামিটার', 'প্রিভিউ'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground`}>
                {i < 2 ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{label}</span>
              {i < 2 && <div className="flex-1 h-0.5 bg-primary/30" />}
            </div>
          ))}
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-center">তোমার Custom Exam</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 rounded-lg bg-card">
                <p className="text-2xl font-bold text-primary">{questionCount}টি</p>
                <p className="text-xs text-muted-foreground">প্রশ্ন</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card">
                <p className="text-2xl font-bold text-primary">{actualTime} মিনিট</p>
                <p className="text-xs text-muted-foreground">সময়</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card">
                <p className="text-2xl font-bold text-primary">{selectedSubjects.length}টি</p>
                <p className="text-xs text-muted-foreground">বিষয়</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card">
                <p className="text-lg font-bold">{diffLabel}</p>
                <p className="text-xs text-muted-foreground">কঠিনতা</p>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="font-semibold">বিষয়:</span> {selectedSubjectNames.join(', ')}</p>
              {negativeMarking && <p className="text-destructive">⚠️ নেগেটিভ মার্কিং চালু (-0.25)</p>}
              {weakTopicFocus && <p className="text-primary">🎯 দুর্বল topics থেকে বেশি প্রশ্ন আসবে</p>}
              {boardQuestions && <p>📋 Board questions অন্তর্ভুক্ত</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('params')}>← আগে</Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" size="lg" onClick={startExam} disabled={loading}>
            {loading ? <ThinkingDots /> : 'পরীক্ষা শুরু করো 🚀'}
          </Button>
        </div>
      </div>
    );
  }

  // ========== EXAM IN PROGRESS ==========
  if (step === 'exam' && questions.length > 0) {
    const q = questions[currentQ];
    const isUrgent = timeLeft < 60;
    const liveScore = getScore();

    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-0 animate-fade-in">
        <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3 sticky top-0 z-10 flex-wrap gap-2">
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isUrgent ? 'text-destructive animate-pulse' : 'text-primary'}`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-primary font-semibold">+{liveScore.correct}</span>
            {negativeMarking && (
              <span className="text-destructive font-semibold">-{liveScore.deduction.toFixed(2)}</span>
            )}
            <span className="text-muted-foreground">{liveScore.attempted}/{questions.length}</span>
          </div>
          <Button variant="destructive" size="sm" onClick={finishExam}>পরীক্ষা শেষ করো</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">প্রশ্ন {currentQ + 1}</CardTitle>
                  {q.subjectLabel && <Badge variant="outline" className="text-xs">{q.subjectLabel}</Badge>}
                </div>
                <Button variant={flagged.has(currentQ) ? 'default' : 'ghost'} size="sm" onClick={() => toggleFlag(currentQ)}>
                  {flagged.has(currentQ) ? '🚩 চিহ্নিত' : '🏳️ চিহ্নিত করো'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-lg font-medium">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const labels = ['ক', 'খ', 'গ', 'ঘ'];
                  const isSelected = answers[currentQ] === idx;
                  return (
                    <button key={idx} onClick={() => { const n = [...answers]; n[currentQ] = isSelected ? null : idx; setAnswers(n); }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected ? 'bg-primary/15 border-primary ring-1 ring-primary' : 'bg-muted hover:bg-muted/80 border-border'}`}>
                      <span className="font-semibold mr-2">{labels[idx]})</span>{opt.text}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" disabled={currentQ === 0} onClick={() => handleQuestionChange(currentQ - 1)}>← আগের প্রশ্ন</Button>
                <Button className="flex-1" disabled={currentQ === questions.length - 1} onClick={() => handleQuestionChange(currentQ + 1)}>পরের প্রশ্ন →</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hidden md:block">
            <CardHeader className="pb-2"><CardTitle className="text-sm">প্রশ্ন নেভিগেটর</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((_, i) => {
                  let bg = 'bg-muted text-muted-foreground';
                  if (i === currentQ) bg = 'bg-primary text-primary-foreground ring-2 ring-primary/50';
                  else if (answers[i] !== null) bg = 'bg-primary/20 text-primary';
                  else if (flagged.has(i)) bg = 'bg-accent text-accent-foreground';
                  return <button key={i} onClick={() => handleQuestionChange(i)} className={`w-8 h-8 rounded text-xs font-semibold transition-all ${bg}`}>{i + 1}</button>;
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ========== REVIEW / RESULTS ==========
  if (step === 'review') {
    const { correct, wrong, unanswered, finalScore, deduction } = getScore();
    const pct = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0;
    const avgTimePerQ = questionTimes.length > 0 ? (questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length) : 0;
    const breakdown = getSubjectBreakdown();
    const weakTopicsList = getWeakTopics();
    const improvement = prevScore !== null ? pct - prevScore : null;

    // Estimated percentile (rough)
    const estimatedPercentile = Math.min(99, Math.max(1, Math.round(pct * 0.9 + 5)));

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
        {/* Score circle */}
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">{pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪'}</div>
            <h2 className="text-2xl font-bold mb-2">Custom Exam ফলাফল</h2>

            {/* Animated score gauge */}
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeDasharray={`${pct * 2.51} 251`}
                  className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <p className="text-3xl font-bold text-primary">{pct}%</p>
                  <p className="text-xs text-muted-foreground">{finalScore.toFixed(1)}/{questions.length}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              তুমি applicants এর শীর্ষ <span className="font-bold text-primary">{estimatedPercentile}%</span> এ আছো
            </p>

            {/* Comparison with previous */}
            {improvement !== null && (
              <div className={`mt-3 inline-block px-4 py-2 rounded-full text-sm font-semibold ${improvement >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {improvement >= 0 ? `আগের চেয়ে +${improvement}% উন্নতি 🚀` : `আগের চেয়ে ${improvement}% কম 📉`}
              </div>
            )}

            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-1.5 text-primary"><CheckCircle className="h-4 w-4" /> সঠিক: {correct}</div>
              <div className="flex items-center gap-1.5 text-destructive"><XCircle className="h-4 w-4" /> ভুল: {wrong}</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><AlertTriangle className="h-4 w-4" /> বাদ: {unanswered}</div>
            </div>
          </CardContent>
        </Card>

        {/* Time analysis */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-semibold">⏱️ সময় বিশ্লেষণ</p>
            <p className="text-2xl font-bold text-primary mt-2">গড়ে {avgTimePerQ.toFixed(1)} সেকেন্ড/প্রশ্ন</p>
          </CardContent>
        </Card>

        {/* Subject breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">📊 বিষয়ভিত্তিক বিশ্লেষণ</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(breakdown).map(([subj, data]) => (
                <div key={subj} className="flex items-center gap-3">
                  <span className="font-medium text-sm w-24 truncate">{subj}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                    <div className="bg-primary h-full transition-all" style={{ width: `${(data.correct / data.total) * 100}%` }} />
                    <div className="bg-destructive h-full transition-all" style={{ width: `${(data.wrong / data.total) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right">{data.correct}/{data.total} সঠিক</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Negative marking analysis */}
        {negativeMarking && deduction > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-center space-y-2">
              <p className="font-semibold">📊 নেগেটিভ মার্কিং বিশ্লেষণ</p>
              <p className="text-sm">ভুল: <span className="text-destructive font-bold">{wrong}টি</span> → হারিয়েছো: <span className="text-destructive font-bold">-{deduction.toFixed(2)}</span></p>
            </CardContent>
          </Card>
        )}

        {/* Weak topics */}
        {weakTopicsList.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2"><CardTitle className="text-base">📚 এই topics এ আরো পড়তে হবে</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {weakTopicsList.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-destructive">❌</span> {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Share + restart */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={shareToFacebook} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Facebook এ Share করো
          </Button>
          <Button className="flex-1" onClick={() => { setStep('content'); setQuestions([]); setAnswers([]); }}>
            নতুন Custom Exam তৈরি করো
          </Button>
        </div>

        {/* Question-by-question review */}
        <h3 className="text-lg font-bold">প্রশ্নভিত্তিক বিশ্লেষণ</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const userAns = answers[i];
            const correctIdx = q.options.findIndex(o => o.isCorrect);
            const isCorrect = userAns !== null && q.options[userAns]?.isCorrect;
            const isSkipped = userAns === null;
            const labels = ['ক', 'খ', 'গ', 'ঘ'];
            return (
              <Card key={i} className={`border-l-4 ${isCorrect ? 'border-l-primary' : isSkipped ? 'border-l-muted-foreground' : 'border-l-destructive'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0 mt-0.5">{i + 1}</Badge>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm flex-1">{q.question}</p>
                        {q.subjectLabel && <Badge variant="secondary" className="text-xs">{q.subjectLabel}</Badge>}
                      </div>
                      <div className="text-xs space-y-1">
                        {isSkipped ? (
                          <p className="text-muted-foreground">⏭️ উত্তর দেওয়া হয়নি — সঠিক: <span className="font-semibold text-primary">{labels[correctIdx]}) {q.options[correctIdx].text}</span></p>
                        ) : isCorrect ? (
                          <p className="text-primary">✅ সঠিক: {labels[userAns!]}) {q.options[userAns!].text}</p>
                        ) : (
                          <>
                            <p className="text-destructive">❌ তোমার উত্তর: {labels[userAns!]}) {q.options[userAns!].text}</p>
                            <p className="text-primary">✅ সঠিক: {labels[correctIdx]}) {q.options[correctIdx].text}</p>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">📖 {q.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default CustomExamPage;
