import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MCQ from "./pages/MCQ";
import Explain from "./pages/Explain";
import Srijonshil from "./pages/Srijonshil";
import MockExam from "./pages/MockExam";
import Progress from "./pages/Progress";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Notebook from "./pages/Notebook";
import NotFound from "./pages/NotFound";
import WhatsAppButton from "./components/WhatsAppButton";

const queryClient = new QueryClient();

const DashboardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardRoute><Dashboard /></DashboardRoute>} />
            <Route path="/mcq" element={<DashboardRoute><MCQ /></DashboardRoute>} />
            <Route path="/explain" element={<DashboardRoute><Explain /></DashboardRoute>} />
            <Route path="/srijonshil" element={<DashboardRoute><Srijonshil /></DashboardRoute>} />
            <Route path="/mock-exam" element={<DashboardRoute><MockExam /></DashboardRoute>} />
            <Route path="/progress" element={<DashboardRoute><Progress /></DashboardRoute>} />
            <Route path="/pricing" element={<DashboardRoute><Pricing /></DashboardRoute>} />
            <Route path="/settings" element={<DashboardRoute><Settings /></DashboardRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <WhatsAppButton />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
