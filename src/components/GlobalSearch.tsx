import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, FileText } from 'lucide-react';

const SEARCH_ITEMS = [
  { title: 'MCQ অনুশীলন', path: '/mcq', category: '📚 ফিচার', icon: BookOpen },
  { title: 'বুঝিয়ে দাও', path: '/explain', category: '📚 ফিচার', icon: FileText },
  { title: 'সৃজনশীল Builder', path: '/srijonshil', category: '📚 ফিচার', icon: FileText },
  { title: 'মক পরীক্ষা', path: '/mock-exam', category: '📚 ফিচার', icon: FileText },
  { title: 'Custom Exam', path: '/custom-exam', category: '📚 ফিচার', icon: FileText },
  { title: 'ছবি থেকে সমাধান', path: '/photo-solve', category: '📚 ফিচার', icon: FileText },
  { title: 'নোটবুক', path: '/notebook', category: '📚 ফিচার', icon: FileText },
  { title: 'ভর্তি সম্ভাবনা', path: '/chance', category: '📚 ফিচার', icon: FileText },
  { title: 'সূত্র শীট', path: '/formula-sheet', category: '📐 সূত্র', icon: FileText },
  { title: 'পড়ার পরিকল্পনা', path: '/planner', category: '📅 Planner', icon: FileText },
  { title: 'বুকমার্কস', path: '/bookmarks', category: '📚 ফিচার', icon: FileText },
  { title: 'ব্যাজ', path: '/badges', category: '🏅 অর্জন', icon: FileText },
  { title: 'লিডারবোর্ড', path: '/leaderboard', category: '🏆 অর্জন', icon: FileText },
  { title: 'সেটিংস', path: '/settings', category: '⚙️ সেটিংস', icon: FileText },
  { title: 'প্রগ্রেস', path: '/progress', category: '📊 বিশ্লেষণ', icon: FileText },
  // Formulas
  { title: 'v = u + at (গতি সূত্র)', path: '/formula-sheet', category: '⚡ সূত্র', icon: FileText },
  { title: 'F = ma (নিউটনের সূত্র)', path: '/formula-sheet', category: '⚡ সূত্র', icon: FileText },
  { title: 'V = IR (ওহমের সূত্র)', path: '/formula-sheet', category: '⚡ সূত্র', icon: FileText },
  { title: 'PV = nRT (গ্যাস সূত্র)', path: '/formula-sheet', category: '🧪 সূত্র', icon: FileText },
  { title: 'sin²θ + cos²θ = 1', path: '/formula-sheet', category: '📐 সূত্র', icon: FileText },
  // Subjects
  { title: 'পদার্থবিজ্ঞান', path: '/mcq', category: '📖 বিষয়', icon: BookOpen },
  { title: 'রসায়ন', path: '/mcq', category: '📖 বিষয়', icon: BookOpen },
  { title: 'গণিত', path: '/mcq', category: '📖 বিষয়', icon: BookOpen },
  { title: 'জীববিজ্ঞান', path: '/mcq', category: '📖 বিষয়', icon: BookOpen },
  { title: 'ইংরেজি', path: '/mcq', category: '📖 বিষয়', icon: BookOpen },
];

export const GlobalSearch: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filtered = query.trim()
    ? SEARCH_ITEMS.filter(i => i.title.toLowerCase().includes(query.toLowerCase()) || i.category.toLowerCase().includes(query.toLowerCase()))
    : SEARCH_ITEMS.slice(0, 8);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <div className="flex items-center border-b px-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="যেকোনো topic, chapter, বা সূত্র খুঁজুন..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 text-base"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">কিছু পাওয়া যায়নি</p>
          ) : (
            filtered.map((item, i) => (
              <button key={i} onClick={() => handleSelect(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors">
                <span className="text-xs text-muted-foreground w-20 shrink-0">{item.category}</span>
                <span className="text-sm font-medium">{item.title}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex gap-4">
          <span>⌘K বা Ctrl+K দিয়ে খুলো</span>
          <span>↑↓ নেভিগেট</span>
          <span>Enter সিলেক্ট</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const useGlobalSearch = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
};
