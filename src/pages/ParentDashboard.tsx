import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { Flame, Trophy, AlertTriangle, BookOpen, Send } from 'lucide-react';

const ParentDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [childProfile, setChildProfile] = useState<any>(null);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [weeklyMcq, setWeeklyMcq] = useState({ total: 0, correct: 0 });
  const [weeklyChart, setWeeklyChart] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadChildData();
  }, [user]);

  const loadChildData = async () => {
    setLoading(true);
    // Find linked child
    const { data: links } = await supabase
      .from('parent_links')
      .select('*')
      .eq('parent_id', user!.id)
      .eq('status', 'linked');

    if (!links || links.length === 0) {
      setLoading(false);
      return;
    }

    const childId = links[0].child_id;

    // Get child profile
    const { data: cp } = await supabase.from('profiles').select('*').eq('id', childId).single();
    if (cp) setChildProfile(cp);

    // Get weak topics
    const { data: wt } = await supabase.from('weak_topics').select('*, topics(name_bn)').eq('user_id', childId).order('wrong_count', { ascending: false }).limit(3);
    setWeakTopics(wt || []);

    // Get weekly MCQ sessions
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: sessions } = await supabase.from('mcq_sessions').select('*').eq('user_id', childId).gte('created_at', weekAgo.toISOString());

    if (sessions) {
      const total = sessions.reduce((a, s) => a + s.questions_attempted, 0);
      const correct = sessions.reduce((a, s) => a + s.correct_answers, 0);
      setWeeklyMcq({ total, correct });

      // Build chart data
      const days = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র'];
      const chartData = days.map((day, i) => {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() - (6 - i));
        const dayStr = dayDate.toISOString().split('T')[0];
        const daySessions = sessions.filter(s => s.created_at.startsWith(dayStr));
        return { day, mcq: daySessions.reduce((a, s) => a + s.questions_attempted, 0) };
      });
      setWeeklyChart(chartData);
    }

    setLoading(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || !childProfile) return;
    setSending(true);
    const { error } = await supabase.from('parent_messages').insert({
      parent_id: user!.id,
      child_id: childProfile.id,
      message: message.trim(),
    });
    if (error) toast.error('বার্তা পাঠাতে সমস্যা হয়েছে');
    else { toast.success('বার্তা পাঠানো হয়েছে! 💙'); setMessage(''); }
    setSending(false);
  };

  const generateWhatsAppReport = () => {
    if (!childProfile) return;
    const pct = weeklyMcq.total > 0 ? Math.round((weeklyMcq.correct / weeklyMcq.total) * 100) : 0;
    const weakNames = weakTopics.map(w => (w as any).topics?.name_bn).filter(Boolean).join(', ');
    const text = `${childProfile.name || 'সন্তান'} এর এই সপ্তাহের পড়াশোনার রিপোর্ট:\n✅ মোট MCQ: ${weeklyMcq.total} টি | 📊 গড় স্কোর: ${pct}%\n🔥 Streak: ${childProfile.study_streak || 0} দিন | 🏆 Level: ${childProfile.user_level || 'নবীন'}\nদুর্বল বিষয়: ${weakNames || 'নেই'}\n- Admission AI`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!childProfile) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-16">
        <p className="text-4xl">👨‍👩‍👧</p>
        <h2 className="text-2xl font-bold">কোনো সন্তান যুক্ত নেই</h2>
        <p className="text-muted-foreground">আপনার সন্তানকে তার Settings পেজ থেকে Linking Code তৈরি করতে বলুন, তারপর সেই কোড দিয়ে লগইন করুন।</p>
      </div>
    );
  }

  const pct = weeklyMcq.total > 0 ? Math.round((weeklyMcq.correct / weeklyMcq.total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold">👨‍👩‍👧 অভিভাবক ড্যাশবোর্ড</h2>
      <p className="text-muted-foreground">{childProfile.name || 'সন্তান'} এর পড়াশোনার অগ্রগতি</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{weeklyMcq.total}</p>
            <p className="text-xs text-muted-foreground">এই সপ্তাহে MCQ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{pct}%</p>
            <p className="text-xs text-muted-foreground">সঠিক উত্তর</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{childProfile.study_streak || 0}</p>
            <p className="text-xs text-muted-foreground">দিনের Streak 🔥</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-secondary" />
            <p className="text-sm font-bold">{childProfile.user_level || 'নবীন 📖'}</p>
            <p className="text-xs text-muted-foreground">{childProfile.xp_points || 0} XP</p>
          </CardContent>
        </Card>
      </div>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> দুর্বল বিষয় (Top 3)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {weakTopics.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <p className="font-medium text-sm">{(w as any).topics?.name_bn}</p>
                <p className="text-xs text-muted-foreground">ভুল: {w.wrong_count} বার</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly chart */}
      <Card>
        <CardHeader><CardTitle className="text-lg">📊 গত ৭ দিনের কার্যকলাপ</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChart}>
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

      {/* Weekly report card */}
      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-lg">📋 এই সপ্তাহের রিপোর্ট কার্ড</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">মোট MCQ:</span> <strong>{weeklyMcq.total} টি</strong></div>
            <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">গড় স্কোর:</span> <strong>{pct}%</strong></div>
            <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Streak:</span> <strong>{childProfile.study_streak || 0} দিন</strong></div>
            <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Level:</span> <strong>{childProfile.user_level || 'নবীন'}</strong></div>
          </div>
          <Button variant="outline" className="w-full" onClick={generateWhatsAppReport}>
            📤 WhatsApp এ রিপোর্ট পাঠাও
          </Button>
        </CardContent>
      </Card>

      {/* Send message */}
      <Card>
        <CardHeader><CardTitle className="text-lg">💙 সন্তানকে বার্তা পাঠাও</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="উৎসাহমূলক বার্তা লেখো..." rows={3} />
          <Button className="w-full" onClick={sendMessage} disabled={sending || !message.trim()}>
            <Send className="h-4 w-4 mr-2" /> {sending ? 'পাঠানো হচ্ছে...' : 'পাঠাও'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;
