import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getLevelProgress } from '@/hooks/useXP';

const ALL_BADGES = [
  { name: 'প্রথম পদক্ষেপ', emoji: '🥇', desc: 'প্রথম MCQ সম্পন্ন', requirement: 'প্রথম MCQ দাও' },
  { name: '৭ দিনের যোদ্ধা', emoji: '🔥', desc: '৭ দিনের streak অর্জন', requirement: '৭ দিন টানা পড়ো' },
  { name: 'MCQ সেঞ্চুরি', emoji: '💯', desc: '১০০টি MCQ সম্পন্ন', requirement: '১০০টি MCQ দাও' },
  { name: 'হাজারিক', emoji: '⚡', desc: '১০০০টি MCQ সম্পন্ন', requirement: '১০০০টি MCQ দাও' },
  { name: 'গণিত মাস্টার', emoji: '🧮', desc: 'গণিতে ৯০%+ স্কোর', requirement: 'যেকোনো গণিত মকে ৯০%+' },
  { name: 'বিজ্ঞানী', emoji: '🔬', desc: 'বিজ্ঞানে ৯০%+ স্কোর', requirement: 'যেকোনো বিজ্ঞান মকে ৯০%+' },
  { name: 'সৃজনশীল বিশেষজ্ঞ', emoji: '✍️', desc: '১০টি সৃজনশীল উত্তর তৈরি', requirement: '১০টি সৃজনশীল দাও' },
  { name: 'নোটবুক গবেষক', emoji: '📚', desc: '৫টি নোটবুক তৈরি', requirement: '৫টি ডকুমেন্ট আপলোড করো' },
  { name: 'গ্র্যান্ড মাস্টার', emoji: '🎯', desc: '১০টি মক পরীক্ষা সম্পন্ন', requirement: '১০টি মক পরীক্ষা দাও' },
  { name: 'চ্যাম্পিয়ন', emoji: '👑', desc: 'চ্যাম্পিয়ন level এ পৌঁছেছো', requirement: '১০০০০ XP অর্জন করো' },
];

const BadgesPage: React.FC = () => {
  const { profile } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      supabase.from('user_badges' as any).select('*').eq('user_id', profile.id)
        .then(({ data }) => setEarnedBadges(data || []));
    }
  }, [profile]);

  const xp = (profile as any)?.xp_points || 0;
  const { current, next, progress, xpNeeded } = getLevelProgress(xp);
  const earnedSet = new Set(earnedBadges.map((b: any) => b.badge_name));

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold">🏅 ব্যাজ ও অর্জন</h2>

      <Card className="card-hover">
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-4xl">{current.name}</p>
          <p className="text-2xl font-bold text-primary">{xp} XP</p>
          {next && (
            <>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                পরের level <span className="font-semibold">{next.name}</span> এ আর <span className="text-primary font-bold">{xpNeeded} XP</span> বাকি
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_BADGES.map((badge) => {
          const earned = earnedSet.has(badge.name);
          const earnedData = earnedBadges.find((b: any) => b.badge_name === badge.name);
          return (
            <Card key={badge.name} className={`transition-all ${earned ? 'card-hover' : 'opacity-50 grayscale'}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-4xl">{badge.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                  {earned && earnedData ? (
                    <p className="text-xs text-primary mt-1">
                      ✅ অর্জিত — {new Date(earnedData.earned_at).toLocaleDateString('bn-BD')}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">🔒 {badge.requirement}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesPage;
