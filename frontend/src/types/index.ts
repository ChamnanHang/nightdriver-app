export type Role = "customer" | "driver";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface Driver {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  vehicle_model: string;
  vehicle_plate: string;
  is_available: boolean;
  average_rating: number;
  total_trips: number;
  current_lat: number | null;
  current_lng: number | null;
  created_at: string;
}

export type ServiceType = "designated" | "ride";
export type Transmission = "auto" | "manual";

export interface FareQuote {
  in_service_area: boolean;
  zone_name: string | null;
  distance_km: number;
  is_night_surge: boolean;
  night_surge_multiplier: number;
  khr_per_usd: number;
  designated: { fare_usd: number; fare_khr: number };
  ride: { fare_usd: number; fare_khr: number };
}

export type BookingStatus =
  | "pending"
  | "accepted"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Booking {
  id: number;
  customer_id: number;
  driver_id: number | null;
  service_type: ServiceType;
  car_model: string | null;
  car_plate: string | null;
  car_transmission: Transmission | null;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  driver_accept_lat: number | null;
  driver_accept_lng: number | null;
  eta_minutes: number | null;
  distance_km: number | null;
  estimated_fare: number | null;
  final_fare: number | null;
  is_night_surge: boolean;
  status: BookingStatus;
  notes: string | null;
  cancel_reason: string | null;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  customer?: User;
  driver?: Driver;
}

export interface Review {
  id: number;
  booking_id: number;
  customer_id: number;
  driver_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  role: Role;
}
