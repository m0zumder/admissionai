import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "FREE",
    price: "৳০",
    period: "/মাস",
    features: [
      { text: "দিনে ১০টি MCQ", included: true },
      { text: "দিনে ৩টি topic explanation", included: true },
      { text: "দিনে ২টি সৃজনশীল", included: true },
      { text: "Mock Exam", included: false },
      { text: "Progress Analytics", included: false },
      { text: "Photo Scan", included: false },
    ],
    cta: "এখনই শুরু করো",
    popular: false,
  },
  {
    name: "STUDENT",
    price: "৳১৯৯",
    period: "/মাস",
    features: [
      { text: "সীমাহীন MCQ", included: true },
      { text: "সীমাহীন explanations", included: true },
      { text: "সীমাহীন সৃজনশীল", included: true },
      { text: "Full Mock Exams", included: true },
      { text: "Progress Analytics", included: true },
      { text: "Photo Scan", included: false },
    ],
    cta: "এখনই নিন",
    popular: true,
  },
  {
    name: "PREMIUM",
    price: "৳৩৯৯",
    period: "/মাস",
    features: [
      { text: "সব কিছু Student plan এ", included: true },
      { text: "Photo/Image scan", included: true },
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
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-0">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">সাশ্রয়ী মূল্যে পড়াশোনা</h2>
        <p className="text-muted-foreground">তোমার পড়াশোনার জন্য সেরা প্ল্যান বেছে নাও</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${plan.popular ? "border-2 border-secondary shadow-xl scale-105" : "border-border"}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">
                সবচেয়ে জনপ্রিয়
              </div>
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
                    {f.included ? (
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={f.included ? "" : "text-muted-foreground"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
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
