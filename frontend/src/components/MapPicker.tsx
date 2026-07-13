import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import "../utils/leafletIcons";
import { destinationIcon, pickupIcon } from "../utils/leafletIcons";

export interface LatLng { lat: number; lng: number; }

interface Props {
  pickup: LatLng | null;
  destination: LatLng | null;
  selecting: "pickup" | "destination";
  onPickup: (ll: LatLng) => void;
  onDestination: (ll: LatLng) => void;
}

function ClickHandler({ selecting, onPickup, onDestination }: {
  selecting: "pickup" | "destination";
  onPickup: (ll: LatLng) => void;
  onDestination: (ll: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      const ll = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (selecting === "pickup") onPickup(ll);
      else onDestination(ll);
    },
  });
  return null;
}

function FlyTo({ pickup, destination }: { pickup: LatLng | null; destination: LatLng | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (pickup && destination) {
      map.fitBounds([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], { padding: [60, 60] });
    } else if (pickup) {
      map.flyTo([pickup.lat, pickup.lng], 14);
    } else if (destination) {
      map.flyTo([destination.lat, destination.lng], 14);
    }
  }, [pickup, destination]);
  return null;
}

export default function MapPicker({ pickup, destination, selecting, onPickup, onDestination }: Props) {
  const center: [number, number] = pickup
    ? [pickup.lat, pickup.lng]
    : destination
    ? [destination.lat, destination.lng]
    : [11.5625, 104.9160]; // Phnom Penh default

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "300px", width: "100%", borderRadius: "12px" }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <ClickHandler selecting={selecting} onPickup={onPickup} onDestination={onDestination} />
      <FlyTo pickup={pickup} destination={destination} />

      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>Pickup point</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {pickup && destination && (
        <Polyline
          positions={[[pickup.lat, pickup.lng], [destination.lat, destination.lng]]}
          color="#8b5cf6"
          weight={3}
          dashArray="8, 6"
        />
      )}
    </MapContainer>
  );
}
