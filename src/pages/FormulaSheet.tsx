import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Bookmark, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Formula = { name: string; formula: string; unit?: string; example?: string; chapter?: string };

const PHYSICS: Formula[] = [
  { name: 'সরল রৈখিক গতি', formula: 'v = u + at', unit: 'm/s', example: 'প্রাথমিক বেগ 0, ত্বরণ 2m/s², 5s পর v=10m/s', chapter: 'গতি' },
  { name: 'সরণ সূত্র', formula: 's = ut + ½at²', unit: 'm', example: 'u=0, a=10, t=3 → s=45m', chapter: 'গতি' },
  { name: 'বেগ-সরণ সম্পর্ক', formula: 'v² = u² + 2as', unit: 'm²/s²', example: 'a=10, s=5, u=0 → v=10m/s', chapter: 'গতি' },
  { name: 'নিউটনের দ্বিতীয় সূত্র', formula: 'F = ma', unit: 'N (নিউটন)', example: 'm=5kg, a=2m/s² → F=10N', chapter: 'বল' },
  { name: 'কাজ', formula: 'W = Fs cosθ', unit: 'J (জুল)', example: 'F=10N, s=5m, θ=0° → W=50J', chapter: 'কাজ-শক্তি' },
  { name: 'গতিশক্তি', formula: 'KE = ½mv²', unit: 'J', example: 'm=2kg, v=3m/s → KE=9J', chapter: 'কাজ-শক্তি' },
  { name: 'ক্ষমতা', formula: 'P = W/t', unit: 'W (ওয়াট)', example: 'W=100J, t=5s → P=20W', chapter: 'কাজ-শক্তি' },
  { name: 'তরঙ্গদৈর্ঘ্য সম্পর্ক', formula: 'v = fλ', unit: 'm/s', example: 'f=50Hz, λ=2m → v=100m/s', chapter: 'তরঙ্গ' },
  { name: 'আয়না সূত্র', formula: '1/f = 1/v + 1/u', unit: 'm', example: 'u=-20cm, f=10cm → v=20cm', chapter: 'আলো' },
  { name: 'স্নেলের সূত্র', formula: 'n = sin i / sin r', unit: 'একক নেই', example: 'i=30°, r=19.5° → n≈1.5', chapter: 'আলো' },
  { name: 'ওহমের সূত্র', formula: 'V = IR', unit: 'V (ভোল্ট)', example: 'I=2A, R=5Ω → V=10V', chapter: 'বিদ্যুৎ' },
  { name: 'বিদ্যুৎ ক্ষমতা', formula: 'P = VI = I²R', unit: 'W', example: 'V=220V, I=2A → P=440W', chapter: 'বিদ্যুৎ' },
  { name: 'মহাকর্ষ সূত্র', formula: 'F = Gm₁m₂/r²', unit: 'N', example: 'দুটি বস্তুর মধ্যে আকর্ষণ', chapter: 'মহাকর্ষ' },
  { name: 'অভিকর্ষজ ত্বরণ', formula: 'g = GM/R²', unit: 'm/s²', example: 'পৃথিবীতে g≈9.8m/s²', chapter: 'মহাকর্ষ' },
];

const CHEMISTRY: Formula[] = [
  { name: 'মোল গণনা', formula: 'n = m/M', unit: 'mol', example: 'm=36g, M=18 → n=2mol (পানি)', chapter: 'মোল' },
  { name: 'আদর্শ গ্যাস সূত্র', formula: 'PV = nRT', unit: 'Pa·m³', example: 'n=1, T=273K, P=101325Pa → V=22.4L', chapter: 'গ্যাস' },
  { name: 'pH সূত্র', formula: 'pH = -log[H⁺]', unit: 'একক নেই', example: '[H⁺]=0.01M → pH=2', chapter: 'অম্ল-ক্ষার' },
  { name: 'pOH সম্পর্ক', formula: 'pH + pOH = 14', unit: '', example: 'pH=3 → pOH=11', chapter: 'অম্ল-ক্ষার' },
  { name: 'গ্যাসের চাপ সূত্র', formula: 'P₁V₁ = P₂V₂ (বয়েল)', unit: 'Pa', example: 'তাপমাত্রা স্থির থাকলে', chapter: 'গ্যাস' },
  { name: 'চার্লসের সূত্র', formula: 'V₁/T₁ = V₂/T₂', unit: '', example: 'চাপ স্থির থাকলে', chapter: 'গ্যাস' },
  { name: 'মোলার ঘনমাত্রা', formula: 'C = n/V', unit: 'mol/L', example: 'n=0.5mol, V=1L → C=0.5M', chapter: 'দ্রবণ' },
  { name: 'ফ্যারাডের সূত্র', formula: 'Q = nFe', unit: 'C (কুলম্ব)', example: 'তড়িৎ বিশ্লেষণ গণনা', chapter: 'তড়িৎ রসায়ন' },
  { name: 'সালোকসংশ্লেষণ', formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', unit: '', example: 'সূর্যালোকের উপস্থিতিতে', chapter: 'জৈব রসায়ন' },
  { name: 'দহন বিক্রিয়া', formula: 'CₓHᵧ + O₂ → CO₂ + H₂O', unit: '', example: 'CH₄ + 2O₂ → CO₂ + 2H₂O', chapter: 'জৈব রসায়ন' },
];

const MATH: Formula[] = [
  { name: 'বর্গের যোগফল', formula: '(a+b)² = a² + 2ab + b²', unit: '', example: '(3+2)²=25', chapter: 'বীজগণিত' },
  { name: 'বর্গের বিয়োগফল', formula: '(a-b)² = a² - 2ab + b²', unit: '', example: '(5-2)²=9', chapter: 'বীজগণিত' },
  { name: 'বর্গ বিয়োজন', formula: 'a² - b² = (a+b)(a-b)', unit: '', example: '25-16=9=(5+4)(5-4)', chapter: 'বীজগণিত' },
  { name: 'শ্রেণি সমষ্টি (সমান্তর)', formula: 'Sₙ = n/2 [2a + (n-1)d]', unit: '', example: 'a=2, d=3, n=5 → S=40', chapter: 'ধারা' },
  { name: 'ত্রিকোণমিতিক অভেদ', formula: 'sin²θ + cos²θ = 1', unit: '', example: 'sin30°=0.5, cos30°=√3/2', chapter: 'ত্রিকোণমিতি' },
  { name: 'ত্রিভুজের ক্ষেত্রফল', formula: 'A = ½ × ভূমি × উচ্চতা', unit: 'বর্গ একক', example: 'b=6, h=4 → A=12', chapter: 'জ্যামিতি' },
  { name: 'বৃত্তের ক্ষেত্রফল', formula: 'A = πr²', unit: 'বর্গ একক', example: 'r=7 → A=154', chapter: 'জ্যামিতি' },
  { name: 'পরিধি', formula: 'C = 2πr', unit: 'একক', example: 'r=7 → C=44', chapter: 'জ্যামিতি' },
  { name: 'গড়', formula: 'x̄ = Σxᵢ/n', unit: '', example: '(2+4+6)/3=4', chapter: 'পরিসংখ্যান' },
  { name: 'মধ্যমা', formula: 'মাঝের মান (সাজানো তথ্যে)', unit: '', example: '2,4,6 → মধ্যমা=4', chapter: 'পরিসংখ্যান' },
  { name: 'প্রচুরক', formula: 'সবচেয়ে বেশি বার আসা মান', unit: '', example: '2,3,3,4 → প্রচুরক=3', chapter: 'পরিসংখ্যান' },
  { name: 'পিথাগোরাসের উপপাদ্য', formula: 'a² + b² = c²', unit: '', example: '3²+4²=5²', chapter: 'জ্যামিতি' },
  { name: 'দ্বিঘাত সূত্র', formula: 'x = (-b ± √(b²-4ac)) / 2a', unit: '', example: 'x²-5x+6=0 → x=2,3', chapter: 'বীজগণিত' },
];

const BIOLOGY: Formula[] = [
  { name: 'সালোকসংশ্লেষণ সমীকরণ', formula: '6CO₂ + 12H₂O → C₆H₁₂O₆ + 6O₂ + 6H₂O', unit: '', example: 'আলোক ও অন্ধকার পর্ব', chapter: 'উদ্ভিদবিদ্যা' },
  { name: 'শ্বসন সমীকরণ', formula: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + শক্তি', unit: '', example: 'সবাত শ্বসনে 38 ATP', chapter: 'প্রাণিবিদ্যা' },
  { name: 'মাইটোসিসের ধাপ', formula: 'প্রোফেজ → মেটাফেজ → অ্যানাফেজ → টেলোফেজ', unit: '', example: 'দেহকোষে ঘটে', chapter: 'কোষ বিভাজন' },
  { name: 'মিয়োসিসের ধাপ', formula: 'মিয়োসিস-I + মিয়োসিস-II = 4টি হ্যাপ্লয়েড কোষ', unit: '', example: 'জনন কোষে ঘটে', chapter: 'কোষ বিভাজন' },
  { name: 'DNA গঠন', formula: 'A=T, G≡C (চারগাফের নিয়ম)', unit: '', example: 'অ্যাডেনিন সর্বদা থায়ামিনের সাথে জোড়া', chapter: 'জেনেটিক্স' },
  { name: 'মেন্ডেলের অনুপাত', formula: 'F₂: 3:1 (একসংকর)', unit: '', example: 'TT×tt → Tt → 3লম্বা:1বেঁটে', chapter: 'জেনেটিক্স' },
  { name: 'রক্তচাপ', formula: 'স্বাভাবিক: 120/80 mmHg', unit: 'mmHg', example: 'সিস্টোলিক/ডায়াস্টোলিক', chapter: 'মানবদেহ' },
  { name: 'BMI সূত্র', formula: 'BMI = ওজন(kg) / উচ্চতা²(m²)', unit: 'kg/m²', example: '70kg, 1.7m → BMI=24.2', chapter: 'মানবদেহ' },
  { name: 'সালোকসংশ্লেষণ রঞ্জক', formula: 'ক্লোরোফিল a, b; ক্যারোটিনয়েড; জ্যান্থোফিল', unit: '', example: 'ক্লোরোফিল a প্রধান', chapter: 'উদ্ভিদবিদ্যা' },
  { name: 'ক্রেবস চক্র', formula: 'অ্যাসিটাইল CoA → 2CO₂ + 3NADH + FADH₂ + GTP', unit: '', example: 'মাইটোকন্ড্রিয়ায় ঘটে', chapter: 'প্রাণিবিদ্যা' },
];

const TOP_20: Formula[] = [
  PHYSICS[0], PHYSICS[1], PHYSICS[3], PHYSICS[4], PHYSICS[5], PHYSICS[10], PHYSICS[11],
  CHEMISTRY[0], CHEMISTRY[1], CHEMISTRY[2],
  MATH[0], MATH[2], MATH[4], MATH[5], MATH[6], MATH[11], MATH[12],
  BIOLOGY[0], BIOLOGY[1], BIOLOGY[5],
];

const allFormulas: Record<string, Formula[]> = { physics: PHYSICS, chemistry: CHEMISTRY, math: MATH, biology: BIOLOGY };

const FormulaSheet: React.FC = () => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('physics');
  const { user } = useAuth();
  const { toast } = useToast();

  const filterFormulas = (formulas: Formula[]) => {
    if (!search) return formulas;
    const q = search.toLowerCase();
    return formulas.filter(f => f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q) || f.chapter?.toLowerCase().includes(q));
  };

  const handleBookmark = async (f: Formula) => {
    if (!user) { toast({ title: 'বুকমার্ক করতে লগ ইন করো' }); return; }
    await supabase.from('bookmarks' as any).insert({
      user_id: user.id,
      content_type: 'formula',
      content_preview: `${f.name}: ${f.formula}`,
      subject: tab,
    });
    toast({ title: '🔖 বুকমার্ক করা হয়েছে' });
  };

  const FormulaCard: React.FC<{ f: Formula }> = ({ f }) => (
    <Card className="card-hover">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-sm">{f.name}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleBookmark(f)}>
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-lg font-mono bg-muted px-3 py-2 rounded-lg">{f.formula}</p>
        {f.unit && <p className="text-xs text-muted-foreground">একক: {f.unit}</p>}
        {f.example && <p className="text-xs text-muted-foreground">উদাহরণ: {f.example}</p>}
        {f.chapter && <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f.chapter}</span>}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold">📐 সূত্র ও সংজ্ঞা — দ্রুত রেফারেন্স</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="সূত্র খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="physics">⚡ পদার্থ</TabsTrigger>
          <TabsTrigger value="chemistry">🧪 রসায়ন</TabsTrigger>
          <TabsTrigger value="math">📐 গণিত</TabsTrigger>
          <TabsTrigger value="biology">🌱 জীববিজ্ঞান</TabsTrigger>
        </TabsList>

        {Object.entries(allFormulas).map(([key, formulas]) => (
          <TabsContent key={key} value={key}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterFormulas(formulas).map((f, i) => <FormulaCard key={i} f={f} />)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">🎯 পরীক্ষায় অবশ্যই মনে রাখতে হবে — শীর্ষ ২০ সূত্র</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TOP_20.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-card rounded-lg text-sm">
                <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                <span className="font-medium">{f.name}:</span>
                <span className="font-mono text-muted-foreground">{f.formula}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => window.print()}>
        📥 PDF হিসেবে Download করো
      </Button>
    </div>
  );
};

export default FormulaSheet;
