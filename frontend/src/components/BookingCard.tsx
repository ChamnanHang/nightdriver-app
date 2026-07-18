import { ChevronRight, MapPin, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import type { Booking } from "../types";
import StatusBadge from "./StatusBadge";

export default function BookingCard({ booking }: { booking: Booking }) {
  const date = new Date(booking.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <Link to={`/booking/${booking.id}`} className="glass-dark p-5 flex flex-col gap-3 hover:border-white/20 transition-all animate-slide-up group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <span className="text-xs text-white/40">
            {booking.service_type === "designated" ? "🔑 My car" : "🚕 Ride"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/30 text-xs">
          <span>{date}</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-violet-400 mt-0.5 shrink-0" />
          <p className="text-sm text-white/80 line-clamp-1">{booking.pickup_address}</p>
        </div>
        <div className="flex items-start gap-2">
          <Navigation size={14} className="text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-sm text-white/80 line-clamp-1">{booking.destination_address}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-white/40">
          {booking.distance_km && <span>{booking.distance_km.toFixed(1)} km</span>}
          {booking.is_night_surge && (
            <span className="text-amber-400 flex items-center gap-1">🌙 Night surge</span>
          )}
        </div>
        <span className="text-sm font-semibold text-white">
          ${(booking.final_fare ?? booking.estimated_fare ?? 0).toFixed(2)}
        </span>
      </div>
    </Link>
  );
}
