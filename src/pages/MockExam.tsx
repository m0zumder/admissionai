import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThinkingDots, UpgradeModal } from '@/components/SharedUI';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

type MCQQuestion = {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
};

type ExamConfig = {
  examType: string;
  duration: number;
  questionCount: number;
  subjects: string[];
};

const EXAM_PRESETS: Record<string, { label: string; duration: number; questionCount: number; classLevel: string }> = {
  ssc: { label: 'SSC মডেল টেস্ট', duration: 25 * 60, questionCount: 25, classLevel: 'SSC' },
  hsc: { label: 'HSC মডেল টেস্ট', duration: 35 * 60, questionCount: 30, classLevel: 'HSC' },
  du: { label: 'ঢাবি ভর্তি মডেল', duration: 60 * 60, questionCount: 50, classLevel: 'Admission' },
  buet: { label: 'বুয়েট ভর্তি মডেল', duration: 60 * 60, questionCount: 50, classLevel: 'Admission' },
  medical: { label: 'মেডিকেল ভর্তি মডেল', duration: 60 * 60, questionCount: 50, classLevel: 'Admission' },
};

const MockExamPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [step, setStep] = useState<'setup' | 'exam' | 'review'>('setup');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPremium = profile?.subscription_plan === 'student' || profile?.subscription_plan === 'premium';

  // Load subjects based on selected preset's class level
  useEffect(() => {
    if (selectedPreset) {
      const preset = EXAM_PRESETS[selectedPreset];
      supabase.from('subjects').select('*').eq('class_level', preset.classLevel)
        .then(({ data }) => {
          setSubjects(data || []);
          setSelectedSubjects([]);
        });
    }
  }, [selectedPreset]);

  // Timer countdown
  useEffect(() => {
    if (step === 'exam' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [step]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startExam = async () => {
    if (!selectedPreset || selectedSubjects.length === 0) return;
    setLoading(true);

    const preset = EXAM_PRESETS[selectedPreset];
    const perSubject = Math.ceil(preset.questionCount / selectedSubjects.length);
    const allQuestions: MCQQuestion[] = [];

    for (const subjectId of selectedSubjects) {
      const subjectName = subjects.find(s => s.id === subjectId)?.name_en || '';
      try {
        const { data, error } = await supabase.functions.invoke('generate-mcq', {
          body: {
            subject: subjectName,
            topic: 'General',
            classLevel: preset.classLevel,
            count: perSubject,
          },
        });
        if (error) throw error;
        allQuestions.push(...(data.questions || []));
      } catch {
        // Fallback sample questions
        for (let i = 0; i < perSubject; i++) {
          allQuestions.push({
            question: `${subjectName} থেকে নমুনা প্রশ্ন ${i + 1}`,
            options: [
              { text: 'বিকল্প ক', isCorrect: i % 4 === 0 },
              { text: 'বিকল্প খ', isCorrect: i % 4 === 1 },
              { text: 'বিকল্প গ', isCorrect: i % 4 === 2 },
              { text: 'বিকল্প ঘ', isCorrect: i % 4 === 3 },
            ],
            explanation: 'নমুনা ব্যাখ্যা।',
          });
        }
      }
    }

    // Shuffle and trim to exact count
    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, preset.questionCount);
    setQuestions(shuffled);
    setAnswers(new Array(shuffled.length).fill(null));
    setTimeLeft(preset.duration);
    setCurrentQ(0);
    setFlagged(new Set());
    setStep('exam');
    setLoading(false);
  };

  const finishExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('review');

    // Save session
    if (profile && selectedPreset) {
      const correct = questions.reduce((acc, q, i) =>
        answers[i] !== null && q.options[answers[i]!]?.isCorrect ? acc + 1 : acc, 0
      );
      const attempted = answers.filter(a => a !== null).length;
      const pct = attempted > 0 ? (correct / questions.length) * 100 : 0;

      await supabase.from('mcq_sessions').insert({
        user_id: profile.id,
        questions_attempted: attempted,
        correct_answers: correct,
        score_percentage: pct,
      });
      refreshProfile();
    }
  }, [questions, answers, profile, selectedPreset]);

  const toggleFlag = (idx: number) => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // --- GATE: Premium check ---
  if (!isPremium) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pb-20 md:pb-0 pt-12 animate-fade-in">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold">মক পরীক্ষা</h2>
        <p className="text-muted-foreground">
          মক পরীক্ষা ফিচারটি Student এবং Premium প্ল্যানে পাওয়া যায়।
        </p>
        <Button onClick={() => setShowUpgrade(true)}>Upgrade করুন</Button>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </div>
    );
  }

  // --- EXAM IN PROGRESS ---
  if (step === 'exam' && questions.length > 0) {
    const q = questions[currentQ];
    const isUrgent = timeLeft < 60;

    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-0 animate-fade-in">
        {/* Top bar: Timer + Progress */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3 sticky top-0 z-10">
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isUrgent ? 'text-destructive animate-pulse' : 'text-primary'}`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
          <span className="text-sm text-muted-foreground">
            {answers.filter(a => a !== null).length}/{questions.length} উত্তর দেওয়া হয়েছে
          </span>
          <Button variant="destructive" size="sm" onClick={finishExam}>
            পরীক্ষা শেষ করো
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
          {/* Question area */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">প্রশ্ন {currentQ + 1}</CardTitle>
                <Button
                  variant={flagged.has(currentQ) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => toggleFlag(currentQ)}
                >
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
                    <button
                      key={idx}
                      onClick={() => {
                        const newAnswers = [...answers];
                        newAnswers[currentQ] = isSelected ? null : idx;
                        setAnswers(newAnswers);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all card-hover ${
                        isSelected
                          ? 'bg-primary/15 border-primary ring-1 ring-primary'
                          : 'bg-muted hover:bg-muted/80 border-border'
                      }`}
                    >
                      <span className="font-semibold mr-2">{labels[idx]})</span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(c => c - 1)}
                >
                  ← আগের প্রশ্ন
                </Button>
                <Button
                  className="flex-1"
                  disabled={currentQ === questions.length - 1}
                  onClick={() => setCurrentQ(c => c + 1)}
                >
                  পরের প্রশ্ন →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question navigator grid */}
          <Card className="hidden md:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">প্রশ্ন নেভিগেটর</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((_, i) => {
                  let bg = 'bg-muted text-muted-foreground';
                  if (i === currentQ) bg = 'bg-primary text-primary-foreground ring-2 ring-primary/50';
                  else if (answers[i] !== null) bg = 'bg-primary/20 text-primary';
                  else if (flagged.has(i)) bg = 'bg-accent text-accent-foreground';
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      className={`w-8 h-8 rounded text-xs font-semibold transition-all ${bg}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary/20" /> উত্তর দেওয়া</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-accent" /> চিহ্নিত</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-muted" /> বাকি আছে</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- REVIEW / RESULTS ---
  if (step === 'review') {
    const correct = questions.reduce((acc, q, i) =>
      answers[i] !== null && q.options[answers[i]!]?.isCorrect ? acc + 1 : acc, 0
    );
    const attempted = answers.filter(a => a !== null).length;
    const unanswered = questions.length - attempted;
    const wrong = attempted - correct;
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
        {/* Score card */}
        <Card className="card-hover">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">{pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪'}</div>
            <h2 className="text-2xl font-bold mb-4">পরীক্ষার ফলাফল</h2>
            <p className="text-5xl font-bold text-primary mb-2">{pct}%</p>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="h-4 w-4" /> সঠিক: {correct}
              </div>
              <div className="flex items-center gap-1.5 text-destructive">
                <XCircle className="h-4 w-4" /> ভুল: {wrong}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> বাদ: {unanswered}
              </div>
            </div>
          </CardContent>
        </Card>

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
              <Card key={i} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : isSkipped ? 'border-l-muted-foreground' : 'border-l-destructive'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0 mt-0.5">{i + 1}</Badge>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-sm">{q.question}</p>
                      <div className="text-xs space-y-1">
                        {isSkipped ? (
                          <p className="text-muted-foreground">⏭️ উত্তর দেওয়া হয়নি — সঠিক: <span className="font-semibold text-green-600">{labels[correctIdx]}) {q.options[correctIdx].text}</span></p>
                        ) : isCorrect ? (
                          <p className="text-green-600">✅ তোমার উত্তর সঠিক: {labels[userAns!]}) {q.options[userAns!].text}</p>
                        ) : (
                          <>
                            <p className="text-destructive">❌ তোমার উত্তর: {labels[userAns!]}) {q.options[userAns!].text}</p>
                            <p className="text-green-600">✅ সঠিক উত্তর: {labels[correctIdx]}) {q.options[correctIdx].text}</p>
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

        <div className="flex gap-3">
          <Button className="flex-1 btn-ripple" onClick={() => { setStep('setup'); setQuestions([]); setAnswers([]); }}>
            নতুন পরীক্ষা দাও
          </Button>
        </div>
      </div>
    );
  }

  // --- SETUP ---
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold">📄 মক পরীক্ষা</h2>
      <p className="text-muted-foreground">সম্পূর্ণ পরীক্ষার পরিবেশে টাইমড MCQ অনুশীলন করো</p>

      {/* Preset selection */}
      <div>
        <p className="font-semibold mb-3">পরীক্ষার ধরন বেছে নাও:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(EXAM_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setSelectedPreset(key)}
              className={`p-4 rounded-xl border text-left transition-all card-hover ${
                selectedPreset === key
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <span className="text-sm font-semibold block">{preset.label}</span>
              <span className={`text-xs ${selectedPreset === key ? 'opacity-80' : 'text-muted-foreground'}`}>
                {preset.questionCount} প্রশ্ন · {preset.duration / 60} মিনিট
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject selection */}
      {selectedPreset && subjects.length > 0 && (
        <div>
          <p className="font-semibold mb-3">বিষয় নির্বাচন করো (এক বা একাধিক):</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSubject(s.id)}
                className={`p-3 rounded-xl border text-left transition-all card-hover ${
                  selectedSubjects.includes(s.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <span className="text-xl block mb-1">{s.icon}</span>
                <span className="text-sm font-medium">{s.name_bn}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary & start */}
      {selectedPreset && selectedSubjects.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-3">
              <span>📝 {EXAM_PRESETS[selectedPreset].questionCount} প্রশ্ন</span>
              <span>⏱️ {EXAM_PRESETS[selectedPreset].duration / 60} মিনিট</span>
              <span>📚 {selectedSubjects.length} বিষয়</span>
            </div>
            <Button className="w-full btn-ripple" size="lg" onClick={startExam} disabled={loading}>
              {loading ? <ThinkingDots /> : 'পরীক্ষা শুরু করো 🚀'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MockExamPage;
