import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradeModal } from '@/components/SharedUI';

const MockExamPage: React.FC = () => {
  const { profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPremium = profile?.subscription_plan === 'student' || profile?.subscription_plan === 'premium';

  if (!isPremium) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pb-20 md:pb-0 pt-12">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold">মক পরীক্ষা</h2>
        <p className="text-muted-foreground">
          মক পরীক্ষা ফিচারটি Student এবং Premium প্ল্যানে পাওয়া যায়।
        </p>
        <Button onClick={() => setShowUpgrade(true)}>Upgrade করুন</Button>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <h2 className="text-2xl font-bold">📄 মক পরীক্ষা</h2>
      <p className="text-muted-foreground">পরীক্ষার পরিবেশে MCQ অনুশীলন করো</p>

      <Card>
        <CardHeader><CardTitle>পরীক্ষা সেটআপ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select>
            <SelectTrigger><SelectValue placeholder="পরীক্ষার ধরন নির্বাচন করো" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ssc">SSC</SelectItem>
              <SelectItem value="hsc">HSC</SelectItem>
              <SelectItem value="du">ঢাকা বিশ্ববিদ্যালয়</SelectItem>
              <SelectItem value="buet">বুয়েট</SelectItem>
              <SelectItem value="medical">মেডিকেল</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger><SelectValue placeholder="সময়কাল নির্বাচন করো" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">২৫ মিনিট</SelectItem>
              <SelectItem value="35">৩৫ মিনিট</SelectItem>
              <SelectItem value="60">৬০ মিনিট</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger><SelectValue placeholder="প্রশ্ন সংখ্যা" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">২৫টি</SelectItem>
              <SelectItem value="50">৫০টি</SelectItem>
              <SelectItem value="100">১০০টি</SelectItem>
            </SelectContent>
          </Select>

          <Button className="w-full" size="lg">পরীক্ষা শুরু করো 📝</Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        🔜 সম্পূর্ণ মক পরীক্ষা ফিচার শীঘ্রই আসছে!
      </p>
    </div>
  );
};

export default MockExamPage;
