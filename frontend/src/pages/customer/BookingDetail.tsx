import { ArrowLeft, Car, Clock, MapPin, Navigation, Phone, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { cancelBooking, getBooking, submitReview } from "../../api/client";
import BookingMap from "../../components/BookingMap";
import Spinner from "../../components/Spinner";
import StatusBadge from "../../components/StatusBadge";
import type { Booking } from "../../types";

const POLL_INTERVAL = 8000;

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const { register, handleSubmit } = useForm<{ comment: string }>();

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
    const active = ["pending", "accepted", "driver_arrived", "in_progress"];
    const interval = setInterval(() => {
      if (booking && active.includes(booking.status)) load();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [id, booking?.status]);

  const doCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try { await cancelBooking(booking.id); await load(); }
    finally { setCancelling(false); }
  };

  const onReview = async (data: { comment: string }) => {
    if (!booking || !selectedStar) return;
    setReviewSubmitting(true);
    try {
      await submitReview(booking.id, { rating: selectedStar, comment: data.comment || undefined });
      setReviewDone(true);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size={36} /></div>;
  if (!booking) return <div className="text-center py-20 text-white/40">Booking not found</div>;

  const canCancel = ["pending", "accepted", "driver_arrived"].includes(booking.status);
  const fmt = (d: string | null) => d ? new Date(d).toLocaleString() : "—";

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-6">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Ride #{booking.id}</h1>
            <p className="text-white/40 text-sm mt-0.5">{new Date(booking.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Live map */}
        <div className="glass-dark p-4 mb-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide">Live Map</h3>
            {booking.eta_minutes && booking.status === "accepted" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                <Clock size={11} /> Driver arriving in ~{booking.eta_minutes} min
              </span>
            )}
            {booking.status === "driver_arrived" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">
                🚗 Driver is here!
              </span>
            )}
          </div>
          <BookingMap booking={booking} />
        </div>

        {/* Route card */}
        <div className="glass-dark p-5 mb-4 animate-slide-up">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={14} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-0.5">Pickup</p>
                <p className="text-sm font-medium text-white">{booking.pickup_address}</p>
                <p className="text-xs text-white/30">{booking.pickup_lat}, {booking.pickup_lng}</p>
              </div>
            </div>
            <div className="ml-4 border-l border-dashed border-white/10 h-4" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation size={14} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-0.5">Destination</p>
                <p className="text-sm font-medium text-white">{booking.destination_address}</p>
                <p className="text-xs text-white/30">{booking.destination_lat}, {booking.destination_lng}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fare card */}
        <div className="glass-dark p-5 mb-4 animate-slide-up">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-4">Fare Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Distance", value: booking.distance_km ? `${booking.distance_km.toFixed(1)} km` : "—" },
              { label: "Estimated Fare", value: booking.estimated_fare ? `$${booking.estimated_fare.toFixed(2)}` : "—" },
              { label: "Final Fare", value: booking.final_fare ? `$${booking.final_fare.toFixed(2)}` : "—" },
              { label: "Night Surge", value: booking.is_night_surge ? "1.5× Active 🌙" : "No" },
              { label: "Driver ETA", value: booking.eta_minutes ? `~${booking.eta_minutes} min` : "—" },
              {
                label: "Driver Start Location",
                value: booking.driver_accept_lat
                  ? `${booking.driver_accept_lat.toFixed(4)}, ${booking.driver_accept_lng?.toFixed(4)}`
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-white/40">{label}</p>
                <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Driver card */}
        {booking.driver && (
          <div className="glass-dark p-5 mb-4 animate-slide-up">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-4">Your Driver</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center">
                <Car size={22} className="text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{booking.driver.full_name}</p>
                <p className="text-sm text-white/40">{booking.driver.vehicle_model} · {booking.driver.vehicle_plate}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs text-white/60">{booking.driver.average_rating.toFixed(1)}</span>
                </div>
              </div>
              <a href={`tel:${booking.driver.phone ?? ""}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-violet-500/20 transition-colors">
                <Phone size={16} className="text-violet-400" />
              </a>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="glass-dark p-5 mb-4 animate-slide-up">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-4">Timeline</h3>
          <div className="flex flex-col gap-2 text-sm">
            {[
              { label: "Booking Created", time: booking.created_at },
              { label: "Driver Accepted", time: booking.accepted_at },
              { label: "Trip Started", time: booking.started_at },
              { label: "Trip Completed", time: booking.completed_at },
            ].map(({ label, time }) => (
              <div key={label} className="flex justify-between">
                <span className="text-white/40">{label}</span>
                <span className={time ? "text-white" : "text-white/20"}>{fmt(time)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="glass-dark p-5 mb-4">
            <p className="text-xs text-white/40 mb-1">Notes</p>
            <p className="text-sm text-white/80">{booking.notes}</p>
          </div>
        )}

        {/* Review */}
        {booking.status === "completed" && !reviewDone && (
          <div className="glass-dark p-5 mb-4 animate-slide-up">
            <h3 className="font-semibold mb-4">Rate your driver</h3>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoveredStar(s)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStar(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star size={28} className={s <= (hoveredStar || selectedStar) ? "text-amber-400 fill-amber-400" : "text-white/20"} />
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit(onReview)} className="flex flex-col gap-3">
              <input placeholder="Leave a comment (optional)…" {...register("comment")} />
              <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={!selectedStar || reviewSubmitting}>
                {reviewSubmitting && <Spinner size={16} />}
                Submit Review
              </button>
            </form>
          </div>
        )}

        {reviewDone && (
          <div className="glass-dark p-5 mb-4 text-center text-emerald-400 animate-slide-up">
            ✅ Thank you for your review!
          </div>
        )}

        {/* Cancel */}
        {canCancel && (
          <button onClick={doCancel} className="btn-danger flex items-center justify-center gap-2" disabled={cancelling}>
            {cancelling ? <Spinner size={16} /> : <X size={16} />}
            {cancelling ? "Cancelling…" : "Cancel Booking"}
          </button>
        )}
      </div>
    </div>
  );
}
