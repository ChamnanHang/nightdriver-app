import { Car, MapPin, Navigation, Phone, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cancelBooking, getBooking, submitReview } from "../../api/client";
import BookingMap from "../../components/BookingMap";
import Spinner from "../../components/Spinner";
import StatusBadge from "../../components/StatusBadge";
import type { Booking } from "../../types";
import { useTelegram } from "../useTelegram";

export default function TgRideDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { showBackButton, hideBackButton, showMainButton, hideMainButton, haptic, confirm, alert } = useTelegram();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewDone, setReviewDone] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const res = await getBooking(Number(id));
      setBooking(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    showBackButton(() => { haptic.light(); nav("/tg"); });

    if (!booking) return;

    const canCancel = ["pending", "accepted", "driver_arrived"].includes(booking.status);
    if (canCancel) {
      showMainButton("Cancel Booking", () => {
        confirm("Are you sure you want to cancel?", async (ok) => {
          if (!ok) return;
          haptic.medium();
          await cancelBooking(booking.id);
          nav("/tg");
        });
      });
    } else {
      hideMainButton();
    }

    return () => { hideMainButton(); hideBackButton(); };
  }, [booking?.status]);

  const doReview = async () => {
    if (!booking || !selectedStar) return;
    haptic.medium();
    try {
      await submitReview(booking.id, { rating: selectedStar, comment: comment || undefined });
      haptic.success();
      setReviewDone(true);
    } catch {
      haptic.error();
      alert("Could not submit review. Please try again.");
    }
  };

  if (loading) return <div className="flex justify-center items-center pt-20"><Spinner size={36} /></div>;
  if (!booking) return <div className="text-center py-20 text-white/40 px-4">Booking not found</div>;

  const fmt = (d: string | null) => d ? new Date(d).toLocaleString() : "—";

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Ride #{booking.id}</h1>
          <p className="text-xs text-white/40">{new Date(booking.created_at).toLocaleDateString()}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* ETA alert */}
      {booking.eta_minutes && booking.status === "accepted" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-400 font-semibold text-center">
          🚗 Driver arriving in ~{booking.eta_minutes} min
        </div>
      )}
      {booking.status === "driver_arrived" && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3 text-sm text-cyan-400 font-semibold text-center">
          🎉 Your driver has arrived!
        </div>
      )}

      {/* Map */}
      <BookingMap booking={booking} />

      {/* Route */}
      <div className="glass-dark p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-violet-400 mt-0.5 shrink-0" />
          <div><p className="text-xs text-white/40">Pickup</p><p className="text-sm text-white">{booking.pickup_address}</p></div>
        </div>
        <div className="flex items-start gap-2">
          <Navigation size={14} className="text-emerald-400 mt-0.5 shrink-0" />
          <div><p className="text-xs text-white/40">Destination</p><p className="text-sm text-white">{booking.destination_address}</p></div>
        </div>
      </div>

      {/* Fare */}
      <div className="glass-dark p-4 grid grid-cols-2 gap-3">
        {[
          ["Distance", booking.distance_km ? `${booking.distance_km.toFixed(1)} km` : "—"],
          ["Fare", `$${(booking.final_fare ?? booking.estimated_fare ?? 0).toFixed(2)}`],
          ["Night Surge", booking.is_night_surge ? "1.5× 🌙" : "No"],
          ["ETA", booking.eta_minutes ? `~${booking.eta_minutes} min` : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-white/40">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Driver info */}
      {booking.driver && (
        <div className="glass-dark p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
            <Car size={20} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{booking.driver.full_name}</p>
            <p className="text-xs text-white/40">{booking.driver.vehicle_model} · {booking.driver.vehicle_plate}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-white/60">{booking.driver.average_rating.toFixed(1)}</span>
            </div>
          </div>
          {booking.driver.phone && (
            <a href={`tel:${booking.driver.phone}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Phone size={15} className="text-violet-400" />
            </a>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="glass-dark p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Timeline</p>
        {[
          ["Created", booking.created_at],
          ["Accepted", booking.accepted_at],
          ["Started", booking.started_at],
          ["Completed", booking.completed_at],
        ].map(([label, time]) => (
          <div key={label as string} className="flex justify-between text-xs mb-2">
            <span className="text-white/40">{label}</span>
            <span className={time ? "text-white" : "text-white/20"}>{fmt(time as string | null)}</span>
          </div>
        ))}
      </div>

      {/* Review */}
      {booking.status === "completed" && !reviewDone && (
        <div className="glass-dark p-4">
          <p className="font-semibold text-sm mb-3">Rate your driver</p>
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoveredStar(s)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => { setSelectedStar(s); haptic.light(); }}
                className="transition-transform hover:scale-110"
              >
                <Star size={28} className={s <= (hoveredStar || selectedStar) ? "text-amber-400 fill-amber-400" : "text-white/20"} />
              </button>
            ))}
          </div>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment (optional)…" className="mb-3" />
          <button
            type="button"
            onClick={doReview}
            disabled={!selectedStar}
            className="btn-primary"
          >
            Submit Review
          </button>
        </div>
      )}
      {reviewDone && (
        <div className="glass-dark p-4 text-center text-emerald-400 text-sm font-semibold">
          ✅ Review submitted!
        </div>
      )}
    </div>
  );
}
