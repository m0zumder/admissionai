import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

const LEVELS = [
  { name: 'নবীন 📖', min: 0 },
  { name: 'শিক্ষার্থী 🎒', min: 500 },
  { name: 'মেধাবী ⭐', min: 2000 },
  { name: 'কৃতি 🏅', min: 5000 },
  { name: 'চ্যাম্পিয়ন 🏆', min: 10000 },
];

export function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(xp: number) {
  for (const l of LEVELS) {
    if (xp < l.min) return l;
  }
  return null;
}

export function getLevelProgress(xp: number) {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return { current, next: null, progress: 100, xpNeeded: 0 };
  const range = next.min - current.min;
  const done = xp - current.min;
  return { current, next, progress: Math.round((done / range) * 100), xpNeeded: next.min - xp };
}

export function useXP() {
  const { user, refreshProfile } = useAuth();

  const addXP = useCallback(async (amount: number, reason?: string) => {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('xp_points, weekly_xp, weekly_xp_reset_date, study_streak, last_activity_date').eq('id', user.id).single();
    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const monday = getMonday();
    const weeklyReset = (profile as any).weekly_xp_reset_date < monday;

    const newXP = (profile as any).xp_points + amount;
    const newLevel = getLevel(newXP).name;

    // Streak logic
    const lastActivity = (profile as any).last_activity_date;
    let newStreak = (profile as any).study_streak || 0;
    if (lastActivity !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastActivity === yesterdayStr) {
        newStreak += 1;
      } else if (!lastActivity) {
        newStreak = 1;
      } else {
        newStreak = 1; // streak broken
      }
    }

    await supabase.from('profiles').update({
      xp_points: newXP,
      user_level: newLevel,
      weekly_xp: weeklyReset ? amount : (profile as any).weekly_xp + amount,
      weekly_xp_reset_date: weeklyReset ? monday : (profile as any).weekly_xp_reset_date,
      study_streak: newStreak,
      last_activity_date: today,
    } as any).eq('id', user.id);

    await refreshProfile();
    return newXP;
  }, [user, refreshProfile]);

  const awardBadge = useCallback(async (name: string, emoji: string, description: string) => {
    if (!user) return;
    await supabase.from('user_badges' as any).insert({
      user_id: user.id,
      badge_name: name,
      badge_emoji: emoji,
      badge_description: description,
    }).select();
  }, [user]);

  const checkAndAwardBadges = useCallback(async () => {
    if (!user) return;
    // Check MCQ count
    const { count: mcqCount } = await supabase.from('mcq_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { data: existing } = await supabase.from('user_badges' as any).select('badge_name').eq('user_id', user.id);
    const earned = new Set((existing || []).map((b: any) => b.badge_name));

    if (mcqCount && mcqCount >= 1 && !earned.has('প্রথম পদক্ষেপ')) {
      await awardBadge('প্রথম পদক্ষেপ', '🥇', 'প্রথম MCQ সম্পন্ন');
    }
    if (mcqCount && mcqCount >= 100 && !earned.has('MCQ সেঞ্চুরি')) {
      await awardBadge('MCQ সেঞ্চুরি', '💯', '১০০টি MCQ সম্পন্ন');
    }
    if (mcqCount && mcqCount >= 1000 && !earned.has('হাজারিক')) {
      await awardBadge('হাজারিক', '⚡', '১০০০টি MCQ সম্পন্ন');
    }

    const { data: profile } = await supabase.from('profiles').select('study_streak, xp_points, user_level').eq('id', user.id).single();
    if (profile) {
      if ((profile as any).study_streak >= 7 && !earned.has('৭ দিনের যোদ্ধা')) {
        await awardBadge('৭ দিনের যোদ্ধা', '🔥', '৭ দিনের streak অর্জন');
      }
      if ((profile as any).user_level === 'চ্যাম্পিয়ন 🏆' && !earned.has('চ্যাম্পিয়ন')) {
        await awardBadge('চ্যাম্পিয়ন', '👑', 'চ্যাম্পিয়ন level এ পৌঁছেছো');
      }
    }

    const { count: srijonshilCount } = await supabase.from('creative_answers').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    if (srijonshilCount && srijonshilCount >= 10 && !earned.has('সৃজনশীল বিশেষজ্ঞ')) {
      await awardBadge('সৃজনশীল বিশেষজ্ঞ', '✍️', '১০টি সৃজনশীল উত্তর তৈরি');
    }
  }, [user, awardBadge]);

  return { addXP, awardBadge, checkAndAwardBadges };
}

function getMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}
