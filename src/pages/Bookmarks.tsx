import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const BookmarksPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (user) loadBookmarks();
  }, [user]);

  const loadBookmarks = async () => {
    const { data } = await supabase.from('bookmarks' as any).select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setBookmarks(data || []);
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks' as any).delete().eq('id', id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast({ title: '🗑️ মুছে ফেলা হয়েছে' });
  };

  const filtered = bookmarks.filter(b => {
    if (tab !== 'all' && b.content_type !== tab) return false;
    if (search && !b.content_preview.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon="bookmark" className="mr-2 text-primary" />বুকমার্কস</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="বুকমার্ক খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">সব</TabsTrigger>
          <TabsTrigger value="mcq">MCQ</TabsTrigger>
          <TabsTrigger value="explanation">ব্যাখ্যা</TabsTrigger>
          <TabsTrigger value="formula">সূত্র</TabsTrigger>
          <TabsTrigger value="srijonshil">সৃজনশীল</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FontAwesomeIcon icon="bookmark" className="text-4xl mb-3 opacity-30" />
            <p className="font-medium">এখনো কিছু bookmark করোনি</p>
            <p className="text-sm mt-1"><FontAwesomeIcon icon="bookmark" className="mr-1" />চাপো!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b: any) => (
            <Card key={b.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{b.content_preview}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {b.subject && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{b.subject}</span>}
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{b.content_type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString('bn-BD')}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => deleteBookmark(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
