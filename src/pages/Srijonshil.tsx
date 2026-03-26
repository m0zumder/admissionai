import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThinkingDots, UpgradeModal } from '@/components/SharedUI';
import { Copy, Check } from 'lucide-react';

const hscSubjects = ['বাংলা', 'ইংরেজি', 'পদার্থবিজ্ঞান', 'রসায়ন', 'জীববিজ্ঞান', 'গণিত', 'হিসাববিজ্ঞান', 'অর্থনীতি'];

const SrijonshilPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [subject, setSubject] = useState('');
  const [uddipok, setUddipok] = useState('');
  const [result, setResult] = useState<{ ka: string; kha: string; ga: string; gha: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!uddipok.trim() || !subject) return;
    if (profile?.subscription_plan === 'free' && (profile?.daily_srijonshil_count || 0) >= 2) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-srijonshil', {
        body: { subject, uddipok },
      });
      if (error) throw error;
      setResult(data);
    } catch {
      setResult({
        ka: 'এটি জ্ঞানমূলক উত্তরের নমুনা। AI Edge Function সেটআপ করলে পূর্ণাঙ্গ উত্তর দেখাবে।',
        kha: 'অনুধাবনমূলক উত্তরে ধারণাটি নিজের ভাষায় ব্যাখ্যা করা হয় এবং উদ্দীপকের সাথে সংযোগ স্থাপন করা হয়।',
        ga: 'প্রয়োগমূলক উত্তরে উদ্দীপকের ঘটনা পাঠ্যপুস্তকের তত্ত্বের আলোকে বিশ্লেষণ করা হয়। এখানে বিস্তারিত বিশ্লেষণ থাকবে।',
        gha: 'উচ্চতর দক্ষতামূলক উত্তরে গভীর বিশ্লেষণ, দুটি দিক থেকে মতামত এবং নিজস্ব মন্তব্য প্রদান করা হয়। এটি সবচেয়ে বিস্তারিত উত্তর।',
      });
    }

    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const resetNeeded = profile.last_reset_date < today;
      await supabase.from('profiles').update({
        daily_srijonshil_count: resetNeeded ? 1 : profile.daily_srijonshil_count + 1,
        last_reset_date: today,
      }).eq('id', profile.id);
      refreshProfile();
    }
    setLoading(false);
  };

  const copyText = (section: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sections = result ? [
    { key: 'ka', label: 'ক) জ্ঞান (Knowledge) — ১ নম্বর', text: result.ka },
    { key: 'kha', label: 'খ) অনুধাবন (Comprehension) — ২ নম্বর', text: result.kha },
    { key: 'ga', label: 'গ) প্রয়োগ (Application) — ৩ নম্বর', text: result.ga },
    { key: 'gha', label: 'ঘ) উচ্চতর দক্ষতা (Higher Order) — ৪ নম্বর', text: result.gha },
  ] : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold">✍️ সৃজনশীল উত্তর Builder</h2>
      <p className="text-muted-foreground">উদ্দীপক দাও → সম্পূর্ণ ক, খ, গ, ঘ উত্তর পাও</p>

      <Select value={subject} onValueChange={setSubject}>
        <SelectTrigger><SelectValue placeholder="বিষয় নির্বাচন করো" /></SelectTrigger>
        <SelectContent>
          {hscSubjects.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea
        value={uddipok}
        onChange={(e) => setUddipok(e.target.value)}
        placeholder="এখানে উদ্দীপক/passage লেখো বা paste করো..."
        className="min-h-32"
      />

      <Button className="w-full" size="lg" onClick={handleGenerate} disabled={loading || !uddipok.trim() || !subject}>
        {loading ? <ThinkingDots /> : 'উত্তর তৈরি করো ✨'}
      </Button>

      {result && (
        <div className="space-y-4">
          {sections.map((s) => (
            <Card key={s.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.label}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyText(s.key, s.text)}
                  >
                    {copiedSection === s.key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{s.text}</p>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" className="w-full" onClick={() => window.print()}>
            📄 PDF হিসেবে Save করো
          </Button>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};

export default SrijonshilPage;
