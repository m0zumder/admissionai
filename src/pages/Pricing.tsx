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
      { text: "দিনে ১০টি MCQ", included: true },
      { text: "দিনে ৩টি topic explanation", included: true },
      { text: "দিনে ২টি সৃজনশীল", included: true },
      { text: "দিনে ৩টি ছবি সমাধান", included: true },
      { text: "Mock Exam", included: false },
      { text: "Progress Analytics", included: false },
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
      { text: "সীমাহীন MCQ", included: true },
      { text: "সীমাহীন explanations", included: true },
      { text: "সীমাহীন সৃজনশীল", included: true },
      { text: "দিনে ২০টি ছবি সমাধান", included: true },
      { text: "Full Mock Exams", included: true },
      { text: "Progress Analytics", included: true },
    ],
    cta: "এখনই নিন",
    popular: true,
  },
  {
    name: "PREMIUM",
    price: "৳৩৯৯",
    period: "/মাস",
    plan_id: "premium",
    features: [
      { text: "সব কিছু Student plan এ", included: true },
      { text: "সীমাহীন ছবি সমাধান", included: true },
      { text: "Priority AI response", included: true },
      { text: "Personalized study plan", included: true },
      { text: "WhatsApp support", included: true },
      { text: "Notebook (আমার নোটবুক)", included: true },
    ],
    cta: "Premium নিন",
    popular: false,
  },
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
    <div className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-0">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">সাশ্রয়ী মূল্যে পড়াশোনা</h2>
        <p className="text-muted-foreground">তোমার পড়াশোনার জন্য সেরা প্ল্যান বেছে নাও</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = profile?.subscription_plan === plan.plan_id;
          const isLoading = loadingPlan === plan.plan_id;
          return (
            <Card key={plan.name} className={`relative ${plan.popular ? "border-2 border-secondary shadow-xl scale-105" : "border-border"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">সবচেয়ে জনপ্রিয়</div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-sm text-muted-foreground">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2 text-sm">
                      {f.included ? <Check className="h-4 w-4 text-success flex-shrink-0" /> : <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
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
