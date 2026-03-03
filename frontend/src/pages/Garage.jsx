import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/garage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Garage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCarData, setNewCarData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/cars`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCars(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/cars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCarData),
      });
      if (res.ok) {
        const car = await res.json();
        setCars([...cars, car]);
        setNewCarData({ make: "", model: "", year: new Date().getFullYear() });
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading garage...</div>;

  return (
    <section className="garage-page">
      <h1>My Garage</h1>

      {cars.length === 0 ? (
        <div className="no-cars">
          <p>No cars yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="cars-list">
          {cars.map((car) => (
            <Link key={car._id} to={`/garage/${car._id}`} className="car-card">
              {car.thumbnailUrl && <img src={car.thumbnailUrl} alt="car" />}
              <div className="car-card-info">
                <h3>
                  {car.year} {car.make} {car.model}
                </h3>
                {car.mileage > 0 && <p>📍 {car.mileage} mi</p>}
                {car.goals?.length > 0 && (
                  <div className="car-goals">
                    {car.goals.map((g) => (
                      <span key={g} className="goal-badge">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {showForm ? (
          <form onSubmit={handleAddCar} className="add-car-form">
            <input
              type="text"
              placeholder="Make (e.g., BMW)"
              value={newCarData.make}
              onChange={(e) => setNewCarData({ ...newCarData, make: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Model (e.g., M340i)"
              value={newCarData.model}
              onChange={(e) => setNewCarData({ ...newCarData, model: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Year"
              value={newCarData.year}
              onChange={(e) => setNewCarData({ ...newCarData, year: parseInt(e.target.value) })}
              required
            />
            <button type="submit">Add Car</button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button className="primary-btn" onClick={() => setShowForm(true)}>
            + Add New Car
          </button>
        )}
      </div>
    </section>
  );
}
