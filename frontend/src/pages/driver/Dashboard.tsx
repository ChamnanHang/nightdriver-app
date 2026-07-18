import {
  AlertCircle, Car, CheckCircle, MapPin, Navigation,
  RefreshCw, Star, ToggleLeft, ToggleRight, Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  acceptBooking, completeTrip, getPendingQueue,
  markArrived, startTrip, updateAvailability, updateLocation
} from "../../api/client";
import Spinner from "../../components/Spinner";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../contexts/AuthContext";
import type { Booking } from "../../types";

function ServiceBadge({ b }: { b: Booking }) {
  if (b.service_type === "designated") {
    return (
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2 text-xs">
        <span className="text-violet-300 font-semibold">🔑 Drive customer's car</span>
        <span className="text-white/60 ml-2">
          {b.car_model} · {b.car_plate} ·{" "}
          <span className={b.car_transmission === "manual" ? "text-amber-400 font-semibold" : ""}>
            {b.car_transmission === "manual" ? "MANUAL" : "Auto"}
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs">
      <span className="text-emerald-300 font-semibold">🚕 Pickup in your car</span>
    </div>
  );
}

export default function DriverDashboard() {
  const { driver } = useAuth();
  const [available, setAvailable] = useState(driver?.is_available ?? false);
  const [queue, setQueue] = useState<Booking[]>([]);
  const [activeTrip, setActiveTrip] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQueue = async () => {
    if (!available) return;
    try {
      const res = await getPendingQueue();
      setQueue(res.data);
    } catch { /* not available */ }
  };

  useEffect(() => {
    if (available) {
      loadQueue();
      pollRef.current = setInterval(loadQueue, 10000);
    } else {
      setQueue([]);
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [available]);

  const toggleAvailability = async () => {
    setLoading(true);
    try {
      await updateAvailability(!available);
      setAvailable(!available);
    } finally {
      setLoading(false);
    }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await updateLocation(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const doAccept = async (bookingId: number) => {
    setActionId(bookingId);
    try {
      const res = await acceptBooking(bookingId);
      setActiveTrip(res.data);
      setQueue([]);
      if (pollRef.current) clearInterval(pollRef.current);
    } finally {
      setActionId(null);
    }
  };

  const doAction = async (fn: () => Promise<any>) => {
    setActionId(-1);
    try {
      const res = await fn();
      setActiveTrip(res.data);
      if (res.data.status === "completed") {
        setActiveTrip(null);
        setAvailable(true);
        loadQueue();
      }
    } finally {
      setActionId(null);
    }
  };

  const tripActions: Record<string, { label: string; fn: () => Promise<any>; cls: string } | null> = {
    accepted:       { label: "I've Arrived at Pickup", fn: () => markArrived(activeTrip!.id), cls: "btn-secondary" },
    driver_arrived: { label: "Start Trip",             fn: () => startTrip(activeTrip!.id),   cls: "btn-primary" },
    in_progress:    { label: "Complete Trip ✅",       fn: () => completeTrip(activeTrip!.id), cls: "btn-success" },
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-in">
          <div>
            <p className="text-white/40 text-sm">Driver Dashboard</p>
            <h1 className="text-3xl font-bold mt-0.5">{driver?.full_name?.split(" ")[0]} 🚗</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/40">
              <span className="flex items-center gap-1">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                {driver?.average_rating.toFixed(1)}
              </span>
              <span>·</span>
              <span>{driver?.total_trips} trips</span>
              <span>·</span>
              <span>{driver?.vehicle_model}</span>
            </div>
          </div>
          <div className="glass px-3 py-2 text-xs text-white/40">
            {driver?.vehicle_plate}
          </div>
        </div>

        {/* Availability toggle */}
        <div className="glass-dark p-5 mb-6 flex items-center justify-between animate-slide-up">
          <div>
            <p className="font-semibold">Availability</p>
            <p className="text-sm text-white/40 mt-0.5">
              {available ? "You're online and visible to customers" : "You're offline — customers can't see you"}
            </p>
          </div>
          <button type="button" onClick={toggleAvailability} disabled={loading} aria-label="Toggle availability" className="flex items-center gap-2 transition-all">
            {loading ? (
              <Spinner size={24} />
            ) : available ? (
              <ToggleRight size={44} className="text-emerald-400" />
            ) : (
              <ToggleLeft size={44} className="text-white/20" />
            )}
          </button>
        </div>

        {/* Location share */}
        {available && (
          <button
            type="button"
            onClick={shareLocation}
            disabled={locating}
            className="btn-secondary flex items-center justify-center gap-2 mb-6"
          >
            {locating ? <Spinner size={16} /> : <MapPin size={16} />}
            {locating ? "Getting location…" : "Share My Current Location"}
          </button>
        )}

        {/* Active trip */}
        {activeTrip && (
          <div className="glass border-violet-500/30 p-5 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Zap size={16} className="text-violet-400" /> Active Trip
              </h2>
              <StatusBadge status={activeTrip.status} />
            </div>

            <div className="mb-3"><ServiceBadge b={activeTrip} /></div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/40">{activeTrip.service_type === "designated" ? "Customer's car is at" : "Pickup"}</p>
                  <p className="text-sm text-white">{activeTrip.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/40">Destination</p>
                  <p className="text-sm text-white">{activeTrip.destination_address}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-white/40 mb-5 pb-4 border-b border-white/5">
              <span>{activeTrip.distance_km?.toFixed(1)} km</span>
              <span>·</span>
              <span className="text-white font-semibold">${activeTrip.estimated_fare?.toFixed(2)}</span>
              {activeTrip.is_night_surge && <span className="text-amber-400">🌙 Surge</span>}
            </div>

            {activeTrip.notes && (
              <div className="bg-white/5 rounded-xl px-3 py-2 text-sm text-white/60 mb-4">
                📝 {activeTrip.notes}
              </div>
            )}

            {tripActions[activeTrip.status] && (
              <button
                type="button"
                onClick={() => doAction(tripActions[activeTrip.status]!.fn)}
                disabled={actionId === -1}
                className={`${tripActions[activeTrip.status]!.cls} flex items-center justify-center gap-2`}
              >
                {actionId === -1 && <Spinner size={16} />}
                {tripActions[activeTrip.status]!.label}
              </button>
            )}
          </div>
        )}

        {/* Queue */}
        {available && !activeTrip && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-white/40" />
                <h2 className="font-semibold text-white/70 text-sm uppercase tracking-wide">Pending Requests</h2>
                {queue.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold">
                    {queue.length}
                  </span>
                )}
              </div>
              <button type="button" onClick={loadQueue} aria-label="Refresh queue" className="text-white/30 hover:text-white transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>

            {queue.length === 0 ? (
              <div className="glass text-center py-12 text-white/30">
                <p className="text-4xl mb-3">🕐</p>
                <p>Waiting for new booking requests…</p>
                <p className="text-xs mt-2">Auto-refreshes every 10 seconds</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {queue.map((b) => (
                  <div key={b.id} className="glass-dark p-5 animate-slide-up">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs text-white/40">#{b.id} · {new Date(b.created_at).toLocaleTimeString()}</span>
                      {b.is_night_surge && <span className="text-xs text-amber-400">🌙 Night surge</span>}
                    </div>

                    <div className="mb-3"><ServiceBadge b={b} /></div>

                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-violet-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-white">{b.pickup_address}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-white">{b.destination_address}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white/40">
                        {b.distance_km?.toFixed(1)} km · <span className="text-white font-semibold">${b.estimated_fare?.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => doAccept(b.id)}
                        disabled={actionId === b.id}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionId === b.id ? <Spinner size={14} /> : <CheckCircle size={14} />}
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Offline state */}
        {!available && !activeTrip && (
          <div className="glass text-center py-16 text-white/30 animate-fade-in">
            <Car size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">You're offline</p>
            <p className="text-sm mt-1">Toggle availability above to start accepting rides</p>
          </div>
        )}
      </div>
    </div>
  );
}
