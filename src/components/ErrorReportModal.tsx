import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ISSUES = [
  { id: 'wrong_answer', label: 'ভুল উত্তর দেওয়া আছে' },
  { id: 'typo', label: 'প্রশ্নে type আছে' },
  { id: 'unclear', label: 'প্রশ্নটি অস্পষ্ট' },
  { id: 'other', label: 'অন্য সমস্যা' },
];

export const ErrorReportModal: React.FC<{
  open: boolean;
  onClose: () => void;
  questionText: string;
  subject?: string;
}> = ({ open, onClose, questionText, subject }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected || !user) return;
    setSubmitting(true);
    await supabase.from('error_reports' as any).insert({
      user_id: user.id,
      question_text: questionText.slice(0, 500),
      issue_type: selected,
      subject: subject || null,
    });
    setSubmitting(false);
    toast({ title: '✅ রিপোর্ট জমা হয়েছে', description: 'ধন্যবাদ! আমরা যাচাই করবো।' });
    onClose();
    setSelected('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>⚠️ সমস্যা রিপোর্ট করো</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">কী সমস্যা?</p>
          {ISSUES.map(issue => (
            <button key={issue.id} onClick={() => setSelected(issue.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selected === issue.id ? 'bg-primary/10 border-primary' : 'bg-muted border-border hover:border-primary/50'}`}>
              <span className="text-sm">{issue.label}</span>
            </button>
          ))}
          <Button className="w-full" onClick={handleSubmit} disabled={!selected || submitting}>
            {submitting ? 'জমা হচ্ছে...' : 'রিপোর্ট জমা দাও'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
