import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AiAdvicePanel from "../components/AiAdvicePanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AiHub() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("modview_token");
        const res = await fetch(`${API_URL}/api/cars`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("modview_token");
          navigate("/auth", { replace: true });
          return;
        }

        if (!res.ok) return;
        const data = await res.json();
        setCars(data);
        if (data.length > 0) setSelectedCarId(data[0]._id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [navigate]);

  const selectedCar = cars.find((car) => car._id === selectedCarId) || null;

  if (loading) {
    return <div className="loading">Loading AI Adviser...</div>;
  }

  if (cars.length === 0) {
    return (
      <div className="card card-pad" style={{ maxWidth: 780, margin: "24px auto" }}>
        <h1>AI Adviser</h1>
        <p>Add a car to your garage first so AI can use your history and photos.</p>
        <Link className="primary-btn" to="/garage">
          Go to My Garage
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "24px auto" }}>
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <h1 style={{ marginTop: 0 }}>AI Adviser</h1>
        <p className="ai-context-note" style={{ marginBottom: 12 }}>
          Choose a car to get AI recommendations with timeline-aware advice and visual preview support.
        </p>
        <label className="label" htmlFor="ai-car-selector">
          Select car
        </label>
        <select
          id="ai-car-selector"
          value={selectedCarId}
          onChange={(e) => setSelectedCarId(e.target.value)}
        >
          {cars.map((car) => (
            <option key={car._id} value={car._id}>
              {car.year} {car.make} {car.model}
            </option>
          ))}
        </select>
      </div>

      {selectedCar && <AiAdvicePanel carId={selectedCar._id} car={selectedCar} />}
    </div>
  );
}
