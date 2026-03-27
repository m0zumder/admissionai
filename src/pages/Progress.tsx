import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart, Legend } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLabel = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'][date.getDay()];
      const daySessions = sessions.filter(s => s.created_at.startsWith(dateStr));
      return { day: dayLabel, mcq: daySessions.reduce((a, s) => a + s.questions_attempted, 0) };
    });
    setWeeklyData(last7Days);

    const sorted = [...sessions].sort((a, b) => a.created_at.localeCompare(b.created_at));
    setScoreTrend(sorted.map((s, i) => ({
      label: format(parseISO(s.created_at), 'dd/MM'),
      score: Math.round(s.score_percentage),
      avg: Math.round(sorted.slice(0, i + 1).reduce((a, x) => a + x.score_percentage, 0) / (i + 1)),
    })));

    const { data: weak } = await supabase
      .from('weak_topics')
      .select('*, topics(name_bn)')
      .eq('user_id', profile!.id)
      .order('wrong_count', { ascending: false });
    setWeakTopics(weak || []);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon="chart-bar" className="mr-2 text-primary" />তোমার প্রগ্রেস</h2>

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

      {scoreTrend.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg"><FontAwesomeIcon icon="chart-line" className="mr-2 text-primary" />পরীক্ষার স্কোর ট্রেন্ড</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Area type="monotone" dataKey="score" name="স্কোর" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="avg" name="গড়" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader><CardTitle className="text-lg"><FontAwesomeIcon icon="trophy" className="mr-2 text-secondary" />অর্জন</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: 'pen-to-square' as const, title: 'প্রথম ১০০ MCQ', unlocked: stats.totalMcq >= 100 },
              { icon: 'fire' as const, title: '৭ দিন Streak', unlocked: stats.studyDays >= 7 },
              { icon: 'bullseye' as const, title: '৯০%+ স্কোর', unlocked: stats.avgScore >= 90 },
              { icon: 'book' as const, title: '৫০০ MCQ', unlocked: stats.totalMcq >= 500 },
            ].map((a) => (
              <div
                key={a.title}
                className={`p-3 rounded-lg text-center border ${
                  a.unlocked ? 'border-secondary bg-secondary/10' : 'border-border opacity-40'
                }`}
              >
                <div className="text-2xl mb-1 text-primary"><FontAwesomeIcon icon={a.icon} /></div>
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
