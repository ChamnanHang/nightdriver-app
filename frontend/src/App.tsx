import WebApp from "@twa-dev/sdk";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Spinner from "./components/Spinner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import BookingDetail from "./pages/customer/BookingDetail";
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerLogin from "./pages/customer/Login";
import CustomerRegister from "./pages/customer/Register";
import DriverDashboard from "./pages/driver/Dashboard";
import DriverLogin from "./pages/driver/Login";
import DriverRegister from "./pages/driver/Register";
import Landing from "./pages/Landing";
import TelegramApp from "./telegram/TelegramApp";

// Detect Telegram Mini App environment
const isTelegram = Boolean(WebApp.initData || window.location.pathname.startsWith("/tg"));

function RequireCustomer({ children }: { children: React.ReactNode }) {
  const { token, role, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner size={36} /></div>;
  if (!token || role !== "customer") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireDriver({ children }: { children: React.ReactNode }) {
  const { token, role, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner size={36} /></div>;
  if (!token || role !== "driver") return <Navigate to="/driver/login" replace />;
  return <>{children}</>;
}

function WebRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/register" element={<CustomerRegister />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/register" element={<DriverRegister />} />
          <Route path="/dashboard" element={<RequireCustomer><CustomerDashboard /></RequireCustomer>} />
          <Route path="/booking/:id" element={<RequireCustomer><BookingDetail /></RequireCustomer>} />
          <Route path="/driver/dashboard" element={<RequireDriver><DriverDashboard /></RequireDriver>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      {isTelegram ? (
        // Telegram Mini App — no Navbar, no AuthProvider (self-authenticates)
        <Routes>
          <Route path="/tg/*" element={<TelegramApp />} />
          <Route path="*" element={<Navigate to="/tg" replace />} />
        </Routes>
      ) : (
        <AuthProvider>
          <WebRoutes />
        </AuthProvider>
      )}
    </Router>
  );
}
