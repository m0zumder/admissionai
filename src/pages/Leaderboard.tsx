import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_exams: number;
  avg_score: number;
  best_score: number;
}

const Leaderboard: React.FC = () => {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const { data: sessions } = await supabase
      .from('mcq_sessions')
      .select('user_id, score_percentage, questions_attempted');

    if (!sessions || sessions.length === 0) {
      setLoading(false);
      return;
    }

    const userMap: Record<string, { scores: number[]; total: number }> = {};
    sessions.forEach((s) => {
      if (!userMap[s.user_id]) userMap[s.user_id] = { scores: [], total: 0 };
      userMap[s.user_id].scores.push(s.score_percentage);
      userMap[s.user_id].total += 1;
    });

    const userIds = Object.keys(userMap);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    const nameMap: Record<string, string> = {};
    profiles?.forEach((p) => { nameMap[p.id] = p.name || 'অজানা'; });

    const leaderboard: LeaderboardEntry[] = Object.entries(userMap)
      .map(([userId, data]) => ({
        user_id: userId,
        name: nameMap[userId] || 'অজানা',
        total_exams: data.total,
        avg_score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        best_score: Math.round(Math.max(...data.scores)),
      }))
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 20);

    setEntries(leaderboard);
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <FontAwesomeIcon icon="trophy" className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <FontAwesomeIcon icon="medal" className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <FontAwesomeIcon icon="star" className="h-6 w-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon="trophy" className="mr-2 text-secondary" />লিডারবোর্ড</h2>
      <p className="text-sm text-muted-foreground">সেরা পরীক্ষার্থীদের তালিকা — গড় স্কোর অনুযায়ী</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">টপ ২০</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">লোড হচ্ছে...</p>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              এখনো কোনো পরীক্ষার ডাটা নেই। MCQ অনুশীলন বা মক পরীক্ষা দাও!
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => {
                const isMe = entry.user_id === profile?.id;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isMe ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'
                    }`}
                  >
                    {getRankIcon(i)}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isMe ? 'text-primary' : ''}`}>
                        {entry.name} {isMe && '(তুমি)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.total_exams}টি পরীক্ষা
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{entry.avg_score}%</p>
                      <p className="text-xs text-muted-foreground">সর্বোচ্চ {entry.best_score}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
