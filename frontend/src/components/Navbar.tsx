import { Car, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { token, role, user, driver, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const name = role === "customer" ? user?.full_name : driver?.full_name;
  const dashPath = role === "driver" ? "/driver/dashboard" : "/dashboard";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-night-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <Car size={16} />
          </span>
          <span>Night<span className="text-violet-400">Driver</span></span>
        </Link>

        {/* Desktop */}
        {token ? (
          <div className="hidden sm:flex items-center gap-4">
            <Link
              to={dashPath}
              className={`text-sm font-medium transition-colors ${loc.pathname === dashPath ? "text-violet-400" : "text-white/60 hover:text-white"}`}
            >
              Dashboard
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-sm text-white/60">{name}</span>
            <button onClick={logout} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-red-400 transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link to="/register" className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        )}

        {/* Mobile toggle */}
        <button className="sm:hidden text-white/60" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-white/5 bg-night-800/95 px-4 py-4 flex flex-col gap-3">
          {token ? (
            <>
              <p className="text-xs text-white/40">Signed in as <span className="text-white/70">{name}</span></p>
              <Link to={dashPath} onClick={() => setOpen(false)} className="text-sm font-medium text-white/80">Dashboard</Link>
              <button onClick={logout} className="text-sm text-red-400 text-left">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-white/80">Sign in</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="text-sm text-violet-400">Register as Customer</Link>
              <Link to="/driver/login" onClick={() => setOpen(false)} className="text-sm text-white/60">Driver Sign in</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
