import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThinkingDots } from '@/components/SharedUI';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Share2 } from 'lucide-react';

const GPA_OPTIONS = ['3.00', '3.25', '3.50', '3.75', '4.00', '4.25', '4.50', '4.75', '5.00'];

const SUBJECT_SCORES = [
  { key: 'physics', label: 'পদার্থবিজ্ঞান' },
  { key: 'chemistry', label: 'রসায়ন' },
  { key: 'biology', label: 'জীববিজ্ঞান' },
  { key: 'math', label: 'গণিত' },
  { key: 'english', label: 'English' },
  { key: 'gk', label: 'সাধারণ জ্ঞান' },
];

type ChanceResult = {
  label: string;
  icon: string;
  chance: number;
};

type Recommendation = {
  text: string;
};

const ChanceCalculatorPage: React.FC = () => {
  const { toast } = useToast();
  const [sscGpa, setSscGpa] = useState('5.00');
  const [hscGpa, setHscGpa] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({
    physics: 60, chemistry: 60, biology: 60, math: 60, english: 60, gk: 60,
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ChanceResult[] | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [animatedIdx, setAnimatedIdx] = useState(-1);

  const updateScore = (key: string, value: number[]) => {
    setScores(prev => ({ ...prev, [key]: value[0] }));
  };

  const calculateChance = async () => {
    setLoading(true);
    setResults(null);
    setRecommendations([]);
    setAnimatedIdx(-1);

    try {
      const { data, error } = await supabase.functions.invoke('calculate-chance', {
        body: { sscGpa: parseFloat(sscGpa), hscGpa: hscGpa ? parseFloat(hscGpa) : null, scores },
      });

      if (error) throw error;

      const chancesData: ChanceResult[] = data.chances || [];
      const recsData: Recommendation[] = (data.recommendations || []).map((r: string) => ({ text: r }));

      setResults(chancesData);
      setRecommendations(recsData);

      // Animate results one by one
      chancesData.forEach((_, i) => {
        setTimeout(() => setAnimatedIdx(i), (i + 1) * 400);
      });
    } catch (err) {
      // Fallback: client-side calculation
      const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
      const gpaFactor = (parseFloat(sscGpa) + (hscGpa ? parseFloat(hscGpa) : 4.5)) / 10;
      const base = avgScore * 0.7 + gpaFactor * 30;

      const fallbackResults: ChanceResult[] = [
        { label: 'Medical Admission', icon: '🏥', chance: Math.min(95, Math.max(5, Math.round(base * 0.85 + scores.biology * 0.15))) },
        { label: 'BUET', icon: '⚙️', chance: Math.min(95, Math.max(5, Math.round(base * 0.7 + scores.math * 0.2 + scores.physics * 0.1))) },
        { label: 'DU ক ইউনিট', icon: '🏛️', chance: Math.min(95, Math.max(5, Math.round(base * 0.9))) },
        { label: 'GST 19 Universities', icon: '🎓', chance: Math.min(95, Math.max(5, Math.round(base * 0.95 + 5))) },
        { label: 'জগন্নাথ বিশ্ববিদ্যালয়', icon: '📚', chance: Math.min(95, Math.max(5, Math.round(base * 0.85))) },
        { label: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়', icon: '🏫', chance: Math.min(95, Math.max(5, Math.round(base * 0.88))) },
      ];

      const fallbackRecs: Recommendation[] = [];
      if (scores.biology < 70) fallbackRecs.push({ text: 'Biology তে আরো ১৫ marks বাড়াও' });
      if (scores.chemistry < 70) fallbackRecs.push({ text: 'Chemistry Organic chapter শেষ করো' });
      if (scores.english < 70) fallbackRecs.push({ text: 'English grammar MCQ practice করো' });
      if (scores.physics < 70) fallbackRecs.push({ text: 'Physics এর Mechanics ও Optics চ্যাপ্টার রিভিশন দাও' });
      if (scores.math < 70) fallbackRecs.push({ text: 'গণিতে Calculus ও Algebra তে ফোকাস করো' });

      setResults(fallbackResults);
      setRecommendations(fallbackRecs);

      fallbackResults.forEach((_, i) => {
        setTimeout(() => setAnimatedIdx(i), (i + 1) * 400);
      });
    }

    setLoading(false);
  };

  const shareToWhatsApp = () => {
    if (!results) return;
    const medicalChance = results.find(r => r.label.includes('Medical'))?.chance || 0;
    const text = encodeURIComponent(`পড়াশোনা AI তে আমার Medical chance ${medicalChance}%! 🏥\nতুমিও দেখো: ${window.location.origin}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold">🎯 ভর্তির সম্ভাবনা জানো</h2>
        <p className="text-muted-foreground">তোমার scores দাও, AI বলবে কোথায় chance কেমন</p>
      </div>

      {!results ? (
        <>
          {/* GPA inputs */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold mb-2 block">SSC GPA</Label>
                  <Select value={sscGpa} onValueChange={setSscGpa}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GPA_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-semibold mb-2 block">HSC GPA</Label>
                  <Select value={hscGpa} onValueChange={setHscGpa}>
                    <SelectTrigger><SelectValue placeholder="নির্বাচন করো" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_done">এখনো হয়নি</SelectItem>
                      {GPA_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject scores */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📊 Mock exam স্কোর (0-100)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {SUBJECT_SCORES.map(s => (
                <div key={s.key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{s.label}</Label>
                    <span className="font-bold text-primary">{scores[s.key]}</span>
                  </div>
                  <Slider
                    value={[scores[s.key]]}
                    onValueChange={(v) => updateScore(s.key, v)}
                    min={0} max={100} step={1}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={calculateChance} disabled={loading}>
            {loading ? <ThinkingDots /> : 'সম্ভাবনা দেখো 🎯'}
          </Button>
        </>
      ) : (
        <>
          {/* Results */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-center">📊 তোমার ভর্তির সম্ভাবনা</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((r, i) => (
                <div key={i} className={`space-y-2 transition-all duration-500 ${i <= animatedIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{r.icon} {r.label}</span>
                    <span className={`font-bold ${r.chance >= 60 ? 'text-primary' : r.chance >= 30 ? 'text-yellow-500' : 'text-destructive'}`}>
                      {r.chance}%
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${r.chance >= 60 ? 'bg-primary' : r.chance >= 30 ? 'bg-yellow-500' : 'bg-destructive'}`}
                      style={{ width: i <= animatedIdx ? `${r.chance}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">💡 তোমার chance বাড়াতে:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">✅</span>
                    <span>{r.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Share + recalculate */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={shareToWhatsApp} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" /> WhatsApp এ Share করো
            </Button>
            <Button className="flex-1" onClick={() => { setResults(null); setAnimatedIdx(-1); }}>
              আবার হিসাব করো
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChanceCalculatorPage;
