import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SubmitConcern from "./pages/SubmitConcern";
import TrackConcern from "./pages/TrackConcern";
import GeotagPhoto from "./pages/GeotagPhoto"; // Import the new page
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import ConcernLibrary from "./pages/admin/ConcernLibrary";
import OpenForumLibrary from "./pages/admin/OpenForumLibrary";
import ConcernDetail from "./pages/admin/ConcernDetail";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/submit-concern" element={<SubmitConcern />} />
          <Route path="/track-concern" element={<TrackConcern />} />
          <Route path="/geotag-tool" element={<GeotagPhoto />} />
          <Route path="/admin" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/library" element={<ConcernLibrary />} />
            <Route path="/admin/open-forum" element={<OpenForumLibrary />} />
            <Route path="/admin/concern/:id" element={<ConcernDetail />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
