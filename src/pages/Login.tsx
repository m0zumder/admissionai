import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [name, setName] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user && !showOnboarding) navigate('/dashboard');
  }, [user, showOnboarding]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setShowOnboarding(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleOnboarding = async () => {
    if (!name || !classLevel || !targetExam) {
      toast({ title: 'সব তথ্য দিন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        name, class_level: classLevel, target_exam: targetExam,
      }).eq('id', user.id);
    }
    setLoading(false);
    navigate('/dashboard');
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">🎓 তোমার তথ্য দাও</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>তোমার নাম কী?</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="নাম লেখো" />
            </div>
            <div>
              <Label>তুমি কোন ক্লাসে পড়?</Label>
              <div className="flex gap-2 mt-2">
                {['SSC', 'HSC', 'Admission'].map((level) => (
                  <Button
                    key={level}
                    variant={classLevel === level ? 'default' : 'outline'}
                    onClick={() => setClassLevel(level)}
                    className="flex-1"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>তোমার লক্ষ্য কী?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['SSC 2025', 'HSC 2025', 'ঢাবি ভর্তি', 'বুয়েট ভর্তি', 'মেডিকেল ভর্তি'].map((exam) => (
                  <Button
                    key={exam}
                    variant={targetExam === exam ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTargetExam(exam)}
                  >
                    {exam}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleOnboarding} disabled={loading}>
              {loading ? 'সেভ হচ্ছে...' : 'শুরু করো 🚀'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            📚 Admission AI
          </CardTitle>
          <p className="text-center text-muted-foreground text-sm">
            {isSignUp ? 'নতুন অ্যাকাউন্ট তৈরি করো' : 'তোমার অ্যাকাউন্টে লগ ইন করো'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label>ইমেইল</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
            </div>
            <div>
              <Label>পাসওয়ার্ড</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'অপেক্ষা করুন...' : isSignUp ? 'সাইন আপ করো' : 'লগ ইন করো'}
            </Button>
          </form>
          <p className="text-center text-sm mt-4 text-muted-foreground">
            {isSignUp ? 'আগে থেকে অ্যাকাউন্ট আছে?' : 'অ্যাকাউন্ট নেই?'}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-semibold hover:underline">
              {isSignUp ? 'লগ ইন করো' : 'সাইন আপ করো'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
