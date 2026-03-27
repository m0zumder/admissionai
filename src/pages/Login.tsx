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
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap, faBullseye, faBook, faCalendarDays, faBookOpen,
  faUserGraduate, faPaw, faBolt, faFire, faStar, faDumbbell, faTrophy,
  faPenToSquare, faHospital, faGear, faLandmark, faMicroscope, faScroll,
  faBriefcase, faArrowRight, faArrowLeft, faRocket, faUsers
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import logo from "@/assets/logo.png";

const AVATARS = [
  { emoji: faBookOpen, label: "BookOpen" },
  { emoji: faGraduationCap, label: "GraduationCap" },
  { emoji: faUserGraduate, label: "UserGraduate" },
  { emoji: faUserGraduate, label: "UserGraduate2" },
  { emoji: faPaw, label: "Paw1" },
  { emoji: faPaw, label: "Paw2" },
  { emoji: faBolt, label: "Bolt" },
  { emoji: faFire, label: "Fire" },
  { emoji: faStar, label: "Star" },
  { emoji: faDumbbell, label: "Dumbbell" },
  { emoji: faTrophy, label: "Trophy" },
  { emoji: faBullseye, label: "Bullseye" },
];

const EXAM_OPTIONS = [
  { id: "SSC 2025", icon: faPenToSquare, label: "SSC 2025" },
  { id: "SSC 2026", icon: faPenToSquare, label: "SSC 2026" },
  { id: "HSC 2025", icon: faBookOpen, label: "HSC 2025" },
  { id: "HSC 2026", icon: faBookOpen, label: "HSC 2026" },
  { id: "Medical ভর্তি", icon: faHospital, label: "Medical ভর্তি" },
  { id: "BUET ভর্তি", icon: faGear, label: "BUET ভর্তি" },
  { id: "GST", icon: faLandmark, label: "GST (সরকারি বিশ্ববিদ্যালয়)" },
  { id: "ঢাকা বিশ্ববিদ্যালয়", icon: faGraduationCap, label: "ঢাকা বিশ্ববিদ্যালয়" },
];

const HSC_STREAMS = [
  { id: "science", icon: faMicroscope, label: "বিজ্ঞান (Science)" },
  { id: "humanities", icon: faScroll, label: "মানবিক (Humanities)" },
  { id: "commerce", icon: faBriefcase, label: "ব্যবসায় শিক্ষা (Commerce)" },
];

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [name, setName] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [targetExam, setTargetExam] = useState("");
  const [hscStream, setHscStream] = useState("");
  const [examDate, setExamDate] = useState<Date | undefined>();
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [parentLinkingCode, setParentLinkingCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const isHSC = targetExam.includes("HSC");
  const totalSteps = isHSC ? 5 : 4;

  React.useEffect(() => {
    if (user && onboardingStep === 0) navigate("/dashboard");
  }, [user, onboardingStep]);

  React.useEffect(() => {
    if (targetExam) {
      const classLevel = targetExam.includes("SSC") ? "SSC" : targetExam.includes("HSC") ? "HSC" : "Admission";
      let query = supabase.from("subjects").select("*").eq("class_level", classLevel);
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
        if (isParent) {
          // Parent signup - link to child
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser && parentLinkingCode) {
            await supabase.from('profiles').update({ is_parent: true }).eq('id', newUser.id);
            const { data: link } = await supabase.from('parent_links').select('*').eq('linking_code', parentLinkingCode).eq('status', 'pending').single();
            if (link) {
              await supabase.from('parent_links').update({ parent_id: newUser.id, status: 'linked' }).eq('id', link.id);
            }
          }
          navigate('/parent-dashboard');
        } else {
          setOnboardingStep(1);
        }
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
          avatar_emoji: AVATARS[avatarIdx].label,
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

  const getContentStep = () => {
    if (!isHSC) return onboardingStep;
    if (onboardingStep <= 2) return onboardingStep;
    if (onboardingStep === 3) return "stream";
    if (onboardingStep === 4) return 3;
    return 4;
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
              {currentContent === 1 && <><FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-primary" /> তোমার পরিচয়</>}
              {currentContent === 2 && <><FontAwesomeIcon icon={faBullseye} className="mr-2 text-primary" /> তোমার লক্ষ্য</>}
              {currentContent === "stream" && <><FontAwesomeIcon icon={faBook} className="mr-2 text-primary" /> তোমার বিভাগ</>}
              {currentContent === 3 && <><FontAwesomeIcon icon={faCalendarDays} className="mr-2 text-primary" /> পরীক্ষার তারিখ</>}
              {currentContent === 4 && <><FontAwesomeIcon icon={faBookOpen} className="mr-2 text-primary" /> দুর্বল বিষয়</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentContent === 1 && (
              <>
                <div>
                  <Label>তোমার নাম কী?</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="নাম লেখো" />
                </div>
                <div>
                  <Label>একটি আইকন অ্যাভাটার বেছে নাও</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {AVATARS.map((av, idx) => (
                      <button
                        key={av.label}
                        onClick={() => setAvatarIdx(idx)}
                        className={`text-2xl p-2 rounded-lg border transition-all ${avatarIdx === idx ? "bg-primary/20 border-primary scale-110" : "border-border hover:border-primary/50"}`}
                      >
                        <FontAwesomeIcon icon={av.emoji} className={avatarIdx === idx ? "text-primary" : "text-foreground"} />
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
                  পরবর্তী <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </Button>
              </>
            )}

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
                      <FontAwesomeIcon icon={exam.icon} className="text-xl block mb-1" />
                      <span className="text-sm font-medium">{exam.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOnboardingStep(1)}>
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-1" /> আগে
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
                    পরবর্তী <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                  </Button>
                </div>
              </>
            )}

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
                      <FontAwesomeIcon icon={s.icon} className="text-xl mr-3" />
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOnboardingStep(2)}>
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-1" /> আগে
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
                    পরবর্তী <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                  </Button>
                </div>
              </>
            )}

            {currentContent === 3 && (
              <>
                <Label>তোমার পরীক্ষা কবে?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !examDate && "text-muted-foreground")}
                    >
                      <FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
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
                      <FontAwesomeIcon icon={faFire} className="mr-2" /> পরীক্ষার আর {differenceInDays(examDate, new Date())} দিন বাকি
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOnboardingStep(isHSC ? 3 : 2)}>
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-1" /> আগে
                  </Button>
                  <Button className="flex-1" onClick={() => setOnboardingStep(isHSC ? 5 : 4)}>
                    পরবর্তী <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                  </Button>
                </div>
              </>
            )}

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
                      {s.name_bn}
                    </button>
                  ))}
                  {subjects.length === 0 && <p className="text-sm text-muted-foreground">বিষয় লোড হচ্ছে...</p>}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOnboardingStep(isHSC ? 4 : 3)}>
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-1" /> আগে
                  </Button>
                  <Button className="flex-1" onClick={handleOnboardingComplete} disabled={loading}>
                    {loading ? "সেভ হচ্ছে..." : <><FontAwesomeIcon icon={faRocket} className="mr-2" /> শুরু করো</>}
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
          {/* Parent toggle */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Label htmlFor="parent-toggle" className="text-sm"><FontAwesomeIcon icon={faUsers} className="mr-1" /> আমি অভিভাবক লগইন করছি</Label>
            <Switch id="parent-toggle" checked={isParent} onCheckedChange={setIsParent} />
          </div>

          {/* Google login */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (error) toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
            }}
          >
            <FontAwesomeIcon icon={faGoogle} className="mr-2" />
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
            {isParent && isSignUp && (
              <div>
                <Label><FontAwesomeIcon icon={faLink} className="mr-1" /> সন্তানের Linking Code</Label>
                <Input
                  value={parentLinkingCode}
                  onChange={(e) => setParentLinkingCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : isSignUp ? "সাইন আপ করো" : "লগ ইন করো"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-3">
            <FontAwesomeIcon icon={faLock} className="mr-1" /> ফোন নম্বর লাগবে না
          </p>

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
