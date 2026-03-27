import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Target, AlertTriangle, Flame, Lightbulb, Zap } from 'lucide-react';
import { getLevelProgress } from '@/hooks/useXP';
import { useXP } from '@/hooks/useXP';

const STUDY_TIPS = [
  "📌 প্রতিদিন অন্তত ৩০ মিনিট MCQ অনুশীলন করো — ধারাবাহিকতাই সাফল্যের চাবিকাঠি।",
  "🧠 একটি topic পড়ার পর সাথে সাথে MCQ দাও — এতে মনে থাকবে বেশি।",
  "📝 ভুল উত্তরগুলো নোট করো এবং পরদিন আবার চেষ্টা করো।",
  "⏰ পরীক্ষার আগে নতুন কিছু না পড়ে, আগেরগুলো revision দাও।",
  "🎯 দুর্বল বিষয়ে বেশি সময় দাও — সেখানেই marks বাড়বে।",
  "💡 সৃজনশীল প্রশ্নে উদ্দীপকের সাথে পাঠ্যপুস্তকের তত্ত্ব মেলাও।",
  "📖 প্রতিটি অধ্যায়ের শুরুতে summary পড়ে নাও — পুরো ছবি বুঝতে পারবে।",
  "🔄 Spaced Repetition: আজ পড়লে ৩ দিন পর আবার পড়ো, তারপর ৭ দিন পর।",
  "✍️ নিজে নোট তৈরি করো — পড়ার চেয়ে লেখায় মনে বেশি থাকে।",
  "🏆 ছোট ছোট লক্ষ্য সেট করো: আজ ১০টি MCQ, কাল ১৫টি।",
];

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { addXP, checkAndAwardBadges } = useXP();
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<{ title: string; path: string }[]>([]);
  const [parentMessage, setParentMessage] = useState<any>(null);

  const todayTip = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % STUDY_TIPS.length;
    return STUDY_TIPS[dayIndex];
  }, []);

  const xp = (profile as any)?.xp_points || 0;
  const streak = (profile as any)?.study_streak || 0;
  const level = (profile as any)?.user_level || 'নবীন 📖';
  const { progress, xpNeeded, next } = getLevelProgress(xp);
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = (profile as any)?.last_activity_date;
  const hasStudiedToday = lastActivity === today;

  useEffect(() => {
    if (!profile) return;
    loadData();
    loadParentMessage();
    // Daily login XP
    if (!hasStudiedToday) {
      addXP(5);
    }
    checkAndAwardBadges();

    // Load recently viewed from localStorage
    const rv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentlyViewed(rv.slice(0, 5));
  }, [profile]);

  const loadParentMessage = async () => {
    const { data } = await supabase.from('parent_messages').select('*').eq('child_id', profile!.id).eq('read', false).order('created_at', { ascending: false }).limit(1);
    if (data && data.length > 0) setParentMessage(data[0]);
  };

  const dismissParentMessage = async () => {
    if (parentMessage) {
      await supabase.from('parent_messages').update({ read: true }).eq('id', parentMessage.id);
      setParentMessage(null);
    }
  };

  // Track page visit
  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const entry = { title: 'ড্যাশবোর্ড', path: '/dashboard' };
    const filtered = existing.filter((e: any) => e.path !== entry.path);
    localStorage.setItem('recentlyViewed', JSON.stringify([entry, ...filtered].slice(0, 10)));
  }, []);

  const loadData = async () => {
    const { data: sessions } = await supabase
      .from('mcq_sessions')
      .select('*, subjects(name_bn)')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentSessions(sessions || []);

    const { data: weak } = await supabase
      .from('weak_topics')
      .select('*, topics(name_bn)')
      .eq('user_id', profile!.id)
      .order('wrong_count', { ascending: false })
      .limit(3);
    setWeakTopics(weak || []);

    const days = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র'];
    setWeeklyData(days.map((d) => ({ day: d, mcq: Math.floor(Math.random() * 20) })));
  };

  const freeLimit = 10;
  const mcqDone = profile?.daily_mcq_count || 0;

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold">স্বাগতম, {profile?.name || 'শিক্ষার্থী'} 👋</h2>

      {/* Parent message notification */}
      {parentMessage && (
        <Card className="border-blue-400/50 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">💙 বাবা/মা বলেছেন:</p>
              <p className="text-sm">{parentMessage.message}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissParentMessage} className="shrink-0 text-xs">পড়েছি ✓</Button>
          </CardContent>
        </Card>
      )}

      {/* XP + Level + Streak bar */}
      <Card className="card-hover overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="font-bold text-sm">{level}</p>
                <p className="text-xs text-muted-foreground">{xp} XP</p>
              </div>
            </div>
            {streak > 0 ? (
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">🔥 {streak} দিনের Streak!</p>
              </div>
            ) : !hasStudiedToday ? (
              <p className="text-sm text-destructive animate-pulse font-semibold">⚠️ আজ পড়োনি! Streak হারাবে</p>
            ) : null}
          </div>
          {next && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>পরের level: {next.name}</span>
                <span>আর {xpNeeded} XP বাকি</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tip of the Day */}
      <Card className="card-hover border-secondary/30 bg-secondary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-secondary/10 shrink-0">
            <Lightbulb className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-secondary mb-1">আজকের পরামর্শ</p>
            <p className="text-sm">{todayTip}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recently Viewed */}
      {recentlyViewed.length > 1 && (
        <div>
          <p className="font-semibold text-sm mb-2">📍 যেখানে ছিলে সেখান থেকে শুরু করো</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentlyViewed.filter(r => r.path !== '/dashboard').map((r, i) => (
              <Link key={i} to={r.path} className="shrink-0">
                <Card className="card-hover w-36">
                  <CardContent className="p-3 text-center">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">আজকের MCQ</p>
              <p className="text-lg font-bold">{mcqDone}/{freeLimit}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><Target className="h-5 w-5 text-green-600" /></div>
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
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">দুর্বল বিষয়</p>
              <p className="text-lg font-bold">{weakTopics.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10"><Flame className="h-5 w-5 text-secondary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Study Streak</p>
              <p className="text-lg font-bold">{streak} দিন</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="card-hover">
        <CardHeader><CardTitle className="text-lg">🎯 এখনই শুরু করো</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/mcq"><Button className="btn-ripple">MCQ অনুশীলন</Button></Link>
          <Link to="/explain"><Button variant="outline" className="btn-ripple">বুঝিয়ে দাও</Button></Link>
          <Link to="/srijonshil"><Button variant="outline" className="btn-ripple">সৃজনশীল Builder</Button></Link>
          <Link to="/formula-sheet"><Button variant="outline" className="btn-ripple">📐 সূত্র শীট</Button></Link>
          <Link to="/planner"><Button variant="outline" className="btn-ripple">📅 পড়ার পরিকল্পনা</Button></Link>
        </CardContent>
      </Card>

      {/* Weekly chart */}
      <Card className="card-hover">
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
        <Card className="card-hover">
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
        <Card className="card-hover">
          <CardHeader><CardTitle className="text-lg text-destructive">⚠️ দুর্বল বিষয়</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {weakTopics.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <div>
                  <p className="font-medium text-sm">{(w as any).topics?.name_bn}</p>
                  <p className="text-xs text-muted-foreground">ভুল: {w.wrong_count} বার</p>
                </div>
                <Link to="/mcq">
                  <Button size="sm" variant="outline" className="btn-ripple">অনুশীলন করো</Button>
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
