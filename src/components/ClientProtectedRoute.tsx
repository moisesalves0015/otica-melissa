import * as React from "react";
import { Navigate, Outlet } from "react-router-dom";

const SESSION_DURATION_HOURS = 8;

export function getClientSession() {
  try {
    const raw = localStorage.getItem("otica_client_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Verifica expiração
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem("otica_client_session");
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export default function ClientProtectedRoute() {
  const session = getClientSession();

  if (!session) {
    return <Navigate to="/cliente/login" replace />;
  }

  return <Outlet />;
}
