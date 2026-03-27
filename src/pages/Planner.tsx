import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ThinkingDots } from '@/components/SharedUI';
import { useXP } from '@/hooks/useXP';
import { useToast } from '@/hooks/use-toast';

type DayPlan = { date: string; tasks: { subject: string; chapter: string; minutes: number; done: boolean }[] };

const SUBJECT_COLORS: Record<string, string> = {
  'গণিত': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'পদার্থবিজ্ঞান': 'bg-red-500/10 text-red-700 dark:text-red-300',
  'রসায়ন': 'bg-green-500/10 text-green-700 dark:text-green-300',
  'জীববিজ্ঞান': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
};

const PlannerPage: React.FC = () => {
  const { profile } = useAuth();
  const { addXP } = useXP();
  const { toast } = useToast();
  const [targetExam, setTargetExam] = useState(profile?.target_exam || '');
  const [examDate, setExamDate] = useState<Date | undefined>(profile?.exam_date ? new Date(profile.exam_date) : undefined);
  const [dailyHours, setDailyHours] = useState('3');
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  const daysLeft = examDate ? differenceInDays(examDate, new Date()) : 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlan = plan.find(p => p.date === todayStr);

  const generatePlan = async () => {
    if (!examDate) return;
    setLoading(true);

    // Generate a simple study plan locally
    const subjects = ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'জীববিজ্ঞান', 'ইংরেজি'];
    const chapters: Record<string, string[]> = {
      'পদার্থবিজ্ঞান': ['গতি', 'বল', 'কাজ-শক্তি', 'তাপ', 'আলো', 'বিদ্যুৎ'],
      'রসায়ন': ['পরমাণু', 'রাসায়নিক বন্ধন', 'অম্ল-ক্ষার', 'জৈব রসায়ন', 'গ্যাস'],
      'গণিত': ['বীজগণিত', 'জ্যামিতি', 'ত্রিকোণমিতি', 'পরিসংখ্যান', 'সেট'],
      'জীববিজ্ঞান': ['কোষ', 'জেনেটিক্স', 'বিবর্তন', 'মানবদেহ', 'উদ্ভিদ'],
      'ইংরেজি': ['Grammar', 'Vocabulary', 'Reading', 'Writing'],
    };

    const days = Math.min(daysLeft, 90);
    const minutesPerDay = parseInt(dailyHours) * 60;
    const newPlan: DayPlan[] = [];

    for (let i = 0; i < days; i++) {
      const date = addDays(new Date(), i + 1);
      const dayName = date.toLocaleDateString('bn-BD', { weekday: 'long' });
      if ((daysOff.includes('fri') && date.getDay() === 5) || (daysOff.includes('sat') && date.getDay() === 6)) continue;

      const tasks = [];
      const subjectsPerDay = 3;
      const minutesPer = Math.floor(minutesPerDay / subjectsPerDay);

      for (let j = 0; j < subjectsPerDay; j++) {
        const subIdx = (i * subjectsPerDay + j) % subjects.length;
        const sub = subjects[subIdx];
        const chaps = chapters[sub] || ['সাধারণ'];
        const chap = chaps[(i + j) % chaps.length];
        tasks.push({ subject: sub, chapter: chap, minutes: minutesPer, done: false });
      }
      // Add MCQ practice
      tasks.push({ subject: 'MCQ অনুশীলন', chapter: `${10 + (i % 10) * 5}টি MCQ`, minutes: 20, done: false });

      newPlan.push({ date: format(date, 'yyyy-MM-dd'), tasks });
    }

    setPlan(newPlan);
    setLoading(false);
  };

  const toggleTask = async (dateStr: string, taskIdx: number) => {
    const key = `${dateStr}-${taskIdx}`;
    const newChecked = new Set(checkedTasks);
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
      await addXP(10);
    }
    setCheckedTasks(newChecked);

    // Check if all today's tasks are done
    if (dateStr === todayStr && todayPlan) {
      const allDone = todayPlan.tasks.every((_, i) => newChecked.has(`${dateStr}-${i}`) || checkedTasks.has(`${dateStr}-${i}`));
      if (allDone && !showConfetti) {
        setShowConfetti(true);
        await addXP(100);
        toast({ title: '🎉 আজকের লক্ষ্য পূরণ হয়েছে! +100 XP' });
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  const completedToday = todayPlan ? todayPlan.tasks.filter((_, i) => checkedTasks.has(`${todayStr}-${i}`)).length : 0;
  const totalToday = todayPlan?.tasks.length || 0;
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold">📅 তোমার পড়ার পরিকল্পনা</h2>
      <p className="text-muted-foreground">পরীক্ষার তারিখ দাও, AI বাকিটা সাজিয়ে দেবে</p>

      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-bounce-in">🎉🎊🥳</div>
        </div>
      )}

      {plan.length === 0 ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="font-semibold mb-2">লক্ষ্য পরীক্ষা</p>
              <Select value={targetExam} onValueChange={setTargetExam}>
                <SelectTrigger><SelectValue placeholder="পরীক্ষা বাছাই করো" /></SelectTrigger>
                <SelectContent>
                  {['SSC 2025', 'SSC 2026', 'HSC 2025', 'HSC 2026', 'Medical ভর্তি', 'BUET ভর্তি', 'GST', 'ঢাকা বিশ্ববিদ্যালয়'].map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="font-semibold mb-2">পরীক্ষার তারিখ</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !examDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {examDate ? format(examDate, 'PPP') : 'তারিখ বেছে নাও'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={examDate} onSelect={setExamDate} disabled={d => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {examDate && <p className="text-sm text-primary font-semibold mt-2">পরীক্ষার আর {daysLeft} দিন বাকি 🔥</p>}
            </div>

            <div>
              <p className="font-semibold mb-2">প্রতিদিন কতক্ষণ পড়বে?</p>
              <div className="flex gap-2">
                {['1', '2', '3', '4', '5'].map(h => (
                  <Button key={h} variant={dailyHours === h ? 'default' : 'outline'} onClick={() => setDailyHours(h)}>{h} ঘণ্টা</Button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-2">ছুটির দিন</p>
              <div className="flex gap-3">
                {[{ id: 'fri', label: 'শুক্রবার' }, { id: 'sat', label: 'শনিবার' }].map(d => (
                  <Button key={d.id} variant={daysOff.includes(d.id) ? 'default' : 'outline'} size="sm"
                    onClick={() => setDaysOff(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])}>
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={generatePlan} disabled={loading || !examDate}>
              {loading ? <ThinkingDots /> : 'পরিকল্পনা তৈরি করো 📅'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress overview */}
          <Card className="card-hover">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-semibold">পরীক্ষার আর {daysLeft} দিন বাকি</p>
                <span className="text-sm text-muted-foreground">{progressPct}% আজ শেষ</span>
              </div>
              <Progress value={progressPct} className="h-3" />
            </CardContent>
          </Card>

          {/* Today's tasks */}
          {todayPlan && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-lg">📋 আজকের কাজ</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {todayPlan.tasks.map((task, i) => {
                  const key = `${todayStr}-${i}`;
                  const isDone = checkedTasks.has(key);
                  const colorClass = SUBJECT_COLORS[task.subject] || 'bg-muted text-muted-foreground';
                  return (
                    <button key={i} onClick={() => toggleTask(todayStr, i)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${isDone ? 'bg-primary/5 border-primary/30 line-through opacity-60' : 'bg-card border-border hover:border-primary/50'}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isDone ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {isDone && <Check className="h-4 w-4 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>{task.subject}</span>
                        <p className="text-sm font-medium mt-1">{task.chapter} — {task.minutes} মিনিট</p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Calendar preview - next 7 days */}
          <Card>
            <CardHeader><CardTitle className="text-lg">📅 আগামী সপ্তাহ</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.slice(0, 7).map(day => (
                  <div key={day.date} className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold text-sm mb-2">{format(new Date(day.date), 'dd MMM (EEEE)')}</p>
                    {day.tasks.map((t, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {t.subject} — {t.chapter} ({t.minutes}m)</p>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={() => setPlan([])}>
            নতুন পরিকল্পনা করো
          </Button>
        </>
      )}
    </div>
  );
};

export default PlannerPage;
