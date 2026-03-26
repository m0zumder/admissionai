import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

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
          <div className="flex flex-col items-center gap-2">
            <img src={logo} alt="Admission AI" className="h-14 w-14 rounded-full" />
            <CardTitle className="text-center text-2xl">Admission AI</CardTitle>
            <p className="text-xs font-medium tracking-widest uppercase text-primary/70">Smart Learning, Simplified Prep</p>
          </div>
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
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">অথবা</span></div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth('google', {
                redirect_uri: window.location.origin,
              });
              if (error) toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google দিয়ে লগ ইন করো
          </Button>
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
