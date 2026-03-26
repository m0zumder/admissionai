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
import { Moon, Sun } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { profile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [classLevel, setClassLevel] = useState(profile?.class_level || '');
  const [targetExam, setTargetExam] = useState(profile?.target_exam || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({
      name, class_level: classLevel, target_exam: targetExam,
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
            <Label>ক্লাস</Label>
            <div className="flex gap-2 mt-2">
              {['SSC', 'HSC', 'Admission'].map((level) => (
                <Button
                  key={level}
                  variant={classLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>লক্ষ্য</Label>
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
        <CardContent>
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
                if (checked) {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                }
                // Force re-render
                setName((n) => n);
              }}
            />
          </div>
        </CardContent>
      </Card>

        <CardHeader><CardTitle>অ্যাকাউন্ট</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={signOut}>
            লগ আউট
          </Button>
          <Button variant="destructive" className="w-full" onClick={() => {
            toast({ title: 'যোগাযোগ করুন', description: 'অ্যাকাউন্ট মুছতে সাপোর্টে যোগাযোগ করুন।' });
          }}>
            অ্যাকাউন্ট মুছুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
