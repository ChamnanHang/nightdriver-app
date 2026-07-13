import { Car, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { registerCustomer } from "../../api/client";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../contexts/AuthContext";

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

export default function CustomerRegister() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const { login } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await registerCustomer(data);
      await login(res.data.access_token, "customer");
      nav("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4">
            <Car size={24} />
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-white/40 text-sm mt-1">Book safe rides home at night</p>
        </div>

        <div className="glass-dark p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <label className="label">Full Name</label>
              <input placeholder="John Doe" {...register("full_name", { required: "Required" })} />
              {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="you@example.com" {...register("email", { required: "Required" })} />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input type="tel" placeholder="+1 234 567 8900" {...register("phone", { required: "Required" })} />
              {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Min 8 characters"
                  {...register("password", { required: "Required", minLength: { value: 6, message: "Too short" } })}
                  className="pr-12"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary mt-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Spinner size={18} /> : null}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-3 mt-6 text-sm">
          <p className="text-white/40">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
          </p>
          <p className="text-white/30">
            Are you a driver?{" "}
            <Link to="/driver/register" className="text-white/50 hover:text-white transition-colors">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
