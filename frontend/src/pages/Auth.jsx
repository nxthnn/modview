import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function getApiBase() {
  const base = import.meta.env.VITE_API_URL;
  return (base || "").replace(/\/+$/, "");
}

export default function Auth() {
  const navigate = useNavigate();
  const apiBase = useMemo(() => getApiBase(), []);

  const [mode, setMode] = useState("login"); // "login" | "register"
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!apiBase) {
      setError("Missing VITE_API_URL. Create frontend/.env and restart Vite.");
      return;
    }

    if (!isLogin && password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email, password }
        : { email, password }; // add name later if your backend expects it

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Request failed.");
        return;
      }

      if (!data.token) {
        setError("No token returned from server.");
        return;
      }

      localStorage.setItem("modview_token", data.token);
      navigate("/garage");
    } catch (err) {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{isLogin ? "Login" : "Create account"}</h1>

        <div className="auth-tabs" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
            aria-selected={isLogin}
          >
            Login
          </button>

          <button
            type="button"
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
            aria-selected={!isLogin}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-row">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-row">
              <label className="auth-label" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                className="auth-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </section>
  );
}
