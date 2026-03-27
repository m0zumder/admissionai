import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Link2, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const AVATARS = ['📚', '🎓', '👨‍🎓', '👩‍🎓', '🦁', '🐯', '⚡', '🔥', '🌟', '💪', '🏆', '🎯'];

const EXAM_OPTIONS = [
  'SSC 2025', 'SSC 2026', 'HSC 2025', 'HSC 2026',
  'Medical ভর্তি', 'BUET ভর্তি', 'GST', 'ঢাকা বিশ্ববিদ্যালয়',
];

const SettingsPage: React.FC = () => {
  const { profile, refreshProfile, signOut, user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [classLevel, setClassLevel] = useState(profile?.class_level || '');
  const [targetExam, setTargetExam] = useState(profile?.target_exam || '');
  const [avatarEmoji, setAvatarEmoji] = useState(profile?.avatar_emoji || '📚');
  const [examDate, setExamDate] = useState<Date | undefined>(profile?.exam_date ? new Date(profile.exam_date) : undefined);
  const [saving, setSaving] = useState(false);
  const [linkingCode, setLinkingCode] = useState('');
  const [parentLinked, setParentLinked] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    if (user) checkParentLink();
  }, [user]);

  const checkParentLink = async () => {
    const { data } = await supabase.from('parent_links').select('*').eq('child_id', user!.id).eq('status', 'linked');
    if (data && data.length > 0) setParentLinked(true);
    // Check for existing pending code
    const { data: pending } = await supabase.from('parent_links').select('*').eq('child_id', user!.id).eq('status', 'pending');
    if (pending && pending.length > 0) setLinkingCode(pending[0].linking_code);
  };

  const generateLinkingCode = async () => {
    setGeneratingCode(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await supabase.from('parent_links').insert({ child_id: user!.id, linking_code: code, status: 'pending' });
    setLinkingCode(code);
    setGeneratingCode(false);
    toast({ title: `Linking Code: ${code}`, description: '২৪ ঘণ্টার মধ্যে অভিভাবককে দিন' });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const cl = targetExam.includes('SSC') ? 'SSC' : targetExam.includes('HSC') ? 'HSC' : 'Admission';
    await supabase.from('profiles').update({
      name, class_level: cl, target_exam: targetExam, avatar_emoji: avatarEmoji,
      exam_date: examDate ? format(examDate, 'yyyy-MM-dd') : null,
    }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    toast({ title: 'সেভ হয়েছে ✓' });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold">⚙️ সেটিংস</h2>

      <Card>
        <CardHeader><CardTitle>প্রোফাইল</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>নাম</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>অ্যাভাটার</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {AVATARS.map((emoji) => (
                <button key={emoji} onClick={() => setAvatarEmoji(emoji)}
                  className={`text-2xl p-2 rounded-lg border transition-all ${avatarEmoji === emoji ? 'bg-primary/20 border-primary scale-110' : 'border-border hover:border-primary/50'}`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>লক্ষ্য পরীক্ষা</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EXAM_OPTIONS.map((exam) => (
                <Button key={exam} variant={targetExam === exam ? 'default' : 'outline'} size="sm" onClick={() => setTargetExam(exam)}>
                  {exam}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>পরীক্ষার তারিখ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-2", !examDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {examDate ? format(examDate, 'PPP') : 'তারিখ বেছে নাও'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={examDate} onSelect={setExamDate} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {examDate && (
              <p className="text-sm text-primary font-semibold mt-2">
                পরীক্ষার আর {differenceInDays(examDate, new Date())} দিন বাকি 🔥
              </p>
            )}
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করো'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>সাবস্ক্রিপশন</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">বর্তমান প্ল্যান</p>
              <Badge className="mt-1">{profile?.subscription_plan || 'Free'}</Badge>
            </div>
            <a href="/pricing"><Button variant="outline" size="sm">Upgrade</Button></a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>ডিসপ্লে</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {document.documentElement.classList.contains('dark') ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <p className="font-medium text-sm">ডার্ক মোড</p>
                <p className="text-xs text-muted-foreground">রাতে পড়ার জন্য চোখের আরাম</p>
              </div>
            </div>
            <Switch
              checked={document.documentElement.classList.contains('dark')}
              onCheckedChange={(checked) => {
                if (checked) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
                else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
                setName((n) => n);
              }}
            />
          </div>
          <div>
            <p className="font-medium text-sm mb-2">ফন্ট সাইজ</p>
            <div className="flex gap-2">
              {[
                { key: 'small', label: 'ক', size: 'text-sm' },
                { key: 'medium', label: 'ক', size: 'text-base' },
                { key: 'large', label: 'ক', size: 'text-xl' },
              ].map((f) => (
                <Button key={f.key}
                  variant={(localStorage.getItem('fontSize') || 'medium') === f.key ? 'default' : 'outline'}
                  className={f.size}
                  onClick={() => {
                    localStorage.setItem('fontSize', f.key);
                    document.documentElement.setAttribute('data-font-size', f.key);
                    setName(n => n);
                  }}>
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parent linking */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> অভিভাবক সংযোগ</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {parentLinked ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" /> আপনার অভিভাবক যুক্ত আছেন ✓
            </div>
          ) : (
            <>
              {linkingCode ? (
                <div className="text-center p-4 bg-primary/10 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2">এই কোড অভিভাবককে দিন (২৪ ঘণ্টা বৈধ)</p>
                  <p className="text-3xl font-mono font-bold tracking-widest text-primary">{linkingCode}</p>
                </div>
              ) : (
                <Button className="w-full" onClick={generateLinkingCode} disabled={generatingCode}>
                  {generatingCode ? 'তৈরি হচ্ছে...' : 'Linking Code তৈরি করো'}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>অ্যাকাউন্ট</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={signOut}>লগ আউট</Button>
          <Button variant="destructive" className="w-full" onClick={() => {
            toast({ title: 'যোগাযোগ করুন', description: 'অ্যাকাউন্ট মুছতে সাপোর্টে যোগাযোগ করুন।' });
          }}>অ্যাকাউন্ট মুছুন</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
