import { Car, KeyRound } from "lucide-react";
import type { FareQuote, ServiceType, Transmission } from "../types";

export interface CarInfo {
  model: string;
  plate: string;
  transmission: Transmission;
}

export const loadSavedCar = (): CarInfo => {
  try {
    const raw = localStorage.getItem("my_car");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { model: "", plate: "", transmission: "auto" };
};

export const saveCar = (car: CarInfo) => {
  localStorage.setItem("my_car", JSON.stringify(car));
};

interface Props {
  service: ServiceType;
  onService: (s: ServiceType) => void;
  car: CarInfo;
  onCar: (c: CarInfo) => void;
}

export function ServicePicker({ service, onService, car, onCar }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onService("designated")}
          className={`rounded-xl p-3 text-left border transition-all ${
            service === "designated"
              ? "bg-violet-600/20 border-violet-500 text-white"
              : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
          }`}
        >
          <KeyRound size={18} className={service === "designated" ? "text-violet-400" : ""} />
          <p className="text-sm font-semibold mt-1.5">Drive My Car</p>
          <p className="text-[11px] mt-0.5 leading-tight opacity-70">
            Our driver takes you home in your own car
          </p>
        </button>
        <button
          type="button"
          onClick={() => onService("ride")}
          className={`rounded-xl p-3 text-left border transition-all ${
            service === "ride"
              ? "bg-emerald-600/20 border-emerald-500 text-white"
              : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
          }`}
        >
          <Car size={18} className={service === "ride" ? "text-emerald-400" : ""} />
          <p className="text-sm font-semibold mt-1.5">Need a Ride</p>
          <p className="text-[11px] mt-0.5 leading-tight opacity-70">
            Driver picks you up in their car
          </p>
        </button>
      </div>

      {service === "designated" && (
        <div className="flex flex-col gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-white/40">Your car — so the driver can find it</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={car.model}
              onChange={(e) => onCar({ ...car, model: e.target.value })}
              placeholder="Car model (e.g. Camry)"
            />
            <input
              value={car.plate}
              onChange={(e) => onCar({ ...car, plate: e.target.value })}
              placeholder="Plate (e.g. 2AB-1234)"
            />
          </div>
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-medium self-start">
            {(["auto", "manual"] as Transmission[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onCar({ ...car, transmission: t })}
                className={`px-4 py-1.5 transition-colors ${
                  car.transmission === t
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {t === "auto" ? "Automatic" : "Manual"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FareEstimate({ quote, service }: { quote: FareQuote; service: ServiceType }) {
  const f = service === "designated" ? quote.designated : quote.ride;
  if (!quote.in_service_area) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
        ⚠️ This pickup location is outside our service area. Please choose a
        pickup point inside the covered zone.
      </div>
    );
  }
  return (
    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-white/40">
          Estimated fare · {quote.distance_km} km
          {quote.is_night_surge && ` · 🌙 ${quote.night_surge_multiplier}× night`}
        </p>
        <p className="text-lg font-bold text-white">
          ${f.fare_usd.toFixed(2)}
          <span className="text-xs font-normal text-white/40 ml-2">
            ≈ ៛{f.fare_khr.toLocaleString()}
          </span>
        </p>
      </div>
      {service === "designated" && <span className="text-2xl">🔑</span>}
      {service === "ride" && <span className="text-2xl">🚕</span>}
    </div>
  );
}
