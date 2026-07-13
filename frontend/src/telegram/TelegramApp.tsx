import WebApp from "@twa-dev/sdk";
import { Car } from "lucide-react";
import { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { getMyBookings, telegramAuth } from "../api/client";
import Spinner from "../components/Spinner";
import type { Booking } from "../types";
import TgBookRide from "./pages/TgBookRide";
import TgHome from "./pages/TgHome";
import TgRideDetail from "./pages/TgRideDetail";

type AuthState = "loading" | "authed" | "error";

export default function TelegramApp() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    // In dev/browser mode: skip Telegram auth and use localStorage token
    const initData = WebApp.initData;
    if (!initData) {
      // Running in a browser (not inside Telegram) — use existing token if any
      const token = localStorage.getItem("token");
      if (token) {
        setAuthState("authed");
        loadBookings();
      } else {
        setErrorMsg("Open this Mini App inside Telegram.");
        setAuthState("error");
      }
      return;
    }

    // Running inside Telegram — authenticate with backend
    telegramAuth(initData)
      .then((res) => {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("role", "customer");
        setAuthState("authed");
        loadBookings();
      })
      .catch((e) => {
        setErrorMsg(e.response?.data?.detail ?? "Authentication failed");
        setAuthState("error");
      });
  }, []);

  const loadBookings = async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.data);
    } catch { /* ignore */ }
  };

  if (authState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center">
          <Car size={28} />
        </div>
        <Spinner size={28} />
        <p className="text-white/40 text-sm">Signing you in…</p>
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <Car size={28} className="text-red-400" />
        </div>
        <p className="text-red-400 font-semibold">Authentication Error</p>
        <p className="text-white/40 text-sm">{errorMsg}</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        index
        element={
          <TgHome
            bookings={bookings}
            onBook={() => nav("/tg/book")}
          />
        }
      />
      <Route
        path="book"
        element={
          <TgBookRide
            onDone={() => { loadBookings(); nav("/tg"); }}
            onBack={() => nav("/tg")}
          />
        }
      />
      <Route path="ride/:id" element={<TgRideDetail />} />
    </Routes>
  );
}
