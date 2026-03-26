import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThinkingDots, UpgradeModal } from '@/components/SharedUI';
import ReactMarkdown from 'react-markdown';

const ExplainPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'easy' | 'medium' | 'detailed'>('medium');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleExplain = async () => {
    if (!topic.trim()) return;
    if (profile?.subscription_plan === 'free' && (profile?.daily_explain_count || 0) >= 5) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setExplanation('');

    try {
      const { data, error } = await supabase.functions.invoke('explain-topic', {
        body: { topic, level, classLevel: profile?.class_level || 'SSC' },
      });
      if (error) throw error;
      setExplanation(data.explanation || 'ব্যাখ্যা তৈরি করা সম্ভব হয়নি।');
    } catch {
      setExplanation(
        `## ${topic}\n\nএটি একটি নমুনা ব্যাখ্যা। AI Edge Function সেটআপ করলে এখানে বিস্তারিত ব্যাখ্যা দেখাবে।\n\n` +
        `### মূল বিষয়:\n- ${topic} সম্পর্কে জানা গুরুত্বপূর্ণ\n- NCTB পাঠ্যক্রম অনুসরণ করো\n- নিয়মিত অনুশীলন করো`
      );
    }

    // Update daily count
    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const resetNeeded = profile.last_reset_date < today;
      await supabase.from('profiles').update({
        daily_explain_count: resetNeeded ? 1 : profile.daily_explain_count + 1,
        last_reset_date: today,
      }).eq('id', profile.id);
      refreshProfile();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold">💡 বুঝিয়ে দাও</h2>
      <p className="text-muted-foreground">যেকোনো topic লেখো, AI সহজ বাংলায় বুঝিয়ে দেবে</p>

      <Textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="যেকোনো topic লেখো, যেমন: নিউটনের গতিসূত্র, মুক্তিযুদ্ধের কারণ, সালোকসংশ্লেষণ..."
        className="min-h-24"
      />

      <div>
        <p className="font-semibold mb-2">ব্যাখ্যার ধরন:</p>
        <div className="flex gap-2">
          {[
            { key: 'easy' as const, label: 'একদম সহজ' },
            { key: 'medium' as const, label: 'মাঝারি' },
            { key: 'detailed' as const, label: 'বিস্তারিত' },
          ].map((l) => (
            <Button
              key={l.key}
              variant={level === l.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLevel(l.key)}
            >
              {l.label}
            </Button>
          ))}
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={handleExplain} disabled={loading || !topic.trim()}>
        {loading ? <ThinkingDots /> : 'বুঝিয়ে দাও 🧠'}
      </Button>

      {explanation && (
        <Card>
          <CardContent className="p-6 prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {explanation}
            </div>
          </CardContent>
        </Card>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};

export default ExplainPage;
