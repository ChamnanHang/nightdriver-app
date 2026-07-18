import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// Telegram Mini App
export const telegramAuth = (init_data: string) =>
  api.post("/telegram/auth", { init_data });

// Auth
export const registerCustomer = (d: object) => api.post("/auth/register", d);
export const loginCustomer = (d: object) => api.post("/auth/login", d);
export const registerDriver = (d: object) => api.post("/auth/driver/register", d);
export const loginDriver = (d: object) => api.post("/auth/driver/login", d);

// Users
export const getMe = () => api.get("/users/me");
export const updateMe = (d: object) => api.put("/users/me", d);

// Drivers
export const getDriverMe = () => api.get("/drivers/me");
export const getAvailableDrivers = () => api.get("/drivers/available");
export const updateAvailability = (is_available: boolean) =>
  api.put("/drivers/me/availability", { is_available });
export const updateLocation = (lat: number, lng: number) =>
  api.put("/drivers/me/location", { lat, lng });

// Bookings
export const getFareQuote = (p: {
  pickup_lat: number; pickup_lng: number;
  destination_lat: number; destination_lng: number;
}) => api.get("/bookings/quote", { params: p });
export const createBooking = (d: object) => api.post("/bookings", d);
export const getMyBookings = () => api.get("/bookings/my");
export const getBooking = (id: number) => api.get(`/bookings/${id}`);
export const cancelBooking = (id: number, reason?: string) =>
  api.post(`/bookings/${id}/cancel`, { reason });
export const getPendingQueue = () => api.get("/bookings/driver/queue");
export const acceptBooking = (id: number) => api.post(`/bookings/${id}/accept`);
export const markArrived = (id: number) => api.post(`/bookings/${id}/arrived`);
export const startTrip = (id: number) => api.post(`/bookings/${id}/start`);
export const completeTrip = (id: number) => api.post(`/bookings/${id}/complete`);

// Reviews
export const submitReview = (bookingId: number, d: object) =>
  api.post(`/bookings/${bookingId}/review`, d);

export default api;
