import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThinkingDots, UpgradeModal } from '@/components/SharedUI';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, RotateCcw, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PhotoSolvePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  const dailyLimit = profile?.subscription_plan === 'premium' ? Infinity :
    profile?.subscription_plan === 'student' ? 20 : 3;
  const currentCount = (profile as any)?.daily_photo_count || 0;

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'ফাইল অনেক বড়', description: 'সর্বোচ্চ 5MB ফাইল আপলোড করো', variant: 'destructive' });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'ভুল ফরম্যাট', description: 'JPG, PNG বা WEBP ফাইল আপলোড করো', variant: 'destructive' });
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result.split(',')[1]);
      setSolution(null);
      setDisplayedText('');
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!imageBase64 || !profile) return;

    if (currentCount >= dailyLimit) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setSolution(null);
    setDisplayedText('');

    try {
      const { data, error } = await supabase.functions.invoke('photo-solve', {
        body: { imageBase64, mimeType },
      });
      if (error) throw error;

      const text = data?.solution || 'সমাধান পাওয়া যায়নি।';
      setSolution(text);

      // Typing animation
      let i = 0;
      const interval = setInterval(() => {
        i += 3;
        if (i >= text.length) {
          setDisplayedText(text);
          clearInterval(interval);
        } else {
          setDisplayedText(text.slice(0, i));
        }
      }, 15);

      // Update daily count
      const today = new Date().toISOString().split('T')[0];
      const resetNeeded = profile.last_reset_date < today;
      await supabase.from('profiles').update({
        daily_photo_count: resetNeeded ? 1 : currentCount + 1,
        last_reset_date: today,
      }).eq('id', profile.id);
      refreshProfile();
    } catch (err: any) {
      toast({ title: 'ত্রুটি', description: err.message || 'সমাধান তৈরি করতে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const reset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setSolution(null);
    setDisplayedText('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold">📸 ছবি থেকে সমাধান</h2>
      <p className="text-muted-foreground">
        প্রশ্নের ছবি তুলো বা আপলোড করো — AI সমাধান দিয়ে দেবে
      </p>
      <p className="text-xs text-muted-foreground">
        আজকের ব্যবহার: {currentCount}/{dailyLimit === Infinity ? '∞' : dailyLimit}
      </p>

      {!imagePreview ? (
        <Card className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors">
          <CardContent className="p-8 text-center space-y-6">
            <div className="text-6xl">📷</div>
            <p className="text-lg font-semibold">প্রশ্নের ছবি তোলো বা Upload করো</p>
            <p className="text-sm text-muted-foreground">JPG, PNG, WEBP (সর্বোচ্চ 5MB)</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => cameraInputRef.current?.click()} className="gap-2">
                <Camera className="h-4 w-4" /> Camera তোলো
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" /> File Upload
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <img src={imagePreview} alt="uploaded" className="w-full max-h-64 object-contain rounded-lg" />
            </CardContent>
          </Card>

          {!solution && !loading && (
            <div className="flex gap-3">
              <Button className="flex-1" size="lg" onClick={handleSolve}>
                🧠 সমাধান করো
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}

          {loading && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <ThinkingDots />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          )}

          {displayedText && (
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <p className="text-sm font-semibold mb-3">📖 সমাধান:</p>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {displayedText}
                </div>
              </CardContent>
            </Card>
          )}

          {solution && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> আবার চেষ্টা করো
              </Button>
              <Button className="flex-1 gap-2" onClick={() => navigate('/mcq')}>
                <BookOpen className="h-4 w-4" /> এই বিষয়ে MCQ করো
              </Button>
            </div>
          )}
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};

export default PhotoSolvePage;
