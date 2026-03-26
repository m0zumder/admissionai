import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, MessageCircle, BookOpen, Trash2, Send, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type DocFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notebook-chat`;

const NotebookPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [studyGuide, setStudyGuide] = useState('');
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadDocuments();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadDocuments = async () => {
    const { data } = await supabase
      .from('notebook_documents')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data as DocFile[]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast({ title: 'ফাইল খুব বড়', description: 'সর্বোচ্চ ২০MB সাইজের ফাইল আপলোড করা যাবে।', variant: 'destructive' });
          continue;
        }

        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('notebooks')
          .upload(filePath, file);

        if (uploadError) {
          toast({ title: 'আপলোড ব্যর্থ', description: uploadError.message, variant: 'destructive' });
          continue;
        }

        await supabase.from('notebook_documents').insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        });
      }

      await loadDocuments();
      toast({ title: 'আপলোড সফল! ✅', description: 'ডকুমেন্ট সফলভাবে আপলোড হয়েছে।' });
    } catch (err) {
      toast({ title: 'ত্রুটি', description: 'আপলোডে সমস্যা হয়েছে।', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (doc: DocFile) => {
    await supabase.storage.from('notebooks').remove([doc.file_path]);
    await supabase.from('notebook_documents').delete().eq('id', doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    toast({ title: 'ডকুমেন্ট মুছে ফেলা হয়েছে।' });
  };

  const getDocumentContext = () => {
    if (documents.length === 0) return '';
    return `শিক্ষার্থী ${documents.length}টি ডকুমেন্ট আপলোড করেছে: ${documents.map((d) => d.file_name).join(', ')}। এই ডকুমেন্টগুলোর বিষয়বস্তু নিয়ে আলোচনা করো।`;
  };

  const streamChat = async (msgs: ChatMessage[], onDelta: (t: string) => void, onDone: () => void) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: msgs, documentContext: getDocumentContext(), mode: 'chat' }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || 'চ্যাট ত্রুটি');
    }
    if (!resp.body) throw new Error('No stream body');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buf.indexOf('\n')) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* partial */ }
      }
    }
    onDone();
  };

  const sendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    let assistantText = '';
    const allMsgs = [...chatMessages, userMsg];

    try {
      await streamChat(
        allMsgs,
        (chunk) => {
          assistantText += chunk;
          setChatMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
            }
            return [...prev, { role: 'assistant', content: assistantText }];
          });
        },
        () => setIsChatLoading(false),
      );
    } catch (err: any) {
      toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
      setIsChatLoading(false);
    }
  };

  const generateStudyGuide = async () => {
    if (documents.length === 0) {
      toast({ title: 'ডকুমেন্ট নেই', description: 'প্রথমে একটি ডকুমেন্ট আপলোড করুন।', variant: 'destructive' });
      return;
    }
    setIsGeneratingGuide(true);
    setStudyGuide('');

    try {
      await streamChat(
        [{ role: 'user', content: 'আমার আপলোড করা ডকুমেন্টগুলোর উপর ভিত্তি করে একটি বিস্তারিত স্টাডি গাইড তৈরি করো।' }],
        (chunk) => setStudyGuide((prev) => prev + chunk),
        () => setIsGeneratingGuide(false),
      );
    } catch (err: any) {
      toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
      setIsGeneratingGuide(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📓 আমার নোটবুক</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" /> ডকুমেন্ট
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageCircle className="h-4 w-4" /> AI চ্যাট
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-2">
            <BookOpen className="h-4 w-4" /> স্টাডি গাইড
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div
                className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-primary/60" />
                <p className="font-semibold text-sm">ডকুমেন্ট আপলোড করুন</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, ছবি বা টেক্সট ফাইল (সর্বোচ্চ ২০MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                  onChange={handleUpload}
                />
                {uploading && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">আপলোড হচ্ছে...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">কোনো ডকুমেন্ট নেই</p>
                <p className="text-sm mt-1">উপরে ক্লিক করে ডকুমেন্ট আপলোড করুন</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="card-hover">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="card-hover">
            <CardContent className="p-0">
              <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">AI টিউটরকে প্রশ্ন করুন</p>
                    <p className="text-sm mt-1">আপলোড করা ডকুমেন্ট নিয়ে আলোচনা করুন</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t p-3 flex gap-2">
                <Input
                  placeholder="আপনার প্রশ্ন লিখুন..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  disabled={isChatLoading}
                />
                <Button size="icon" onClick={sendChat} disabled={isChatLoading || !chatInput.trim()} className="btn-ripple shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study Guide Tab */}
        <TabsContent value="guide" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                স্টাডি গাইড জেনারেটর
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                আপলোড করা ডকুমেন্টের উপর ভিত্তি করে AI স্বয়ংক্রিয়ভাবে একটি স্টাডি গাইড তৈরি করবে।
              </p>
              <Button
                onClick={generateStudyGuide}
                disabled={isGeneratingGuide || documents.length === 0}
                className="btn-ripple w-full"
              >
                {isGeneratingGuide ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    স্টাডি গাইড তৈরি করো
                  </>
                )}
              </Button>

              {studyGuide && (
                <div className="mt-4 p-4 bg-muted rounded-xl text-sm whitespace-pre-wrap leading-relaxed">
                  {studyGuide}
                </div>
              )}

              {!studyGuide && !isGeneratingGuide && documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>প্রথমে ডকুমেন্ট ট্যাবে গিয়ে ডকুমেন্ট আপলোড করুন।</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotebookPage;
