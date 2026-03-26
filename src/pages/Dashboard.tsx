import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Target, AlertTriangle, Flame } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    // Recent sessions
    const { data: sessions } = await supabase
      .from('mcq_sessions')
      .select('*, subjects(name_bn)')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentSessions(sessions || []);

    // Weak topics
    const { data: weak } = await supabase
      .from('weak_topics')
      .select('*, topics(name_bn)')
      .eq('user_id', profile!.id)
      .order('wrong_count', { ascending: false })
      .limit(3);
    setWeakTopics(weak || []);

    // Weekly data (mock for now)
    const days = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র'];
    setWeeklyData(days.map((d) => ({ day: d, mcq: Math.floor(Math.random() * 20) })));
  };

  const freeLimit = 10;
  const mcqDone = profile?.daily_mcq_count || 0;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold">স্বাগতম, {profile?.name || 'শিক্ষার্থী'} 👋</h2>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">আজকের MCQ</p>
              <p className="text-lg font-bold">{mcqDone}/{freeLimit}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><Target className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">সঠিক উত্তর</p>
              <p className="text-lg font-bold">
                {recentSessions.length > 0
                  ? Math.round(recentSessions.reduce((a, s) => a + s.score_percentage, 0) / recentSessions.length)
                  : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">দুর্বল বিষয়</p>
              <p className="text-lg font-bold">{weakTopics.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10"><Flame className="h-5 w-5 text-secondary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Study Streak</p>
              <p className="text-lg font-bold">3 দিন</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">🎯 এখনই শুরু করো</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/mcq"><Button>MCQ অনুশীলন</Button></Link>
          <Link to="/explain"><Button variant="outline">বুঝিয়ে দাও</Button></Link>
          <Link to="/srijonshil"><Button variant="outline">সৃজনশীল Builder</Button></Link>
        </CardContent>
      </Card>

      {/* Weekly chart */}
      <Card>
        <CardHeader><CardTitle className="text-lg">📊 সাপ্তাহিক অগ্রগতি</CardTitle></CardHeader>
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

      {/* Recent activity */}
      {recentSessions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">সাম্প্রতিক কার্যকলাপ</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{(s as any).subjects?.name_bn || 'বিষয়'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{s.correct_answers}/{s.questions_attempted}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(s.score_percentage)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg text-destructive">⚠️ দুর্বল বিষয়</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {weakTopics.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <div>
                  <p className="font-medium text-sm">{(w as any).topics?.name_bn}</p>
                  <p className="text-xs text-muted-foreground">ভুল: {w.wrong_count} বার</p>
                </div>
                <Link to="/mcq">
                  <Button size="sm" variant="outline">অনুশীলন করো</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
