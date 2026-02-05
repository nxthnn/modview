import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("modview_token");

  function signOut() {
    localStorage.removeItem("modview_token");
    navigate("/");
  }

  return (
    <div
      style={{
        borderBottom: "1px solid #ddd",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/" style={{ fontWeight: 700, textDecoration: "none" }}>
          Modview
        </Link>

        {token && (
          <>
            <Link to="/garage">My Garage</Link>
            <Link to="/ai">AI</Link>
          </>
        )}
      </div>

      <div>
        {!token ? (
          <Link to="/auth">Login / Create account</Link>
        ) : (
          <button onClick={signOut}>Sign out</button>
        )}
      </div>
    </div>
  );
}
