import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/lib/store";
import DailyTable from "./pages/DailyTable";
import Parameters from "./pages/Parameters";
import CombinationsPage from "./pages/Combinations";
import Operations from "./pages/Operations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const loadFromSupabase = useAppStore((s) => s.loadFromSupabase);
  const isLoading = useAppStore((s) => s.isLoading);

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DailyTable />} />
        <Route path="/parameters" element={<Parameters />} />
        <Route path="/combinations" element={<CombinationsPage />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
