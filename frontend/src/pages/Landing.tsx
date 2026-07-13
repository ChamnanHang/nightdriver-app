import { Car, CheckCircle, Moon, Shield, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const features = [
  { icon: Moon,        title: "Night-Time Ready",      desc: "Available 8 PM – 6 AM every day. Designed for the hours you need it most." },
  { icon: Shield,      title: "Verified Drivers",      desc: "Every driver is licensed and verified. Your safety is our priority." },
  { icon: Zap,         title: "Fast Matching",         desc: "Get matched with a nearby available driver within minutes." },
  { icon: Star,        title: "Rated Experience",      desc: "Transparent rating system. Know who's picking you up before they arrive." },
];

const steps = [
  { step: "01", title: "Enter Your Route",     desc: "Tell us where you are and where you're going." },
  { step: "02", title: "Get Fare Estimate",    desc: "We calculate the distance and show you the price upfront." },
  { step: "03", title: "Driver Accepts",       desc: "A nearby driver picks up your request and heads to you." },
  { step: "04", title: "Ride Home Safely",     desc: "Relax — your driver takes you home in your own car." },
];

export default function Landing() {
  const { token, role } = useAuth();
  const dashPath = role === "driver" ? "/driver/dashboard" : "/dashboard";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32 relative overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6 font-medium">
            <Moon size={14} /> Available every night · 8 PM – 6 AM
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Get Home Safe
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Every Night
            </span>
          </h1>

          <p className="text-xl text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
            Had a few drinks? Book a sober designated driver to take you home safely.
            Fast, affordable, and reliable — every night.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {token ? (
              <Link to={dashPath} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 active:scale-95 text-lg">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 active:scale-95 text-lg">
                  Book a Driver
                </Link>
                <Link to="/driver/register" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-xl border border-white/10 transition-all duration-200 text-lg">
                  Become a Driver
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-white/30">
            {["No subscription", "Pay per ride", "Safe & verified"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-emerald-500" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Why NightDriver?</h2>
          <p className="text-center text-white/40 mb-12">Built for the moments when getting home safely matters most.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t border-white/5 bg-night-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">How It Works</h2>
          <p className="text-center text-white/40 mb-12">Four simple steps to get home safe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <span className="text-4xl font-black text-white/5 shrink-0 leading-none mt-1">{step}</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-white/5 text-center">
        <div className="max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6">
            <Car size={28} className="text-violet-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to ride safe?</h2>
          <p className="text-white/40 mb-8">Join thousands of people who choose safety every night.</p>
          {!token && (
            <Link to="/register" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 active:scale-95">
              Create Free Account
            </Link>
          )}
        </div>
      </section>

      <footer className="border-t border-white/5 py-6 text-center text-sm text-white/20">
        © {new Date().getFullYear()} NightDriver · Built for safe nights
      </footer>
    </div>
  );
}
