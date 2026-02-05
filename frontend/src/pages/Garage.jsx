import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/garage.css";

export default function Garage() {
  // Placeholder cars (API later)
  const cars = useMemo(
    () => [
      { id: 1, name: "Mini Cooper S", year: 2011 },
      { id: 2, name: "Nissan Micra", year: 2008 },
    ],
    []
  );

  // Placeholder: selected car
  const [selectedCarId] = useState(cars[0]?.id ?? null);
  const selectedCar = cars.find((c) => c.id === selectedCarId);

  if (!selectedCar) {
    return (
      <section className="garage-page">
        <h1>My Garage</h1>
        <p>No cars added yet.</p>
      </section>
    );
  }

  return (
    <section className="garage-page">
      {/* Breadcrumb like your wireframe */}
      <div className="breadcrumbs">
        <Link to="/garage">My Garage</Link>
        <span>/</span>
        <span>
          {selectedCar.name} {selectedCar.year}
        </span>
      </div>

      <div className="garage-layout">
        {/* LEFT: photos area */}
        <div className="garage-panel">
          <h1 style={{ marginTop: 0 }}>{selectedCar.name}</h1>

          <div className="photo-grid" style={{ marginTop: 12 }}>
            <div className="photo">
              <span>Front</span>
            </div>
            <div className="photo">
              <span>Back</span>
            </div>
            <div className="photo">
              <span>Driver side</span>
            </div>
            <div className="photo">
              <span>Passenger side</span>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <button className="primary-btn">+ Upload photos</button>
          </div>
        </div>

        {/* RIGHT: menu like your wireframe */}
        <aside className="side-menu">
          <div className="menu-title">Sections</div>

          {/* These can later become real routes:
              /garage/:carId/mods, /maintenance, /notes, /ai, /image-gen */}
          <NavLink className="menu-item" to="/car/1/mods">
            Modlist
          </NavLink>
          <NavLink className="menu-item" to="/car/1/maintenance">
            Maintenance
          </NavLink>
          <NavLink className="menu-item" to="/car/1/notes">
            Notes / ideas
          </NavLink>
          <NavLink className="menu-item" to="/ai">
            AI adviser
          </NavLink>
          <NavLink className="menu-item" to="/car/1/image-gen">
            Image Gen
          </NavLink>

          <div style={{ marginTop: 16 }}>
            <button className="primary-btn" style={{ width: "100%" }}>
              + Add new car
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
