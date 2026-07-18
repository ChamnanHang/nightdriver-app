import { Car, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { registerDriver } from "../../api/client";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../contexts/AuthContext";

interface FormData {
  full_name: string; email: string; phone: string; password: string;
  license_number: string; vehicle_model: string; vehicle_plate: string;
  can_drive_manual: boolean;
}

export default function DriverRegister() {
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
      const res = await registerDriver(data);
      await login(res.data.access_token, "driver");
      nav("/driver/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <Car size={24} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Become a Driver</h1>
          <p className="text-white/40 text-sm mt-1">Help people get home safe every night</p>
        </div>

        <div className="glass-dark p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wide">Personal Info</p>
            <div>
              <label className="label">Full Name</label>
              <input placeholder="John Doe" {...register("full_name", { required: "Required" })} />
              {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="you@example.com" {...register("email", { required: "Required" })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" placeholder="+1 234 567 8900" {...register("phone", { required: "Required" })} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="••••••••" {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 chars" } })} className="pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <p className="text-xs font-semibold text-white/30 uppercase tracking-wide mt-2">Vehicle Info</p>
            <div>
              <label className="label">Driver's License Number</label>
              <input placeholder="DL-123456789" {...register("license_number", { required: "Required" })} />
            </div>
            <div>
              <label className="label">Vehicle Model</label>
              <input placeholder="Toyota Camry 2022" {...register("vehicle_model", { required: "Required" })} />
            </div>
            <div>
              <label className="label">License Plate</label>
              <input placeholder="ABC-1234" {...register("vehicle_plate", { required: "Required" })} />
            </div>
            <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500" {...register("can_drive_manual")} />
              <div>
                <p className="text-sm text-white">I can drive manual transmission</p>
                <p className="text-xs text-white/40">Many customer cars in Cambodia are stick shift — this gets you more jobs</p>
              </div>
            </label>

            <button type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2" disabled={loading}
              style={{ background: loading ? undefined : "linear-gradient(135deg, #d97706, #f59e0b)" }}>
              {loading && <Spinner size={18} />}
              {loading ? "Creating account…" : "Register as Driver"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          Already a driver?{" "}
          <Link to="/driver/login" className="text-amber-400 hover:text-amber-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
