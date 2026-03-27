import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard, BookOpen, Lightbulb, PenTool, FileText,
  BarChart3, CreditCard, Settings, LogOut, Menu, ClipboardList, Trophy, Camera, Target, Calculator,
  Award, Bookmark, CalendarDays, Search, BookText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GlobalSearch, useGlobalSearch } from '@/components/GlobalSearch';
import { getLevelProgress } from '@/hooks/useXP';
import logo from '@/assets/logo.png';

const navItems = [
  { title: 'ড্যাশবোর্ড', url: '/dashboard', icon: LayoutDashboard },
  { title: 'MCQ অনুশীলন', url: '/mcq', icon: BookOpen },
  { title: '📸 ছবি থেকে সমাধান', url: '/photo-solve', icon: Camera },
  { title: 'বুঝিয়ে দাও', url: '/explain', icon: Lightbulb },
  { title: 'সৃজনশীল', url: '/srijonshil', icon: PenTool },
  { title: 'নোটবুক', url: '/notebook', icon: FileText },
  { title: 'মক পরীক্ষা', url: '/mock-exam', icon: ClipboardList },
  { title: 'Custom Exam', url: '/custom-exam', icon: Target },
  { title: 'ভর্তি সম্ভাবনা', url: '/chance', icon: Calculator },
  { title: 'সূত্র শীট', url: '/formula-sheet', icon: BookText },
  { title: 'পড়ার পরিকল্পনা', url: '/planner', icon: CalendarDays },
  { title: 'বুকমার্কস', url: '/bookmarks', icon: Bookmark },
  { title: 'ব্যাজ ও অর্জন', url: '/badges', icon: Award },
  { title: 'প্রগ্রেস', url: '/progress', icon: BarChart3 },
  { title: 'লিডারবোর্ড', url: '/leaderboard', icon: Trophy },
  { title: 'প্রাইসিং', url: '/pricing', icon: CreditCard },
  { title: 'সেটিংস', url: '/settings', icon: Settings },
];

function AppSidebarContent() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();

  const planLabel = profile?.subscription_plan === 'premium' ? 'Premium' : profile?.subscription_plan === 'student' ? 'Student' : 'Free';
  const planColor = profile?.subscription_plan === 'premium' ? 'bg-secondary text-secondary-foreground' : profile?.subscription_plan === 'student' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground';
  const avatarEmoji = (profile as any)?.avatar_emoji || '📚';
  const xp = (profile as any)?.xp_points || 0;
  const level = (profile as any)?.user_level || 'নবীন 📖';
  const streak = (profile as any)?.study_streak || 0;
  const { progress, xpNeeded } = getLevelProgress(xp);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{avatarEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{profile?.name || 'শিক্ষার্থী'}</p>
                <p className="text-xs opacity-70">{level}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`text-xs ${planColor}`}>{planLabel}</Badge>
              {streak > 0 && <span className="text-xs font-bold text-orange-400">🔥 {streak} দিন</span>}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs opacity-70 mb-1">
                <span>{xp} XP</span>
                {xpNeeded > 0 && <span>আর {xpNeeded} XP</span>}
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {!collapsed && (
          <div className="mt-auto p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={async () => { await signOut(); navigate('/'); }}
            >
              <LogOut className="h-5 w-5" />
              লগ আউট
            </Button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 border-b border-border px-4 bg-card">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Admission AI" className="h-8 w-8 rounded-full" />
              <h1 className="text-lg font-bold text-primary">Admission AI</h1>
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 text-muted-foreground" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
              <span className="text-xs">খুঁজুন...</span>
              <kbd className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50">
            {[
              { icon: LayoutDashboard, label: 'হোম', path: '/dashboard' },
              { icon: BookOpen, label: 'MCQ', path: '/mcq' },
              { icon: Camera, label: 'ছবি সমাধান', path: '/photo-solve' },
              { icon: Lightbulb, label: 'বুঝিয়ে দাও', path: '/explain' },
              { icon: BarChart3, label: 'প্রগ্রেস', path: '/progress' },
            ].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 text-muted-foreground text-xs"
                activeClassName="text-primary font-semibold"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </SidebarProvider>
  );
};
