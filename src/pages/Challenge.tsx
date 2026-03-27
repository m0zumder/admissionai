import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThinkingDots } from '@/components/SharedUI';
import { useXP } from '@/hooks/useXP';

type MCQQuestion = { question: string; options: { text: string; isCorrect: boolean }[]; explanation: string };

const ChallengePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { user, profile } = useAuth();
  const { addXP } = useXP();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<any>(null);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [step, setStep] = useState<'loading' | 'quiz' | 'result'>('loading');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    if (code) loadChallenge();
  }, [code]);

  const loadChallenge = async () => {
    const { data } = await supabase.from('challenges' as any).select('*').eq('code', code).single();
    if (data) {
      setChallenge(data);
      const qs = typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions;
      setQuestions(qs || []);
      setAnswers(new Array(qs?.length || 0).fill(null));
      setStep('quiz');
    }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const nextQ = () => {
    if (currentQ + 1 >= questions.length) {
      finishChallenge();
    } else {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
    }
  };

  const finishChallenge = async () => {
    const score = questions.reduce((acc, q, i) => answers[i] !== null && q.options[answers[i]!]?.isCorrect ? acc + 1 : acc, 0);
    setStep('result');

    if (user && challenge) {
      const isCreator = challenge.creator_id === user.id;
      await supabase.from('challenges' as any).update(
        isCreator ? { creator_score: score } : { opponent_id: user.id, opponent_score: score, status: 'completed' }
      ).eq('id', challenge.id);

      // Check if won
      if (!isCreator && challenge.creator_score !== null && score > challenge.creator_score) {
        await addXP(200);
      } else {
        await addXP(50);
      }
    }
  };

  const myScore = questions.reduce((acc, q, i) => answers[i] !== null && q.options[answers[i]!]?.isCorrect ? acc + 1 : acc, 0);

  if (step === 'loading') return <div className="text-center py-12"><ThinkingDots /></div>;

  if (step === 'result') {
    const opponentScore = challenge?.creator_id === user?.id ? challenge?.opponent_score : challenge?.creator_score;
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pb-20 md:pb-0 animate-fade-in">
        <Card className="card-hover">
          <CardContent className="p-8 space-y-4">
            <div className="text-6xl">{myScore > (opponentScore ?? -1) ? '🏆' : myScore === opponentScore ? '🤝' : '💪'}</div>
            <h2 className="text-2xl font-bold">চ্যালেঞ্জ ফলাফল</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-xl">
                <p className="text-sm text-muted-foreground">তুমি</p>
                <p className="text-3xl font-bold text-primary">{myScore}/{questions.length}</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">প্রতিপক্ষ</p>
                <p className="text-3xl font-bold">{opponentScore !== null && opponentScore !== undefined ? `${opponentScore}/${questions.length}` : 'অপেক্ষায়...'}</p>
              </div>
            </div>
            {myScore > (opponentScore ?? -1) && opponentScore !== null && <p className="text-primary font-bold">তুমি জিতেছো! 🏆 +200 XP</p>}
          </CardContent>
        </Card>
        <Button onClick={() => navigate('/mcq')}>MCQ পেজে ফিরে যাও</Button>
      </div>
    );
  }

  const q = questions[currentQ];
  if (!q) return <p className="text-center py-8">প্রশ্ন পাওয়া যায়নি</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">⚔️ চ্যালেঞ্জ — প্রশ্ন {currentQ + 1}/{questions.length}</span>
        <span className="text-sm text-primary font-semibold">{challenge?.subject_name}</span>
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
              const correctIdx = q.options.findIndex(o => o.isCorrect);
              let bg = 'bg-muted hover:bg-muted/80';
              if (selectedAnswer !== null) {
                if (idx === correctIdx) bg = 'bg-green-500/20 border-green-500';
                else if (idx === selectedAnswer && !opt.isCorrect) bg = 'bg-red-500/20 border-red-500';
              }
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={selectedAnswer !== null}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${bg}`}>
                  <span className="font-semibold mr-2">{labels[idx]})</span>{opt.text}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {selectedAnswer !== null && (
        <Button className="w-full" onClick={nextQ}>
          {currentQ + 1 >= questions.length ? 'ফলাফল দেখো' : 'পরের প্রশ্ন →'}
        </Button>
      )}
    </div>
  );
};

export default ChallengePage;
