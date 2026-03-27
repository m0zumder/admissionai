import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import logo from '@/assets/logo.png';

const features = [
  { icon: '🧠', title: 'MCQ Practice', desc: 'Board pattern অনুযায়ী হাজারো MCQ' },
  { icon: '💡', title: 'বুঝিয়ে দাও', desc: 'যেকোনো topic সহজ বাংলায়' },
  { icon: '✍️', title: 'সৃজনশীল Builder', desc: 'উদ্দীপক দাও, উত্তর পাও' },
  { icon: '📸', title: 'ছবি থেকে সমাধান', desc: 'ছবি তুলো, AI সমাধান দাও' },
  { icon: '📊', title: 'Progress Tracker', desc: 'কোথায় দুর্বল জানো' },
  { icon: '📄', title: 'মক পরীক্ষা', desc: 'পরীক্ষার পরিবেশে অনুশীলন' },
];

const stats = [
  { value: '১০,০০০+', label: 'শিক্ষার্থী' },
  { value: '৫০,০০০+', label: 'MCQ সমাধান' },
  { value: '৯৮%', label: 'সন্তুষ্ট' },
];

const testimonials = [
  { name: 'রাহাত', class: 'SSC 2025', text: 'Admission AI দিয়ে MCQ প্র্যাক্টিস করে আমার গণিতে A+ পাওয়ার আত্মবিশ্বাস বেড়েছে!' },
  { name: 'তানিয়া', class: 'HSC 2025', text: 'সৃজনশীল উত্তর Builder টা অসাধারণ! পরীক্ষায় সৃজনশীলে আর ভয় নেই।' },
  { name: 'ফাহিম', class: 'BUET Aspirant', text: 'Topic explainer ফিচারটা গেম চেঞ্জার। কঠিন টপিক সহজ বাংলায় বুঝিয়ে দেয়।' },
];

const competitorComparisons = [
  { icon: '🌐', title: 'Web-based — কোনো App লাগবে না', desc: 'Browser দিয়ে যেকোনো ডিভাইসে চলবে। ডেস্কটপ, ল্যাপটপ, ট্যাবলেট, মোবাইল — সব সাপোর্ট। App crash এর চিন্তা নেই।' },
  { icon: '🆓', title: 'Free তেই AI ফিচার', desc: 'MCQ, Topic Explain, সৃজনশীল, ছবি থেকে সমাধান — সব AI ফিচার Free plan এ পাওয়া যায়। কোনো Sales Call আসবে না।' },
  { icon: '🌙', title: 'Anytime, Anywhere — AI সবসময় Available', desc: 'রাত ৩টায়ও প্রশ্ন করো, সাথে সাথে উত্তর পাবে। কোনো ক্লাস cancel হবে না। 24/7/365 AI শিক্ষক তোমার পাশে।' },
  { icon: '🔒', title: 'Google Login — ঝামেলা নেই', desc: 'শুধু Google দিয়ে লগ ইন করো। কোনো OTP ঝামেলা নেই।' },
  { icon: '📸', title: 'ছবি তুলে সমাধান পাও', desc: 'প্রশ্নের ছবি তোলো — AI ধাপে ধাপে বাংলায় সমাধান দেবে। গণিত, পদার্থবিজ্ঞান, রসায়ন সব কাজ করে।' },
  { icon: '💸', title: 'মাত্র ৳199/মাস', desc: 'Shikho ৳800-2000, 10MS ৳500+। আমাদের Student Plan মাত্র ৳199/মাস। সেরা ফিচার, সেরা দাম।' },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Slim yellow web-first banner */}
      <div className="bg-amber-400 text-amber-950 text-center py-2 px-4 text-sm font-medium">
        ✅ কোনো App ইনস্টল লাগবে না — Browser এই চলে | 🌙 24/7 Available AI Tutor - মাত্র ৳199/মাস
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
            <img src={logo} alt="Admission AI" className="h-9 w-9 rounded-full" />
            Admission AI
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">ফিচারস</a>
            <a href="#why-us" className="text-muted-foreground hover:text-foreground transition-colors">কেন আমরা?</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">প্রাইসিং</a>
            <Link to="/login">
              <Button variant="outline" size="sm">লগ ইন</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">বিনামূল্যে শুরু করো</Button>
            </Link>
          </div>
          <Link to="/login" className="md:hidden">
            <Button size="sm">শুরু করো</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 animate-fade-in">
            AI দিয়ে পড়াশোনা <br />
            <span className="text-primary hero-glow">এখন সহজ</span>
          </h1>
          <p className="text-sm font-medium tracking-widest uppercase text-primary/70 mb-3 animate-fade-in-delay-1">Smart Learning, Simplified Prep</p>
          <p className="text-lg md:text-xl text-muted-foreground mb-2 max-w-2xl mx-auto animate-fade-in-delay-2">
            SSC, HSC এবং ভর্তি পরীক্ষার জন্য বাংলাদেশের সেরা AI শিক্ষক
          </p>
          <p className="text-sm text-primary/80 font-semibold mb-6 animate-fade-in-delay-2">
            🕐 Anytime, Anywhere — দিনে রাতে যখন খুশি পড়ো, AI সবসময় তোমার পাশে
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
            <Link to="/login">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto btn-ripple hover:scale-105 transition-transform">
                বিনামূল্যে শুরু করো
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto hover:scale-105 transition-transform">
                কীভাবে কাজ করে?
              </Button>
            </a>
          </div>

          {/* Floating preview cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Card className="animate-slide-left animate-float glass-card card-hover">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">📝 Sample MCQ</p>
                <p className="text-sm text-muted-foreground">পানি কত ডিগ্রি সেলসিয়াসে ফুটে?</p>
                <div className="mt-2 space-y-1">
                  <div className="text-xs bg-muted rounded px-2 py-1">ক) ৫০°C</div>
                  <div className="text-xs bg-success/20 text-success rounded px-2 py-1 font-semibold">খ) ১০০°C ✓</div>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-slide-right animate-float-delayed glass-card card-hover">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">📸 ছবি থেকে সমাধান</p>
                <p className="text-sm text-muted-foreground">
                  প্রশ্নের ছবি তোলো → AI ধাপে ধাপে সমাধান দেয় বাংলায়!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">আমাদের ফিচারস</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, index) => (
            <Card key={f.title} className="text-center hover:shadow-xl transition-all border-border/50 card-hover animate-feature-pop" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="text-4xl mb-4 animate-bounce-in" style={{ animationDelay: `${index * 0.1 + 0.3}s` }}>{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold">{s.value}</div>
                <div className="text-sm opacity-80 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us - Competitor pain points */}
      <section id="why-us" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">কেন Admission AI সেরা?</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Shikho, 10 Minute School, HulkenStein — সবার সীমাবদ্ধতা আমরা সমাধান করেছি
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {competitorComparisons.map((item, index) => (
            <Card key={item.title} className="border-border/50 card-hover animate-feature-pop" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">শিক্ষার্থীদের মতামত</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <Card key={t.name} className="border-border/50 card-hover animate-feature-pop" style={{ animationDelay: `${index * 0.15}s` }}>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-secondary text-secondary animate-bounce-in" style={{ animationDelay: `${index * 0.15 + i * 0.05 + 0.3}s` }} />)}
                </div>
                <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.class}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">সাশ্রয়ী মূল্য</h2>
        <p className="text-center text-muted-foreground mb-12">তোমার পড়াশোনার জন্য সেরা প্ল্যান বেছে নাও</p>
        <div className="text-center">
          <Link to="/pricing">
            <Button size="lg">সব প্ল্যান দেখো</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <img src={logo} alt="Admission AI" className="h-12 w-12 rounded-full mx-auto mb-3" />
          <p className="text-xl font-bold mb-2">Admission AI</p>
          <p className="text-sm opacity-70 mb-2">Smart Learning, Simplified Prep</p>
          <p className="text-sm opacity-70 mb-4">বাংলাদেশের শিক্ষার্থীদের জন্য AI-powered শিক্ষা প্ল্যাটফর্ম</p>
          <p className="text-xs opacity-50">© 2026 Admission AI. All rights reserved Mozlish Studio.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
