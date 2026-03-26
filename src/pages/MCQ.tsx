import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThinkingDots, UpgradeModal } from '@/components/SharedUI';

type MCQQuestion = {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
};

const MCQPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (profile?.class_level) {
      supabase.from('subjects').select('*').eq('class_level', profile.class_level)
        .then(({ data }) => setSubjects(data || []));
    }
  }, [profile]);

  useEffect(() => {
    if (selectedSubject) {
      supabase.from('topics').select('*').eq('subject_id', selectedSubject)
        .order('chapter_number')
        .then(({ data }) => setTopics(data || []));
    }
  }, [selectedSubject]);

  const checkLimit = () => {
    if (!profile) return false;
    if (profile.subscription_plan !== 'free') return true;
    if (profile.daily_mcq_count >= 10) {
      setShowUpgrade(true);
      return false;
    }
    return true;
  };

  const startQuiz = async () => {
    if (!checkLimit()) return;
    setLoading(true);

    const subjectName = subjects.find(s => s.id === selectedSubject)?.name_en || '';
    const topicName = topics.find(t => t.id === selectedTopic)?.name_en || '';

    try {
      const { data, error } = await supabase.functions.invoke('generate-mcq', {
        body: {
          subject: subjectName,
          topic: topicName,
          classLevel: profile?.class_level || 'SSC',
          count: questionCount,
        },
      });
      if (error) throw error;
      setQuestions(data.questions || []);
      setStep('quiz');
      setCurrentQ(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } catch (err) {
      const sampleQs: MCQQuestion[] = Array.from({ length: questionCount }, (_, i) => ({
        question: `${subjectName} - ${topicName} থেকে নমুনা প্রশ্ন ${i + 1}`,
        options: [
          { text: 'বিকল্প ক', isCorrect: i % 4 === 0 },
          { text: 'বিকল্প খ', isCorrect: i % 4 === 1 },
          { text: 'বিকল্প গ', isCorrect: i % 4 === 2 },
          { text: 'বিকল্প ঘ', isCorrect: i % 4 === 3 },
        ],
        explanation: 'এটি একটি নমুনা ব্যাখ্যা। AI Edge Function সেটআপ করলে এখানে বিস্তারিত ব্যাখ্যা দেখাবে।',
      }));
      setQuestions(sampleQs);
      setStep('quiz');
      setCurrentQ(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
    setLoading(false);
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (questions[currentQ].options[idx].isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentQ((c) => c + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const finishQuiz = async () => {
    setStep('result');
    const pct = (score / questions.length) * 100;

    if (profile) {
      await supabase.from('mcq_sessions').insert({
        user_id: profile.id,
        subject_id: selectedSubject,
        topic_id: selectedTopic,
        questions_attempted: questions.length,
        correct_answers: score,
        score_percentage: pct,
      });

      const today = new Date().toISOString().split('T')[0];
      const resetNeeded = profile.last_reset_date < today;
      await supabase.from('profiles').update({
        daily_mcq_count: resetNeeded ? questionCount : profile.daily_mcq_count + questionCount,
        last_reset_date: today,
      }).eq('id', profile.id);
      refreshProfile();
    }
  };

  const handleDeepExplain = () => {
    const topicName = topics.find(t => t.id === selectedTopic)?.name_bn || '';
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name_bn || '';
    const query = topicName || subjectName || questions[currentQ]?.question?.slice(0, 60) || '';
    navigate(`/explain?topic=${encodeURIComponent(query)}`);
  };

  if (step === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const correctIdx = q.options.findIndex(o => o.isCorrect);
    const isWrong = selectedAnswer !== null && !q.options[selectedAnswer].isCorrect;
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">প্রশ্ন {currentQ + 1}/{questions.length}</span>
          <span className="text-sm text-muted-foreground">স্কোর: {score}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Question */}
        <Card>
          <CardContent className="p-6">
            <p className="text-lg font-medium mb-6">{q.question}</p>
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                const labels = ['ক', 'খ', 'গ', 'ঘ'];
                let bg = 'bg-muted hover:bg-muted/80 card-hover';
                let bounceClass = '';
                if (selectedAnswer !== null) {
                  if (idx === correctIdx) {
                    bg = 'bg-success/20 border-success';
                    bounceClass = 'animate-answer-bounce';
                  } else if (idx === selectedAnswer && !opt.isCorrect) {
                    bg = 'bg-destructive/20 border-destructive';
                    bounceClass = 'animate-answer-bounce';
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${bg} ${bounceClass}`}
                  >
                    <span className="font-semibold mr-2">{labels[idx]})</span>
                    {opt.text}
                    {selectedAnswer !== null && idx === correctIdx && ' ✓'}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Explanation */}
        {showExplanation && (
          <Card className="border-primary/30 animate-fade-in">
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-1">📖 ব্যাখ্যা:</p>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
              {isWrong && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 btn-ripple"
                  onClick={handleDeepExplain}
                >
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
      </div>
    );
  }

  if (step === 'result') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pb-20 md:pb-0 animate-fade-in">
        <Card className="card-hover">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">{pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪'}</div>
            <h2 className="text-2xl font-bold mb-2">তোমার স্কোর</h2>
            <p className="text-4xl font-bold text-primary">{score}/{questions.length}</p>
            <p className="text-lg text-muted-foreground">({pct}%)</p>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button className="flex-1 btn-ripple" onClick={() => { setStep('select'); setQuestions([]); }}>
            অন্য বিষয় পড়ো
          </Button>
          <Button variant="outline" className="flex-1 btn-ripple" onClick={startQuiz}>
            আবার চেষ্টা করো
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold">📝 MCQ অনুশীলন</h2>
      <p className="text-muted-foreground">বিষয় ও অধ্যায় বেছে নিয়ে MCQ প্র্যাক্টিস শুরু করো</p>

      {/* Subject selection */}
      <div>
        <p className="font-semibold mb-3">বিষয় নির্বাচন করো:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedSubject(s.id); setSelectedTopic(null); }}
              className={`p-4 rounded-xl border text-left transition-all card-hover ${
                selectedSubject === s.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl block mb-1">{s.icon}</span>
              <span className="text-sm font-medium">{s.name_bn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Topic selection */}
      {topics.length > 0 && (
        <div>
          <p className="font-semibold mb-3">অধ্যায় নির্বাচন করো:</p>
          <div className="space-y-2">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`w-full p-3 rounded-lg border text-left transition-all card-hover ${
                  selectedTopic === t.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <span className="text-sm">অধ্যায় {t.chapter_number}: {t.name_bn}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Count selector */}
      {selectedSubject && (
        <div>
          <p className="font-semibold mb-3">কতটি প্রশ্ন?</p>
          <div className="flex gap-3">
            {[5, 10, 20].map((n) => (
              <Button
                key={n}
                variant={questionCount === n ? 'default' : 'outline'}
                onClick={() => setQuestionCount(n)}
                className="btn-ripple"
              >
                {n}টি
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedSubject && (
        <Button className="w-full btn-ripple" size="lg" onClick={startQuiz} disabled={loading}>
          {loading ? <ThinkingDots /> : 'শুরু করো 🚀'}
        </Button>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};

export default MCQPage;
