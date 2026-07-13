import { Clock, MapPin, Navigation, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { cancelBooking, createBooking, getMyBookings } from "../../api/client";
import AddressSearch from "../../components/AddressSearch";
import BookingCard from "../../components/BookingCard";
import type { LatLng } from "../../components/MapPicker";
import MapPicker from "../../components/MapPicker";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../contexts/AuthContext";
import type { Booking } from "../../types";
import { reverseGeocode } from "../../utils/geocode";

interface BookingForm { notes: string; }

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Map state
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [selecting, setSelecting] = useState<"pickup" | "destination">("pickup");
  const [resolving, setResolving] = useState(false);

  const { register, handleSubmit, reset } = useForm<BookingForm>();

  const load = async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePickup = async (ll: LatLng) => {
    setPickup(ll);
    setResolving(true);
    const addr = await reverseGeocode(ll.lat, ll.lng);
    setPickupAddress(addr);
    setResolving(false);
    setSelecting("destination");
  };

  const handleDestination = async (ll: LatLng) => {
    setDestination(ll);
    setResolving(true);
    const addr = await reverseGeocode(ll.lat, ll.lng);
    setDestinationAddress(addr);
    setResolving(false);
  };

  const resetForm = () => {
    reset();
    setPickup(null);
    setDestination(null);
    setPickupAddress("");
    setDestinationAddress("");
    setSelecting("pickup");
    setFormError("");
    setShowForm(false);
  };

  const onBook = async (data: BookingForm) => {
    if (!pickup || !destination) {
      setFormError("Please set both pickup and destination on the map.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createBooking({
        pickup_address: pickupAddress,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        destination_address: destinationAddress,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        notes: data.notes || undefined,
      });
      resetForm();
      load();
    } catch (e: any) {
      setFormError(e.response?.data?.detail ?? "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const activeBooking = bookings.find(
    (b) => !["completed", "cancelled"].includes(b.status)
  );

  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <p className="text-white/40 text-sm mb-1">
            {isNight ? "🌙 Night surge pricing active" : "Good day"}
          </p>
          <h1 className="text-3xl font-bold">Hi, {user?.full_name?.split(" ")[0]} 👋</h1>
          <p className="text-white/40 mt-1">Where do you need a ride tonight?</p>
        </div>

        {/* Active booking banner */}
        {activeBooking && (
          <div className="glass border-violet-500/30 p-5 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-violet-400">Active Booking</span>
              <button
                type="button"
                onClick={async () => { await cancelBooking(activeBooking.id); load(); }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
              >
                <X size={12} /> Cancel
              </button>
            </div>
            <p className="text-sm text-white/60 truncate">{activeBooking.pickup_address}</p>
            <p className="text-xs text-white/30 mt-0.5">→ {activeBooking.destination_address}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeBooking.status === "pending" ? "bg-amber-400 animate-pulse" : "bg-violet-400 animate-pulse"}`} />
              <span className="text-xs text-white/50 capitalize">{activeBooking.status.replace("_", " ")}</span>
            </div>
          </div>
        )}

        {/* Book Now button */}
        {!showForm && !activeBooking && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full glass border-dashed border-white/20 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all p-6 flex flex-col items-center gap-3 mb-6 rounded-2xl cursor-pointer group animate-slide-up"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 group-hover:bg-violet-600/30 transition-colors flex items-center justify-center">
              <Plus className="text-violet-400" size={24} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Book a Driver</p>
              <p className="text-sm text-white/40 mt-0.5">Pick locations on the map</p>
            </div>
          </button>
        )}

        {/* Booking form with map */}
        {showForm && (
          <div className="glass-dark p-6 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">New Booking</h2>
              <button type="button" onClick={resetForm} aria-label="Close form" className="text-white/30 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
                {formError}
              </div>
            )}

            {isNight && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-400 mb-4 flex items-center gap-2">
                🌙 Night surge (1.5×) is active
              </div>
            )}

            {/* Address search boxes */}
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPin size={13} className="text-violet-400" /> Pickup Location
                </label>
                <AddressSearch
                  placeholder="Search pickup address…"
                  onSelect={(r) => {
                    const ll = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
                    setPickup(ll);
                    setPickupAddress(r.display_name);
                    setSelecting("destination");
                  }}
                />
                {pickup && (
                  <p className="text-xs text-violet-400 mt-1 truncate">
                    📍 {pickupAddress || `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}`}
                  </p>
                )}
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Navigation size={13} className="text-emerald-400" /> Destination
                </label>
                <AddressSearch
                  placeholder="Search destination address…"
                  onSelect={(r) => {
                    const ll = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
                    setDestination(ll);
                    setDestinationAddress(r.display_name);
                  }}
                />
                {destination && (
                  <p className="text-xs text-emerald-400 mt-1 truncate">
                    🏁 {destinationAddress || `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`}
                  </p>
                )}
              </div>
            </div>

            {/* Map selector */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs text-white/40">Or click on the map to set location</p>
                <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setSelecting("pickup")}
                    className={`px-3 py-1.5 transition-colors ${selecting === "pickup" ? "bg-violet-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                  >
                    <MapPin size={11} className="inline mr-1" />Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelecting("destination")}
                    className={`px-3 py-1.5 transition-colors ${selecting === "destination" ? "bg-emerald-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                  >
                    <Navigation size={11} className="inline mr-1" />Destination
                  </button>
                </div>
              </div>

              {resolving && <p className="text-xs text-white/30 mb-1 animate-pulse">Getting address…</p>}

              <MapPicker
                pickup={pickup}
                destination={destination}
                selecting={selecting}
                onPickup={handlePickup}
                onDestination={handleDestination}
              />
            </div>

            <form onSubmit={handleSubmit(onBook)} className="flex flex-col gap-4">
              <div>
                <label className="label">Notes for driver (optional)</label>
                <input placeholder="e.g. I'll be wearing a red jacket…" {...register("notes")} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center gap-2"
                  disabled={submitting || !pickup || !destination}
                >
                  {submitting && <Spinner size={16} />}
                  {submitting ? "Booking…" : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Booking history */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-white/40" />
            <h2 className="font-semibold text-white/70 text-sm uppercase tracking-wide">Your Rides</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size={32} /></div>
          ) : bookings.length === 0 ? (
            <div className="glass text-center py-12 text-white/30">
              <p className="text-4xl mb-3">🚗</p>
              <p>No rides yet. Book your first safe ride home.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
