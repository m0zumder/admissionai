import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ThinkingDots, UpgradeModal } from '@/components/SharedUI';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type MCQQuestion = {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
  subjectLabel?: string;
};

type ExamPreset = {
  label: string;
  duration: number;
  questionCount: number;
  classLevel: string;
  negativeMarking: number;
  subjectDistribution?: Record<string, number>;
  hasSrijonshil?: boolean;
  srijonshilTotal?: number;
  srijonshilChoose?: number;
};

const EXAM_PRESETS: Record<string, ExamPreset> = {
  medical: {
    label: 'Medical ভর্তি',
    duration: 60 * 60,
    questionCount: 100,
    classLevel: 'Admission',
    negativeMarking: 0.25,
    subjectDistribution: { Biology: 30, Chemistry: 25, Physics: 20, English: 15, 'General Knowledge': 10 },
  },
  buet: {
    label: '⚙️ BUET ভর্তি',
    duration: 90 * 60,
    questionCount: 22,
    classLevel: 'Admission',
    negativeMarking: 0,
    subjectDistribution: { Math: 10, Physics: 7, Chemistry: 5 },
  },
  gst_a: {
    label: '🏛️ GST Unit A (বিজ্ঞান)',
    duration: 60 * 60,
    questionCount: 100,
    classLevel: 'Admission',
    negativeMarking: 0.25,
  },
  gst_b: {
    label: '🏛️ GST Unit B (মানবিক)',
    duration: 60 * 60,
    questionCount: 100,
    classLevel: 'Admission',
    negativeMarking: 0.25,
  },
  gst_c: {
    label: '🏛️ GST Unit C (বাণিজ্য)',
    duration: 60 * 60,
    questionCount: 100,
    classLevel: 'Admission',
    negativeMarking: 0.25,
  },
  du_ka: {
    label: '🎓 ঢাবি ক ইউনিট (বিজ্ঞান)',
    duration: 60 * 60,
    questionCount: 100,
    classLevel: 'Admission',
    negativeMarking: 0.25,
  },
  du_kha: {
    label: '🎓 ঢাবি খ ইউনিট (মানবিক)',
    duration: 60 * 60,
    questionCount: 100,
    classLevel: 'Admission',
    negativeMarking: 0.25,
  },
  du_ga: {
    label: '🎓 ঢাবি গ ইউনিট (বাণিজ্য)',
    duration: 60 * 60,
    questionCount: 100,
    classLevel: 'Admission',
    negativeMarking: 0.25,
  },
  ssc: {
    label: '📝 SSC Board মডেল',
    duration: 40 * 60,
    questionCount: 50,
    classLevel: 'SSC',
    negativeMarking: 0,
    hasSrijonshil: true,
    srijonshilTotal: 8,
    srijonshilChoose: 5,
  },
  hsc: {
    label: '📖 HSC Board মডেল',
    duration: 40 * 60,
    questionCount: 50,
    classLevel: 'HSC',
    negativeMarking: 0,
    hasSrijonshil: true,
    srijonshilTotal: 11,
    srijonshilChoose: 7,
  },
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
  const [negativeMarkingOn, setNegativeMarkingOn] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPremium = profile?.subscription_plan === 'student' || profile?.subscription_plan === 'premium';
  const preset = selectedPreset ? EXAM_PRESETS[selectedPreset] : null;
  const hasDistribution = preset?.subjectDistribution && Object.keys(preset.subjectDistribution).length > 0;

  useEffect(() => {
    if (selectedPreset) {
      const p = EXAM_PRESETS[selectedPreset];
      supabase.from('subjects').select('*').eq('class_level', p.classLevel)
        .then(({ data }) => {
          setSubjects(data || []);
          setSelectedSubjects([]);
        });
    }
  }, [selectedPreset]);

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

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startExam = async () => {
    if (!selectedPreset) return;
    if (!hasDistribution && selectedSubjects.length === 0) return;
    setLoading(true);

    const p = EXAM_PRESETS[selectedPreset];
    const perSubject = hasDistribution ? 0 : Math.ceil(p.questionCount / selectedSubjects.length);
    const allQuestions: MCQQuestion[] = [];
    const subjectSources = hasDistribution ? Object.keys(p.subjectDistribution!) : selectedSubjects;

    for (const subjectKey of subjectSources) {
      const count = hasDistribution ? p.subjectDistribution![subjectKey] : perSubject;
      const subjectName = hasDistribution ? subjectKey : (subjects.find(s => s.id === subjectKey)?.name_en || '');
      const subjectBn = hasDistribution ? subjectKey : (subjects.find(s => s.id === subjectKey)?.name_bn || subjectName);

      try {
        const { data, error } = await supabase.functions.invoke('generate-mcq', {
          body: { subject: subjectName, topic: 'General', classLevel: p.classLevel, count },
        });
        if (error) throw error;
        const qs = (data.questions || []).map((q: any) => ({ ...q, subjectLabel: subjectBn }));
        allQuestions.push(...qs);
      } catch {
        for (let i = 0; i < count; i++) {
          allQuestions.push({
            question: `${subjectName} থেকে নমুনা প্রশ্ন ${i + 1}`,
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

    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, p.questionCount);
    setQuestions(shuffled);
    setAnswers(new Array(shuffled.length).fill(null));
    setTimeLeft(p.duration);
    setCurrentQ(0);
    setFlagged(new Set());
    setStep('exam');
    setLoading(false);
  };

  const getScore = useCallback(() => {
    if (!preset) return { correct: 0, wrong: 0, attempted: 0, unanswered: 0, rawScore: 0, deduction: 0, finalScore: 0 };
    const correct = questions.reduce((acc, q, i) => answers[i] !== null && q.options[answers[i]!]?.isCorrect ? acc + 1 : acc, 0);
    const attempted = answers.filter(a => a !== null).length;
    const wrong = attempted - correct;
    const unanswered = questions.length - attempted;
    const negMark = negativeMarkingOn ? preset.negativeMarking : 0;
    const deduction = wrong * negMark;
    const rawScore = correct;
    const finalScore = Math.max(0, rawScore - deduction);
    return { correct, wrong, attempted, unanswered, rawScore, deduction, finalScore };
  }, [questions, answers, preset, negativeMarkingOn]);

  const finishExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('review');
    if (profile && selectedPreset) {
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
  }, [questions, answers, profile, selectedPreset, getScore]);

  const toggleFlag = (idx: number) => {
    setFlagged(prev => { const next = new Set(prev); next.has(idx) ? next.delete(idx) : next.add(idx); return next; });
  };

  if (!isPremium) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pb-20 md:pb-0 pt-12 animate-fade-in">
        <div className="text-6xl text-primary"><FontAwesomeIcon icon="lock" /></div>
        <h2 className="text-2xl font-bold">মক পরীক্ষা</h2>
        <p className="text-muted-foreground">মক পরীক্ষা ফিচারটি Student এবং Premium প্ল্যানে পাওয়া যায়।</p>
        <Button onClick={() => setShowUpgrade(true)}>Upgrade করুন</Button>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </div>
    );
  }

  // EXAM IN PROGRESS
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
            {negativeMarkingOn && preset?.negativeMarking ? (
              <span className="text-destructive font-semibold">-{liveScore.deduction.toFixed(2)}</span>
            ) : null}
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
                      className={`w-full text-left p-3 rounded-lg border transition-all card-hover ${isSelected ? 'bg-primary/15 border-primary ring-1 ring-primary' : 'bg-muted hover:bg-muted/80 border-border'}`}>
                      <span className="font-semibold mr-2">{labels[idx]})</span>{opt.text}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)}>← আগের প্রশ্ন</Button>
                <Button className="flex-1" disabled={currentQ === questions.length - 1} onClick={() => setCurrentQ(c => c + 1)}>পরের প্রশ্ন →</Button>
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
                  return <button key={i} onClick={() => setCurrentQ(i)} className={`w-8 h-8 rounded text-xs font-semibold transition-all ${bg}`}>{i + 1}</button>;
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

  // REVIEW
  if (step === 'review') {
    const { correct, wrong, unanswered, finalScore, deduction } = getScore();
    const pct = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
        <Card className="card-hover">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4 text-primary">{pct >= 70 ? <FontAwesomeIcon icon="champagne-glasses" /> : pct >= 40 ? <FontAwesomeIcon icon="thumbs-up" /> : <FontAwesomeIcon icon="dumbbell" />}</div>
            <h2 className="text-2xl font-bold mb-4">পরীক্ষার ফলাফল</h2>
            <p className="text-5xl font-bold text-primary mb-2">{finalScore.toFixed(2)}/{questions.length}</p>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-1.5 text-primary"><CheckCircle className="h-4 w-4" /> সঠিক: {correct}</div>
              <div className="flex items-center gap-1.5 text-destructive"><XCircle className="h-4 w-4" /> ভুল: {wrong}</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><AlertTriangle className="h-4 w-4" /> বাদ: {unanswered}</div>
            </div>
          </CardContent>
        </Card>

        {/* Negative marking analysis + Guessing Risk Analyzer */}
        {preset?.negativeMarking && negativeMarkingOn ? (
          <>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-6 text-center space-y-2">
                <p className="font-semibold">📊 নেগেটিভ মার্কিং বিশ্লেষণ</p>
                <p className="text-sm">তুমি <span className="text-destructive font-bold">{wrong}টি</span> ভুল করেছো → <span className="text-destructive font-bold">-{deduction.toFixed(2)}</span> marks হারিয়েছো</p>
                <p className="text-sm">{unanswered}টি blank রেখেছো → <span className="text-primary font-semibold">ভালো সিদ্ধান্ত ছিলো</span></p>
              </CardContent>
            </Card>

            {/* Guessing Risk Analyzer */}
            <Card className="border-secondary/30 bg-secondary/5">
              <CardContent className="p-6 space-y-3">
                <p className="font-semibold text-center">🎲 Guessing Risk Analyzer</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground">Guess না করলে স্কোর হতো</p>
                    <p className="text-xl font-bold text-primary">{correct}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground">Guess করে পেয়েছো</p>
                    <p className="text-xl font-bold">{finalScore.toFixed(2)}</p>
                  </div>
                </div>
                {wrong > 0 && (
                  <div className="text-center text-sm">
                    {finalScore > correct ? (
                      <p className="text-primary font-semibold">✅ Guess করে লাভ হয়েছে! +{(finalScore - correct).toFixed(2)} marks বেশি পেয়েছো</p>
                    ) : (
                      <p className="text-destructive font-semibold">❌ Guess করে ক্ষতি হয়েছে! {(correct - finalScore).toFixed(2)} marks কম পেয়েছো</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 পরামর্শ: {wrong > correct ? 'বেশি guess করো না, না জানলে blank রাখো' : 'তোমার guess accuracy ভালো, কিন্তু সতর্ক থেকো'}
                    </p>
                  </div>
                )}
                {wrong === 0 && unanswered > 0 && (
                  <p className="text-center text-sm text-primary font-semibold">🎯 চমৎকার! তুমি কোনো ভুল guess করোনি!</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

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
        <Button className="w-full btn-ripple" onClick={() => { setStep('setup'); setQuestions([]); setAnswers([]); }}>নতুন পরীক্ষা দাও</Button>
      </div>
    );
  }

  // SETUP
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon="file-lines" className="mr-2 text-primary" />মক পরীক্ষা</h2>
      <p className="text-muted-foreground">সম্পূর্ণ পরীক্ষার পরিবেশে টাইমড MCQ অনুশীলন করো</p>

      <div>
        <p className="font-semibold mb-3">পরীক্ষার ধরন বেছে নাও:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(EXAM_PRESETS).map(([key, p]) => (
            <button key={key} onClick={() => setSelectedPreset(key)}
              className={`p-4 rounded-xl border text-left transition-all card-hover ${selectedPreset === key ? 'bg-primary text-primary-foreground border-primary shadow-lg' : 'bg-card border-border hover:border-primary/50'}`}>
              <span className="text-sm font-semibold block">{p.label}</span>
              <span className={`text-xs ${selectedPreset === key ? 'opacity-80' : 'text-muted-foreground'}`}>
                {p.questionCount} প্রশ্ন · {p.duration / 60} মিনিট
                {p.negativeMarking ? ` · -${p.negativeMarking}` : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject selection (only when no fixed distribution) */}
      {selectedPreset && !hasDistribution && subjects.length > 0 && (
        <div>
          <p className="font-semibold mb-3">বিষয় নির্বাচন করো (এক বা একাধিক):</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <button key={s.id} onClick={() => toggleSubject(s.id)}
                className={`p-3 rounded-xl border text-left transition-all card-hover ${selectedSubjects.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                <span className="text-xl block mb-1">{s.icon}</span>
                <span className="text-sm font-medium">{s.name_bn}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject distribution info */}
      {selectedPreset && hasDistribution && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="font-semibold mb-2 text-sm">📋 বিষয়ভিত্তিক প্রশ্ন বিন্যাস:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(preset!.subjectDistribution!).map(([subj, count]) => (
                <div key={subj} className="flex justify-between">
                  <span>{subj}</span>
                  <span className="font-semibold">{count}টি</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Srijonshil info */}
      {selectedPreset && preset?.hasSrijonshil && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-sm">
            <p>✍️ সৃজনশীল অংশ: {preset.srijonshilTotal}টি প্রশ্ন থেকে {preset.srijonshilChoose}টি উত্তর দিতে হবে</p>
          </CardContent>
        </Card>
      )}

      {/* Negative Marking Toggle */}
      {selectedPreset && preset?.negativeMarking ? (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
          <div>
            <Label className="font-semibold">নেগেটিভ মার্কিং</Label>
            <p className="text-xs text-muted-foreground">সঠিক: +1, ভুল: -{preset.negativeMarking}</p>
          </div>
          <Switch checked={negativeMarkingOn} onCheckedChange={setNegativeMarkingOn} />
        </div>
      ) : null}

      {/* Summary & start */}
      {selectedPreset && (hasDistribution || selectedSubjects.length > 0) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-3">
              <span>📝 {preset!.questionCount} প্রশ্ন</span>
              <span>⏱️ {preset!.duration / 60} মিনিট</span>
              {!hasDistribution && <span>📚 {selectedSubjects.length} বিষয়</span>}
            </div>
            <Button className="w-full btn-ripple" size="lg" onClick={startExam} disabled={loading}>
              {loading ? <ThinkingDots /> : <><FontAwesomeIcon icon="rocket" className="mr-2" />পরীক্ষা শুরু করো</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MockExamPage;
