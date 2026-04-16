import { Navigate } from "react-router-dom";

function isValidJwt(token) {
  if (!token || token === "null" || token === "undefined") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(atob(parts[1]));
    if (!payload || typeof payload !== "object") return false;

    if (typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("modview_token");
  if (!isValidJwt(token)) {
    localStorage.removeItem("modview_token");
    return <Navigate to="/auth" replace />;
  }

  return children;
}
