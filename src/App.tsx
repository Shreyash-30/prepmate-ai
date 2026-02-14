import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Roadmap from "@/pages/Roadmap";
import Practice from "@/pages/Practice";
import MockInterview from "@/pages/MockInterview";
import Analytics from "@/pages/Analytics";
import Planning from "@/pages/Planning";
import MentorChat from "@/pages/MentorChat";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/mentor" element={<MentorChat />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
