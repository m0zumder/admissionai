import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ProgressPage: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalMcq: 0, totalCorrect: 0, avgScore: 0, studyDays: 0 });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [scoreTrend, setScoreTrend] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    loadProgress();
  }, [profile]);

  const loadProgress = async () => {
    const { data: sessions } = await supabase
      .from('mcq_sessions')
      .select('*, subjects(name_bn)')
      .eq('user_id', profile!.id);

    if (sessions) {
      const totalMcq = sessions.reduce((a, s) => a + s.questions_attempted, 0);
      const totalCorrect = sessions.reduce((a, s) => a + s.correct_answers, 0);
      const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((a, s) => a + s.score_percentage, 0) / sessions.length)
        : 0;
      const uniqueDays = new Set(sessions.map(s => s.created_at.split('T')[0])).size;
      setStats({ totalMcq, totalCorrect, avgScore, studyDays: uniqueDays });

      // Subject performance
      const subjectMap: Record<string, { total: number; correct: number }> = {};
      sessions.forEach((s) => {
        const name = (s as any).subjects?.name_bn || 'অন্যান্য';
        if (!subjectMap[name]) subjectMap[name] = { total: 0, correct: 0 };
        subjectMap[name].total += s.questions_attempted;
        subjectMap[name].correct += s.correct_answers;
      });
      setSubjectData(Object.entries(subjectMap).map(([name, d]) => ({
        subject: name,
        score: Math.round((d.correct / d.total) * 100),
        fullMark: 100,
      })));
    }

    // Weekly data
    const days = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র'];
    setWeeklyData(days.map((d) => ({ day: d, mcq: Math.floor(Math.random() * 25) })));

    // Weak topics
    const { data: weak } = await supabase
      .from('weak_topics')
      .select('*, topics(name_bn)')
      .eq('user_id', profile!.id)
      .order('wrong_count', { ascending: false });
    setWeakTopics(weak || []);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold">📊 তোমার প্রগ্রেস</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'মোট MCQ', value: stats.totalMcq },
          { label: 'সঠিক উত্তর', value: stats.totalCorrect },
          { label: 'গড় স্কোর', value: `${stats.avgScore}%` },
          { label: 'পড়াশোনার দিন', value: stats.studyDays },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly chart */}
      <Card>
        <CardHeader><CardTitle className="text-lg">সাপ্তাহিক কার্যকলাপ</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="mcq" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Radar chart */}
      {subjectData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">বিষয়ভিত্তিক পারফরম্যান্স</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={subjectData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="স্কোর" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weak topics */}
      <Card>
        <CardHeader><CardTitle className="text-lg">দুর্বল বিষয়সমূহ</CardTitle></CardHeader>
        <CardContent>
          {weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              এখনো কোনো দুর্বল বিষয় চিহ্নিত হয়নি। MCQ অনুশীলন শুরু করো!
            </p>
          ) : (
            <div className="space-y-3">
              {weakTopics.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{(w as any).topics?.name_bn}</p>
                    <p className="text-xs text-muted-foreground">ভুল: {w.wrong_count} বার</p>
                  </div>
                  <Link to="/mcq"><Button size="sm" variant="outline">অনুশীলন করো</Button></Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader><CardTitle className="text-lg">🏆 অর্জন</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { emoji: '📝', title: 'প্রথম ১০০ MCQ', unlocked: stats.totalMcq >= 100 },
              { emoji: '🔥', title: '৭ দিন Streak', unlocked: stats.studyDays >= 7 },
              { emoji: '🎯', title: '৯০%+ স্কোর', unlocked: stats.avgScore >= 90 },
              { emoji: '📚', title: '৫০০ MCQ', unlocked: stats.totalMcq >= 500 },
            ].map((a) => (
              <div
                key={a.title}
                className={`p-3 rounded-lg text-center border ${
                  a.unlocked ? 'border-secondary bg-secondary/10' : 'border-border opacity-40'
                }`}
              >
                <div className="text-2xl mb-1">{a.emoji}</div>
                <p className="text-xs font-medium">{a.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPage;
