import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import NewSimulation from "./pages/NewSimulation";
import Simulations from "./pages/Simulations";
import SimulationDetail from "./pages/SimulationDetail";
import OperationsPage from "./pages/OperationsPage";
import Hedges from "./pages/Hedges";
import Cadastros from "./pages/Cadastros";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nova-simulacao" element={<NewSimulation />} />
            <Route path="/simulacoes" element={<Simulations />} />
            <Route path="/simulacoes/:id" element={<SimulationDetail />} />
            <Route path="/operacoes" element={<OperationsPage />} />
            <Route path="/hedges" element={<Hedges />} />
            <Route path="/cadastros" element={<Cadastros />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
