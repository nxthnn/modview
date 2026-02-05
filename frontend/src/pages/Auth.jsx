import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
  e.preventDefault();
  setError("");

  if (mode === "register" && password !== confirm) {
    setError("Passwords do not match.");
    return;
  }

  const base = import.meta.env.VITE_API_URL;
  const url =
    mode === "login"
      ? `${base}/api/auth/login`
      : `${base}/api/auth/register`;

  const payload =
    mode === "login"
      ? { email, password }
      : { name: "", email, password };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Something went wrong");
      return;
    }

    localStorage.setItem("modview_token", data.token);
    navigate("/garage");
  } catch (err) {
    setError("Network error. Is the backend running?");
  }
}


  return (
    <div style={{ maxWidth: 420 }}>
      <h1>{mode === "login" ? "Login" : "Create account"}</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode("login")} disabled={mode === "login"}>
          Login
        </button>
        <button
          onClick={() => setMode("register")}
          disabled={mode === "register"}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        {mode === "register" && (
          <label>
            Confirm password
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              required
            />
          </label>
        )}

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <button type="submit">{mode === "login" ? "Login" : "Create"}</button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14, opacity: 0.75 }}>
        (Backend comes later — this is a placeholder auth flow.)
      </p>
    </div>
  );
}
