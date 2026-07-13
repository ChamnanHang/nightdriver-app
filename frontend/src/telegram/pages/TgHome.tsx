import { Car, Clock, MapPin, Navigation, Plus } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import type { Booking } from "../../types";
import { useTelegram } from "../useTelegram";

interface Props {
  bookings: Booking[];
  onBook: () => void;
}

export default function TgHome({ bookings, onBook }: Props) {
  const { showMainButton, hideMainButton, haptic } = useTelegram();

  const active = bookings.find((b) => !["completed", "cancelled"].includes(b.status));

  useEffect(() => {
    showMainButton("🚗 Book a Driver", () => {
      haptic.medium();
      onBook();
    });
    return () => hideMainButton();
  }, []);

  const recent = bookings.slice(0, 5);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0">
            <Car size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">NightDriver</h1>
            <p className="text-xs text-tg-hint">Safe rides home, every night</p>
          </div>
        </div>
      </div>

      {/* Active booking */}
      {active ? (
        <Link to={`/tg/ride/${active.id}`} className="mx-4 glass border-violet-500/40 p-4 block">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-violet-400">Active Ride</span>
            <StatusBadge status={active.status} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-violet-400 mt-0.5 shrink-0" />
              <p className="text-sm text-white/80 line-clamp-1">{active.pickup_address}</p>
            </div>
            <div className="flex items-start gap-2">
              <Navigation size={13} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-sm text-white/80 line-clamp-1">{active.destination_address}</p>
            </div>
          </div>
          {active.eta_minutes && active.status === "accepted" && (
            <p className="text-xs text-amber-400 mt-2">🚗 Driver arriving in ~{active.eta_minutes} min</p>
          )}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => { haptic.light(); onBook(); }}
          className="mx-4 glass border-dashed border-white/20 hover:border-violet-500/40 p-5 flex items-center gap-3 rounded-2xl cursor-pointer transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
            <Plus className="text-violet-400" size={20} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white text-sm">Book a Ride</p>
            <p className="text-xs text-white/40 mt-0.5">Pick your pickup & destination</p>
          </div>
        </button>
      )}

      {/* Recent rides */}
      {recent.length > 0 && (
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-white/40" />
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">Recent Rides</p>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((b) => (
              <Link key={b.id} to={`/tg/ride/${b.id}`}
                className="glass-dark px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{b.pickup_address}</p>
                  <p className="text-xs text-white/40 mt-0.5 truncate">→ {b.destination_address}</p>
                </div>
                <div className="flex flex-col items-end ml-3 shrink-0">
                  <StatusBadge status={b.status} />
                  <p className="text-xs text-white/40 mt-1">
                    ${(b.final_fare ?? b.estimated_fare ?? 0).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
