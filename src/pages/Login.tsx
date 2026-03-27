import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const AVATARS = ["📚", "🎓", "👨‍🎓", "👩‍🎓", "🦁", "🐯", "⚡", "🔥", "🌟", "💪", "🏆", "🎯"];

const EXAM_OPTIONS = [
  { id: "SSC 2025", icon: "📝", label: "SSC 2025" },
  { id: "SSC 2026", icon: "📝", label: "SSC 2026" },
  { id: "HSC 2025", icon: "📖", label: "HSC 2025" },
  { id: "HSC 2026", icon: "📖", label: "HSC 2026" },
  { id: "Medical ভর্তি", icon: "🏥", label: "Medical ভর্তি" },
  { id: "BUET ভর্তি", icon: "⚙️", label: "BUET ভর্তি" },
  { id: "GST", icon: "🏛️", label: "GST (সরকারি বিশ্ববিদ্যালয়)" },
  { id: "ঢাকা বিশ্ববিদ্যালয়", icon: "🎓", label: "ঢাকা বিশ্ববিদ্যালয়" },
];

const HSC_STREAMS = [
  { id: "science", icon: "🔬", label: "বিজ্ঞান (Science)" },
  { id: "humanities", icon: "📜", label: "মানবিক (Humanities)" },
  { id: "commerce", icon: "💼", label: "ব্যবসায় শিক্ষা (Commerce)" },
];

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [name, setName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("📚");
  const [targetExam, setTargetExam] = useState("");
  const [hscStream, setHscStream] = useState("");
  const [examDate, setExamDate] = useState<Date | undefined>();
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const isHSC = targetExam.includes("HSC");
  // Total steps: 4 normally, 5 if HSC (stream selection added)
  const totalSteps = isHSC ? 5 : 4;

  React.useEffect(() => {
    if (user && onboardingStep === 0) navigate("/dashboard");
  }, [user, onboardingStep]);

  // Load subjects when exam (and optionally stream) is selected
  React.useEffect(() => {
    if (targetExam) {
      const classLevel = targetExam.includes("SSC") ? "SSC" : targetExam.includes("HSC") ? "HSC" : "Admission";

      let query = supabase.from("subjects").select("*").eq("class_level", classLevel);

      // For HSC, filter by stream if selected
      if (classLevel === "HSC" && hscStream) {
        query = query.or(`stream.eq.${hscStream},stream.eq.compulsory`);
      }

      query.then(({ data }) => setSubjects(data || []));
    }
  }, [targetExam, hscStream]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setOnboardingStep(1);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleOnboardingComplete = async () => {
    if (!name || !targetExam) {
      toast({ title: "নাম ও পরীক্ষা নির্বাচন করো", variant: "destructive" });
      return;
    }
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const classLevel = targetExam.includes("SSC") ? "SSC" : targetExam.includes("HSC") ? "HSC" : "Admission";
      await supabase
        .from("profiles")
        .update({
          name,
          avatar_emoji: avatarEmoji,
          class_level: classLevel,
          target_exam: targetExam + (hscStream ? ` (${hscStream})` : ""),
          exam_date: examDate ? format(examDate, "yyyy-MM-dd") : null,
        })
        .eq("id", user.id);

      if (weakSubjects.length > 0) {
        const { data: topicsData } = await supabase
          .from("topics")
          .select("id, subject_id")
          .in("subject_id", weakSubjects);
        if (topicsData && topicsData.length > 0) {
          const weakEntries = topicsData.slice(0, 5).map((t) => ({
            user_id: user.id,
            topic_id: t.id,
            wrong_count: 1,
          }));
          await supabase.from("weak_topics").insert(weakEntries);
        }
      }
    }
    setLoading(false);
    navigate("/dashboard");
  };

  // Map onboarding step to actual content step
  // Steps: 1=Name, 2=Exam, 2.5=HSC Stream (only if HSC), 3=Date, 4=Weak subjects
  const getContentStep = () => {
    if (!isHSC) return onboardingStep; // 1,2,3,4
    // HSC: 1=name, 2=exam, 3=stream, 4=date, 5=weak
    if (onboardingStep <= 2) return onboardingStep;
    if (onboardingStep === 3) return "stream";
    if (onboardingStep === 4) return 3; // date
    return 4; // weak subjects
  };

  const currentContent = getContentStep();

  if (onboardingStep > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 w-12 rounded-full transition-colors ${i + 1 <= onboardingStep ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <CardTitle className="text-center text-2xl">
              {currentContent === 1 && "🎓 তোমার পরিচয়"}
              {currentContent === 2 && "🎯 তোমার লক্ষ্য"}
              {currentContent === "stream" && "📚 তোমার বিভাগ"}
              {currentContent === 3 && "📅 পরীক্ষার তারিখ"}
              {currentContent === 4 && "📚 দুর্বল বিষয়"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Name + Avatar */}
            {currentContent === 1 && (
              <>
                <div>
                  <Label>তোমার নাম কী?</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="নাম লেখো" />
                </div>
                <div>
                  <Label>একটি ইমোজি অ্যাভাটার বেছে নাও</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setAvatarEmoji(emoji)}
                        className={`text-2xl p-2 rounded-lg border transition-all ${avatarEmoji === emoji ? "bg-primary/20 border-primary scale-110" : "border-border hover:border-primary/50"}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (name) setOnboardingStep(2);
                    else toast({ title: "নাম লেখো", variant: "destructive" });
                  }}
                >
                  পরবর্তী →
                </Button>
              </>
            )}

            {/* Step 2: Target Exam */}
            {currentContent === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {EXAM_OPTIONS.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => {
                        setTargetExam(exam.id);
                        setHscStream("");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${targetExam === exam.id ? "bg-primary text-primary-foreground border-primary shadow-lg" : "bg-card border-border hover:border-primary/50"}`}
                    >
                      <span className="text-xl block mb-1">{exam.icon}</span>
                      <span className="text-sm font-medium">{exam.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOnboardingStep(1)}>
                    ← আগে
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (!targetExam) {
                        toast({ title: "পরীক্ষা নির্বাচন করো", variant: "destructive" });
                        return;
                      }
                      setOnboardingStep(3);
                    }}
                  >
                    পরবর্তী →
                  </Button>
                </div>
              </>
            )}

            {/* Step: HSC Stream Selection */}
            {currentContent === "stream" && (
              <>
                <p className="text-sm text-muted-foreground">তুমি কোন বিভাগে পড়ছো?</p>
                <div className="grid grid-cols-1 gap-3">
                  {HSC_STREAMS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setHscStream(s.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${hscStream === s.id ? "bg-primary text-primary-foreground border-primary shadow-lg" : "bg-card border-border hover:border-primary/50"}`}
                    >
                      <span className="text-xl mr-3">{s.icon}</span>
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOnboardingStep(2)}>
                    ← আগে
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (!hscStream) {
                        toast({ title: "বিভাগ নির্বাচন করো", variant: "destructive" });
                        return;
                      }
                      setOnboardingStep(4);
                    }}
                  >
                    পরবর্তী →
                  </Button>
                </div>
              </>
            )}

            {/* Step: Exam Date */}
            {currentContent === 3 && (
              <>
                <Label>তোমার পরীক্ষা কবে?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !examDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {examDate ? format(examDate, "PPP") : "তারিখ বেছে নাও"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={examDate}
                      onSelect={setExamDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {examDate && (
                  <div className="text-center p-4 bg-primary/10 rounded-xl">
                    <p className="text-2xl font-bold text-primary">
                      পরীক্ষার আর {differenceInDays(examDate, new Date())} দিন বাকি 🔥
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOnboardingStep(isHSC ? 3 : 2)}>
                    ← আগে
                  </Button>
                  <Button className="flex-1" onClick={() => setOnboardingStep(isHSC ? 5 : 4)}>
                    পরবর্তী →
                  </Button>
                </div>
              </>
            )}

            {/* Step: Weak Subjects */}
            {currentContent === 4 && (
              <>
                <p className="text-sm text-muted-foreground">কোন বিষয়গুলো কঠিন লাগে? (একাধিক বাছাই করতে পারো)</p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        setWeakSubjects((prev) =>
                          prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                        )
                      }
                      className={`px-3 py-2 rounded-full border text-sm transition-all ${weakSubjects.includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}
                    >
                      {s.icon} {s.name_bn}
                    </button>
                  ))}
                  {subjects.length === 0 && <p className="text-sm text-muted-foreground">বিষয় লোড হচ্ছে...</p>}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOnboardingStep(isHSC ? 4 : 3)}>
                    ← আগে
                  </Button>
                  <Button className="flex-1" onClick={handleOnboardingComplete} disabled={loading}>
                    {loading ? "সেভ হচ্ছে..." : "শুরু করো 🚀"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-2">
            <img src={logo} alt="Admission AI" className="h-14 w-14 rounded-full" />
            <CardTitle className="text-center text-2xl">Admission AI</CardTitle>
            <p className="text-xs font-medium tracking-widest uppercase text-primary/70">
              Smart Learning, Simplified Prep
            </p>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            {isSignUp ? "নতুন অ্যাকাউন্ট তৈরি করো" : "তোমার অ্যাকাউন্টে লগ ইন করো"}
          </p>
        </CardHeader>
        <CardContent>
          {/* Google login first - prominent */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (error) toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google দিয়ে লগ ইন করো
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">অথবা ইমেইল দিয়ে</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label>ইমেইল</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <Label>পাসওয়ার্ড</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : isSignUp ? "সাইন আপ করো" : "লগ ইন করো"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-3">ফোন নম্বর লাগবে না🔒</p>

          <p className="text-center text-sm mt-4 text-muted-foreground">
            {isSignUp ? "আগে থেকে অ্যাকাউন্ট আছে?" : "অ্যাকাউন্ট নেই?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-semibold hover:underline">
              {isSignUp ? "লগ ইন করো" : "সাইন আপ করো"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
