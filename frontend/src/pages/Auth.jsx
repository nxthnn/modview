import { useEffect, useMemo, useState } from "react";
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

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [usernameMessage, setUsernameMessage] = useState("");

  useEffect(() => {
    if (isLogin) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    const value = username.trim().toLowerCase();

    if (!value) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (value.length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage("Username must be at least 3 characters.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setUsernameStatus("checking");
        setUsernameMessage("Checking availability...");

        const res = await fetch(
          `${apiBase}/api/auth/check-username?username=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setUsernameStatus("error");
          setUsernameMessage(data.message || "Unable to check username right now.");
          return;
        }

        if (data.available) {
          setUsernameStatus("available");
          setUsernameMessage("Username is available.");
        } else {
          setUsernameStatus("unavailable");
          setUsernameMessage("Username is already taken.");
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        setUsernameStatus("error");
        setUsernameMessage("Unable to check username right now.");
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [apiBase, isLogin, username]);

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

    if (!isLogin) {
      if (usernameStatus === "checking") {
        setError("Please wait for username availability to finish checking");
        return;
      }

      const normalizedUsername = username.trim().toLowerCase();

      if (!normalizedUsername) {
        setError("Username is required");
        return;
      }

      if (normalizedUsername.length < 3) {
        setError("Username must be at least 3 characters");
        return;
      }

      if (usernameStatus === "unavailable") {
        setError("That username is already taken");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { identifier: email.trim(), password }
        : { username: username.trim(), email, password };

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
          {!isLogin && (
            <div className="form-row">
              <label className="auth-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="auth-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-handle"
                autoComplete="username"
                required
              />
              <p className={`auth-help ${usernameStatus}`}>{usernameMessage || "Choose a unique username."}</p>
            </div>
          )}

          <div className="form-row">
            <label className="auth-label" htmlFor="email">
              {isLogin ? "Username or email" : "Email"}
            </label>
            <input
              id="email"
              className="auth-input"
              type={isLogin ? "text" : "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isLogin ? "your-handle or you@example.com" : "you@example.com"}
              autoComplete={isLogin ? "username" : "email"}
              required
            />
            {isLogin && <p className="auth-help">You can sign in with either your username or email.</p>}
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

          <button
            className="primary-btn"
            type="submit"
            disabled={loading || (!isLogin && usernameStatus === "checking")}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </section>
  );
}
