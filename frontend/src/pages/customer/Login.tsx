import { Car, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { loginCustomer } from "../../api/client";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../contexts/AuthContext";

interface FormData { email: string; password: string; }

export default function CustomerLogin() {
  const { register, handleSubmit } = useForm<FormData>();
  const { login } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await loginCustomer(data);
      await login(res.data.access_token, "customer");
      nav("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4">
            <Car size={24} />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-white/40 text-sm mt-1">Sign in to book your ride</p>
        </div>

        <div className="glass-dark p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="you@example.com" {...register("email", { required: true })} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="••••••••" {...register("password", { required: true })} className="pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary flex items-center justify-center gap-2 mt-1" disabled={loading}>
              {loading && <Spinner size={18} />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-3 mt-6 text-sm">
          <p className="text-white/40">
            No account?{" "}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium">Create one free</Link>
          </p>
          <p className="text-white/30">
            Are you a driver?{" "}
            <Link to="/driver/login" className="text-white/50 hover:text-white transition-colors">Driver sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
