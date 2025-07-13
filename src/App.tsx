import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import Assistant from "./pages/Assistant";
import NotFound from "./pages/NotFound";
import SetupAccount from "./pages/SetupAccount";
import ProtectedRoute from "@/components/ProtectedRoute";
import GuestRoute from "@/components/GuestRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChatAssistant from "./pages/ChatAssistant";
import "leaflet/dist/leaflet.css";
import SalesRep_Analytics from "./pages/analytics/salesRep/SalesRep_Analytics";
import { Dealer_Analytics } from "./pages/analytics/dealer/Dealer_Analytics";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner duration={2000}/>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
          
               <Index />
           
            } />
          <Route path="/login" element={
           
              <Login />
            
          } />
          <Route path="/signup" element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          } />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/assistant" element={
            <ProtectedRoute>
              <Assistant />
            </ProtectedRoute>
          } />
          <Route path="/setup-account" element={<SetupAccount />} />
          <Route path="/analytics" element={
            <ProtectedRoute>
              {(() => {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                if (user.role === "dealer") return <Dealer_Analytics />;
                if (user.role === "sales_rep") return <SalesRep_Analytics />;
                return <NotFound />;
              })()}
            </ProtectedRoute>
          } />
          <Route path="/forgot-password" element={
            <ForgotPassword />
          } />
          <Route path="/reset-password" element={
            <ResetPassword />
          } />
          <Route path="*" element={<NotFound />} />
          <Route path="/chat-assistant" element={< ChatAssistant/>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
