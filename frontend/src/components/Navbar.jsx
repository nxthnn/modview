import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/modview.png";


function Crumb({ to, children }) {
  return (
    <>
      <span className="sep">/</span>
      <Link to={to}>{children}</Link>
    </>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("modview_token");

  function signOut() {
    localStorage.removeItem("modview_token");
    navigate("/");
  }

  // Basic breadcrumbs aligned with your wireframe.
  // You can expand this later for car name, etc.
  const showCrumbs = token && location.pathname !== "/" && location.pathname !== "/auth";

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          {/* Left */}
         <div className="brand">
  <Link to="/" className="brand-link">
    <span className="brand-text">Modview</span>
  </Link>
</div>


          {/* Center (wireframe "logo box") */}
          <div className="center-slot">
            <img 
              src={logo} 
              alt="Modview logo" 
              className="brand-logo"
              title="Modview"
            />
          </div>

          {/* Right */}
          <div className="topbar-actions">
            {token ? (
              <>
                <Link to="/feed">Feed</Link>
                <Link to="/explore">Explore</Link>
                <Link to="/garage">My Garage</Link>
                <Link to="/ai">AI Adviser</Link>
                <button className="btn btn-danger" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth">Login / Create account</Link>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb row under the top bar (wireframe) */}
      {showCrumbs && (
        <div className="breadcrumbs">
          <Link to="/garage">My Garage</Link>

          {location.pathname.startsWith("/ai") && <Crumb to="/ai">AI Adviser</Crumb>}

          {/* Example placeholder for car detail later:
              if (location.pathname.startsWith("/garage/")) show Car Name */}
        </div>
      )}
    </>
  );
}
