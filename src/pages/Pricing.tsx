import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const plans = [
  {
    name: "FREE",
    price: "৳০",
    period: "/মাস",
    plan_id: "free",
    features: [
      { text: "দিনে ২০টি MCQ", included: true },
      { text: "দিনে ৩টি AI explanation", included: true },
      { text: "দিনে ৩টি সৃজনশীল", included: true },
      { text: "দিনে ৫টি photo solve", included: true },
      { text: "Formula sheet সম্পূর্ণ বিনামূল্যে", included: true },
      { text: "১টি notebook", included: true },
      { text: "Leaderboard দেখা", included: true },
      { text: "Full mock exam", included: false },
      { text: "Customized mock exam builder", included: false },
      { text: "Admission chance calculator", included: false },
      { text: "Study planner + reminder", included: false },
      { text: "Negative marking simulator", included: false },
      { text: "Friend challenge mode", included: false },
      { text: "Parent dashboard", included: false },
      { text: "Badges এবং XP (শুধু দেখতে পাবে)", included: false },
    ],
    cta: "এখনই শুরু করো",
    popular: false,
  },
  {
    name: "STUDENT",
    price: "৳১৯৯",
    period: "/মাস",
    plan_id: "student",
    features: [
      { text: "সীমাহীন MCQ ও explanations", included: true },
      { text: "সীমাহীন সৃজনশীল উত্তর", included: true },
      { text: "দিনে ২০টি photo solve", included: true },
      { text: "৫টি notebook (৩ file each)", included: true },
      { text: "সব ধরনের full mock exam", included: true },
      { text: "Customized mock exam builder", included: true },
      { text: "Admission chance calculator", included: true },
      { text: "Reverse study planner + daily reminder", included: true },
      { text: "Negative marking simulator", included: true },
      { text: "Friend challenge mode + leaderboard", included: true },
      { text: "Parent dashboard", included: true },
      { text: "সম্পূর্ণ XP + badges + levels system", included: true },
      { text: "Bookmark system", included: true },
      { text: "Dark mode + font size control", included: true },
      { text: "Priority AI response", included: false },
      { text: "BUET written practice", included: false },
      { text: "Unlimited photo solve", included: false },
    ],
    cta: "এখনই নিন",
    popular: true,
  },
  {
    name: "STUDENT + PREMIUM",
    price: "৳৪৯৯",
    period: "/মাস",
    plan_id: "premium",
    features: [
      { text: "সব Student plan features", included: true },
      { text: "সীমাহীন photo solve (unlimited)", included: true },
      { text: "২০টি notebook (৫ file each)", included: true },
      { text: "BUET written exam practice + AI grading", included: true },
      { text: "সর্বোচ্চ দ্রুত AI response (priority)", included: true },
      { text: "Custom mock exam builder (advanced)", included: true },
      { text: "Cross-exam smart preparation planner", included: true },
      { text: "Detailed admission strategy report", included: true },
      { text: "Streak freeze (unlimited)", included: true },
      { text: "WhatsApp support (direct)", included: true },
      { text: "Early access to new features", included: true },
    ],
    cta: "Premium নিন",
    popular: false,
  },
];

const comparisonData = [
  { feature: "App লাগে?", us: "❌ না", comp1: "✅ হ্যাঁ", comp2: "✅ হ্যাঁ" },
  { feature: "Free তে AI?", us: "✅ হ্যাঁ", comp1: "❌ না", comp2: "❌ না" },
  { feature: "বই Upload?", us: "✅ হ্যাঁ", comp1: "❌ না", comp2: "❌ না" },
  { feature: "সৃজনশীল AI?", us: "✅ হ্যাঁ", comp1: "❌ না", comp2: "❌ না" },
  { feature: "ছবি Solve?", us: "✅ হ্যাঁ", comp1: "❌ না", comp2: "❌ না" },
  { feature: "মাসিক মূল্য", us: "৳১৯৯", comp1: "৳৮০০+", comp2: "৳৫০০+" },
];

const PricingPage: React.FC = () => {
  const { profile, session } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePayment = async (planId: string) => {
    if (planId === "free") return;
    if (!session) { toast.error("পেমেন্ট করতে প্রথমে লগ ইন করো"); return; }
    if (profile?.subscription_plan === planId) { toast.info("তুমি ইতিমধ্যে এই প্ল্যানে আছো!"); return; }
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("init-payment", { body: { plan: planId } });
      if (error) throw error;
      if (data?.url) { window.location.href = data.url; } else { throw new Error("No payment URL received"); }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error("পেমেন্ট শুরু করতে সমস্যা হয়েছে। আবার চেষ্টা করো।");
    } finally { setLoadingPlan(null); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 md:pb-0">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">সাশ্রয়ী মূল্যে পড়াশোনা</h2>
        <p className="text-muted-foreground">তোমার পড়াশোনার জন্য সেরা প্ল্যান বেছে নাও</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = profile?.subscription_plan === plan.plan_id;
          const isLoading = loadingPlan === plan.plan_id;
          return (
            <Card key={plan.name} className={`relative ${plan.popular ? "border-2 border-secondary shadow-xl md:scale-105" : "border-border"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">⭐ সবচেয়ে জনপ্রিয়</div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-sm text-muted-foreground">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      {f.included ? <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" /> : <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                      <span className={f.included ? "" : "text-muted-foreground"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} disabled={isCurrentPlan || isLoading || plan.plan_id === "free"} onClick={() => handlePayment(plan.plan_id)}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isCurrentPlan ? "✓ বর্তমান প্ল্যান" : plan.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison table */}
      <div>
        <h3 className="text-2xl font-bold text-center mb-6">কেন Admission AI?</h3>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  <th className="text-center p-3 font-semibold text-primary">Admission AI</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Popular platform</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Other's Platform</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium">{row.feature}</td>
                    <td className="p-3 text-center font-semibold text-primary">{row.us}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.comp1}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.comp2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Card className="inline-block">
          <CardContent className="p-6">
            <p className="font-semibold mb-2">💳 পেমেন্ট পদ্ধতি</p>
            <p className="text-sm text-muted-foreground mb-4">bKash / Nagad / Card দিয়ে পেমেন্ট করুন</p>
            <a href="https://wa.me/8801609059992" target="_blank" rel="noopener noreferrer">
              <Button variant="outline">WhatsApp এ যোগাযোগ করুন</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingPage;
