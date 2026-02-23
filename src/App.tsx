import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Parichay from "@/pages/Parichay";
import AapKaItihas from "@/pages/AapKaItihas";
import ContentFeed from "@/pages/ContentFeed";
import ELibrary from "@/pages/ELibrary";
import Directory from "@/pages/Directory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/parichay" element={<Parichay />} />
              <Route path="/feed" element={<ContentFeed />} />
              <Route path="/library" element={<ELibrary />} />
              <Route path="/history" element={<AapKaItihas />} />
              <Route path="/directory" element={<Directory />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
