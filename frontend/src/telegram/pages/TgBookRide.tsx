import { MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { createBooking, getFareQuote } from "../../api/client";
import AddressSearch from "../../components/AddressSearch";
import type { LatLng } from "../../components/MapPicker";
import MapPicker from "../../components/MapPicker";
import { FareEstimate, ServicePicker, loadSavedCar, saveCar, type CarInfo } from "../../components/ServicePicker";
import type { FareQuote, ServiceType } from "../../types";
import { reverseGeocode } from "../../utils/geocode";
import { useTelegram } from "../useTelegram";

type Step = "service" | "pickup" | "destination" | "confirm";
const STEPS: Step[] = ["service", "pickup", "destination", "confirm"];

interface Props {
  onDone: () => void;
  onBack: () => void;
}

export default function TgBookRide({ onDone, onBack }: Props) {
  const { showMainButton, hideMainButton, setMainButtonLoading, showBackButton, hideBackButton, haptic, alert } = useTelegram();

  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<ServiceType>("designated");
  const [car, setCar] = useState<CarInfo>(loadSavedCar);
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [pickupAddr, setPickupAddr] = useState("");
  const [destAddr, setDestAddr] = useState("");
  const [notes, setNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [quote, setQuote] = useState<FareQuote | null>(null);

  const carReady = service === "ride" || (car.model.trim() && car.plate.trim());

  const goBack = () => {
    haptic.light();
    const i = STEPS.indexOf(step);
    if (i === 0) { onBack(); return; }
    setStep(STEPS[i - 1]);
  };

  // Fetch fare quote when both points are set
  useEffect(() => {
    if (pickup && destination) {
      getFareQuote({
        pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        destination_lat: destination.lat, destination_lng: destination.lng,
      }).then((r) => setQuote(r.data)).catch(() => setQuote(null));
    }
  }, [pickup, destination]);

  const submit = async () => {
    if (!pickup || !destination) return;
    haptic.medium();
    setMainButtonLoading(true);
    try {
      await createBooking({
        service_type: service,
        car_model: service === "designated" ? car.model.trim() : undefined,
        car_plate: service === "designated" ? car.plate.trim() : undefined,
        car_transmission: service === "designated" ? car.transmission : undefined,
        pickup_address: pickupAddr,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        destination_address: destAddr,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        notes: notes || undefined,
      });
      if (service === "designated") saveCar(car);
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

    if (step === "service") {
      if (carReady) {
        showMainButton("Next: Where is your car? →", () => { haptic.light(); setStep("pickup"); });
      } else {
        hideMainButton();
      }
    } else if (step === "pickup") {
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
  }, [step, pickup, destination, service, car]);

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

  const stepIdx = STEPS.indexOf(step);
  const stepLabel =
    step === "service" ? "Choose Service"
    : step === "pickup" ? (service === "designated" ? "Where's your car?" : "Set Pickup")
    : step === "destination" ? "Set Destination"
    : "Confirm";

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s ? "bg-violet-600 text-white" : (stepIdx > i ? "bg-emerald-600 text-white" : "bg-white/10 text-white/30")}`}>
              {i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${stepIdx > i ? "bg-emerald-600" : "bg-white/10"}`} style={{ width: 16 }} />}
          </div>
        ))}
        <p className="text-xs text-white/40 ml-1">{stepLabel}</p>
      </div>

      {/* Step: Service type + car details */}
      {step === "service" && (
        <>
          <ServicePicker service={service} onService={setService} car={car} onCar={setCar} />
          {service === "designated" && !carReady && (
            <p className="text-xs text-white/30 text-center">Enter your car model and plate to continue</p>
          )}
        </>
      )}

      {/* Step: Pickup */}
      {step === "pickup" && (
        <>
          <div>
            <label className="label flex items-center gap-1.5">
              <MapPin size={12} className="text-violet-400" />
              {service === "designated" ? "Where is your car parked?" : "Pickup Location"}
            </label>
            <AddressSearch
              placeholder={service === "designated" ? "Search the bar / restaurant / KTV…" : "Search pickup address…"}
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
              <Navigation size={12} className="text-emerald-400" /> Home / Hotel Destination
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
          {quote && <FareEstimate quote={quote} service={service} />}
          <MapPicker pickup={pickup} destination={destination} selecting="destination" onPickup={() => {}} onDestination={() => {}} />
          <div className="glass-dark p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{service === "designated" ? "🔑" : "🚕"}</span>
              <div>
                <p className="text-sm text-white font-medium">
                  {service === "designated" ? "Drive My Car" : "Need a Ride"}
                </p>
                {service === "designated" && (
                  <p className="text-xs text-white/40">
                    {car.model} · {car.plate} · {car.transmission === "auto" ? "Automatic" : "Manual"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-violet-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-white/40">{service === "designated" ? "Your car is at" : "Pickup"}</p><p className="text-sm text-white">{pickupAddr}</p></div>
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
              placeholder="e.g. Black Camry in the parking lot, I'm inside the bar…"
            />
          </div>
        </>
      )}
    </div>
  );
}
