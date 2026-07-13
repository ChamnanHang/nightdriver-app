import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "../utils/leafletIcons";
import { destinationIcon, driverIcon, pickupIcon } from "../utils/leafletIcons";
import type { Booking } from "../types";

// Fit map bounds whenever key coords change
function AutoBounds({ booking }: { booking: Booking }) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngTuple[] = [
      [booking.pickup_lat, booking.pickup_lng],
      [booking.destination_lat, booking.destination_lng],
    ];
    if (booking.driver?.current_lat && booking.driver?.current_lng) {
      points.push([booking.driver.current_lat, booking.driver.current_lng]);
    }
    if (booking.driver_accept_lat && booking.driver_accept_lng) {
      points.push([booking.driver_accept_lat, booking.driver_accept_lng]);
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
  }, [
    booking.pickup_lat, booking.pickup_lng,
    booking.destination_lat, booking.destination_lng,
    booking.driver?.current_lat, booking.driver?.current_lng,
  ]);

  return null;
}

interface Props { booking: Booking }

const ACTIVE = ["accepted", "driver_arrived", "in_progress"];

export default function BookingMap({ booking }: Props) {
  const center: L.LatLngTuple = [booking.pickup_lat, booking.pickup_lng];
  const driverCurrentLat = booking.driver?.current_lat;
  const driverCurrentLng = booking.driver?.current_lng;
  const showDriver = ACTIVE.includes(booking.status) && driverCurrentLat && driverCurrentLng;

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "300px", width: "100%", borderRadius: "12px" }}
        className="z-0"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <AutoBounds booking={booking} />

        {/* Customer pickup */}
        <Marker position={[booking.pickup_lat, booking.pickup_lng]} icon={pickupIcon}>
          <Popup>
            <strong>📍 Your Pickup</strong><br />
            {booking.pickup_address}
          </Popup>
        </Marker>

        {/* Destination */}
        <Marker position={[booking.destination_lat, booking.destination_lng]} icon={destinationIcon}>
          <Popup>
            <strong>🏁 Destination</strong><br />
            {booking.destination_address}
          </Popup>
        </Marker>

        {/* Trip route line */}
        <Polyline
          positions={[
            [booking.pickup_lat, booking.pickup_lng],
            [booking.destination_lat, booking.destination_lng],
          ]}
          color="#8b5cf6"
          weight={3}
          dashArray="8, 6"
          opacity={0.7}
        />

        {/* Driver current location */}
        {showDriver && (
          <>
            <Marker position={[driverCurrentLat!, driverCurrentLng!]} icon={driverIcon}>
              <Popup>
                <strong>🚗 Driver: {booking.driver?.full_name}</strong><br />
                {booking.driver?.vehicle_model} · {booking.driver?.vehicle_plate}
                {booking.eta_minutes && booking.status === "accepted" && (
                  <><br /><span className="popup-eta">ETA ~{booking.eta_minutes} min</span></>
                )}
              </Popup>
            </Marker>

            {/* Driver → Pickup line (dashed gold) */}
            {booking.status === "accepted" && (
              <Polyline
                positions={[
                  [driverCurrentLat!, driverCurrentLng!],
                  [booking.pickup_lat, booking.pickup_lng],
                ]}
                color="#f59e0b"
                weight={2}
                dashArray="5, 8"
                opacity={0.8}
              />
            )}
          </>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[999] bg-night-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs flex flex-col gap-1 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-500 shrink-0" />
          <span className="text-white/70">Your pickup</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-white/70">Destination</span>
        </div>
        {showDriver && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
            <span className="text-white/70">Driver</span>
          </div>
        )}
      </div>

      {/* ETA badge */}
      {booking.eta_minutes && booking.status === "accepted" && (
        <div className="absolute top-3 right-3 z-[999] bg-amber-500/20 border border-amber-500/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-400">
          🚗 ETA ~{booking.eta_minutes} min
        </div>
      )}
    </div>
  );
}
