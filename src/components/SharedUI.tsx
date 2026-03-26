import React from 'react';

export const ThinkingDots: React.FC = () => (
  <div className="flex items-center gap-1 text-muted-foreground">
    <span>AI ভাবছে</span>
    <span className="thinking-dots">
      <span>.</span><span>.</span><span>.</span>
    </span>
  </div>
);

export const UpgradeModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2">⭐ আপগ্রেড করুন!</h2>
        <p className="text-muted-foreground mb-4">
          আজকের ফ্রি সীমা শেষ হয়ে গেছে। আনলিমিটেড অ্যাক্সেসের জন্য আপগ্রেড করুন।
        </p>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2"><span className="text-success">✓</span> সীমাহীন MCQ</li>
          <li className="flex items-center gap-2"><span className="text-success">✓</span> সীমাহীন explanations</li>
          <li className="flex items-center gap-2"><span className="text-success">✓</span> Full Mock Exams</li>
          <li className="flex items-center gap-2"><span className="text-success">✓</span> Progress Analytics</li>
        </ul>
        <div className="flex gap-3">
          <a href="/pricing" className="flex-1 bg-primary text-primary-foreground text-center py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Upgrade করুন
          </a>
          <button onClick={onClose} className="px-4 py-3 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
            পরে
          </button>
        </div>
      </div>
    </div>
  );
};
