import { MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { createBooking } from "../../api/client";
import AddressSearch from "../../components/AddressSearch";
import type { LatLng } from "../../components/MapPicker";
import MapPicker from "../../components/MapPicker";
import { reverseGeocode } from "../../utils/geocode";
import { useTelegram } from "../useTelegram";

type Step = "pickup" | "destination" | "confirm";

interface Props {
  onDone: () => void;
  onBack: () => void;
}

export default function TgBookRide({ onDone, onBack }: Props) {
  const { showMainButton, hideMainButton, setMainButtonLoading, showBackButton, hideBackButton, haptic, alert } = useTelegram();

  const [step, setStep] = useState<Step>("pickup");
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [pickupAddr, setPickupAddr] = useState("");
  const [destAddr, setDestAddr] = useState("");
  const [notes, setNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const goBack = () => {
    haptic.light();
    if (step === "pickup") { onBack(); return; }
    if (step === "destination") setStep("pickup");
    if (step === "confirm") setStep("destination");
  };

  const submit = async () => {
    if (!pickup || !destination) return;
    haptic.medium();
    setMainButtonLoading(true);
    try {
      await createBooking({
        pickup_address: pickupAddr,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        destination_address: destAddr,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        notes: notes || undefined,
      });
      haptic.success();
      onDone();
    } catch (e: any) {
      haptic.error();
      alert(e.response?.data?.detail ?? "Booking failed. Please try again.");
    } finally {
      setMainButtonLoading(false);
    }
  };

  // Wire MainButton and BackButton per step
  useEffect(() => {
    showBackButton(goBack);

    if (step === "pickup") {
      if (pickup) {
        showMainButton("Next: Set Destination →", () => { haptic.light(); setStep("destination"); });
      } else {
        hideMainButton();
      }
    } else if (step === "destination") {
      if (destination) {
        showMainButton("Next: Confirm Booking →", () => { haptic.light(); setStep("confirm"); });
      } else {
        hideMainButton();
      }
    } else if (step === "confirm") {
      showMainButton("✅ Confirm Booking", submit);
    }

    return () => { hideMainButton(); hideBackButton(); };
  }, [step, pickup, destination]);

  const handlePickup = async (ll: LatLng) => {
    setPickup(ll);
    setResolving(true);
    const addr = await reverseGeocode(ll.lat, ll.lng);
    setPickupAddr(addr);
    setResolving(false);
  };

  const handleDestination = async (ll: LatLng) => {
    setDestination(ll);
    setResolving(true);
    const addr = await reverseGeocode(ll.lat, ll.lng);
    setDestAddr(addr);
    setResolving(false);
  };

  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(["pickup", "destination", "confirm"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s ? "bg-violet-600 text-white" : (["pickup","destination","confirm"].indexOf(step) > i ? "bg-emerald-600 text-white" : "bg-white/10 text-white/30")}`}>
              {i + 1}
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 ${["pickup","destination","confirm"].indexOf(step) > i ? "bg-emerald-600" : "bg-white/10"}`} style={{ width: 24 }} />}
          </div>
        ))}
        <p className="text-xs text-white/40 ml-1 capitalize">{step === "pickup" ? "Set Pickup" : step === "destination" ? "Set Destination" : "Confirm"}</p>
      </div>

      {isNight && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-400">
          🌙 Night surge pricing (1.5×) active
        </div>
      )}

      {/* Step: Pickup */}
      {step === "pickup" && (
        <>
          <div>
            <label className="label flex items-center gap-1.5">
              <MapPin size={12} className="text-violet-400" /> Pickup Location
            </label>
            <AddressSearch
              placeholder="Search pickup address…"
              onSelect={(r) => handlePickup({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) })}
            />
            {pickup && <p className="text-xs text-violet-400 mt-1 truncate">📍 {pickupAddr}</p>}
          </div>
          <p className="text-xs text-white/30 text-center">or tap on the map</p>
          <MapPicker pickup={pickup} destination={null} selecting="pickup" onPickup={handlePickup} onDestination={() => {}} />
          {resolving && <p className="text-xs text-white/30 animate-pulse text-center">Getting address…</p>}
        </>
      )}

      {/* Step: Destination */}
      {step === "destination" && (
        <>
          <div className="glass-dark p-3 flex items-start gap-2">
            <MapPin size={13} className="text-violet-400 mt-0.5 shrink-0" />
            <p className="text-sm text-white/70 truncate">{pickupAddr}</p>
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Navigation size={12} className="text-emerald-400" /> Destination
            </label>
            <AddressSearch
              placeholder="Search destination address…"
              onSelect={(r) => handleDestination({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) })}
            />
            {destination && <p className="text-xs text-emerald-400 mt-1 truncate">🏁 {destAddr}</p>}
          </div>
          <p className="text-xs text-white/30 text-center">or tap on the map</p>
          <MapPicker pickup={pickup} destination={destination} selecting="destination" onPickup={() => {}} onDestination={handleDestination} />
          {resolving && <p className="text-xs text-white/30 animate-pulse text-center">Getting address…</p>}
        </>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && pickup && destination && (
        <>
          <MapPicker pickup={pickup} destination={destination} selecting="destination" onPickup={() => {}} onDestination={() => {}} />
          <div className="glass-dark p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-violet-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-white/40">Pickup</p><p className="text-sm text-white">{pickupAddr}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-white/40">Destination</p><p className="text-sm text-white">{destAddr}</p></div>
            </div>
          </div>
          <div>
            <label className="label text-xs">Notes for driver (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. I'll be in front of the main entrance…"
            />
          </div>
        </>
      )}
    </div>
  );
}
