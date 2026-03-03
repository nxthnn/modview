import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import AiAdvicePanel from "../components/AiAdvicePanel";
import "../styles/garage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [mods, setMods] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("modview_token");

      // Fetch car details
      const carRes = await fetch(`${API_URL}/api/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (carRes.ok) {
        const carData = await carRes.json();
        setCar(carData);

        // Fetch maintenance and mods
        const [mainRes, modRes] = await Promise.all([
          fetch(`${API_URL}/api/maintenance?carId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/mods?carId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (mainRes.ok) setMaintenance(await mainRes.json());
        if (modRes.ok) setMods(await modRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading car details...</div>;
  if (!car) return <div>Car not found</div>;

  return (
    <div className="car-detail-container">
      <div className="car-header">
        <div className="car-image">
          {car.thumbnailUrl ? (
            <img src={car.thumbnailUrl} alt={`${car.year} ${car.make} ${car.model}`} />
          ) : (
            <div className="placeholder-image">📷</div>
          )}
        </div>
        <div className="car-info">
          <h1>
            {car.year} {car.make} {car.model}
          </h1>
          {car.engine && <p className="car-engine">{car.engine}</p>}
          {car.trim && <p className="car-trim">{car.trim}</p>}
          {car.mileage > 0 && <p className="car-mileage">Mileage: {car.mileage} mi</p>}
          {car.goals?.length > 0 && (
            <div className="car-goals">
              {car.goals.map((goal) => (
                <span key={goal} className="goal-badge">
                  {goal}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link to={`/garage/${id}/timeline`} className="timeline-link">
        📈 View Full Timeline
      </Link>

      <div className="car-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "mods" ? "active" : ""}
          onClick={() => setActiveTab("mods")}
        >
          Mods ({mods.length})
        </button>
        <button
          className={activeTab === "maintenance" ? "active" : ""}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance ({maintenance.length})
        </button>
        <button
          className={activeTab === "ai" ? "active" : ""}
          onClick={() => setActiveTab("ai")}
        >
          AI Advisor
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="tab-panel">
            <h2>About</h2>
            <p>{car.notes || "No notes yet"}</p>

            {car.tags?.length > 0 && (
              <div className="car-tags">
                <h3>Tags</h3>
                {car.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "mods" && (
          <div className="tab-panel">
            <h2>Modifications</h2>
            {mods.length === 0 ? (
              <p>No mods logged yet</p>
            ) : (
              <div className="events-list">
                {mods.map((mod) => (
                  <div key={mod._id} className="event-card">
                    <h3>
                      {mod.brand} {mod.part}
                    </h3>
                    <p className="event-category">Category: {mod.category}</p>
                    <p className="event-date">{new Date(mod.date).toLocaleDateString()}</p>
                    <p>{mod.notes}</p>
                    <div className="event-meta">
                      {mod.mileage > 0 && <span>📍 {mod.mileage} mi</span>}
                      {mod.cost > 0 && <span>💰 £{mod.cost}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="tab-panel">
            <h2>Maintenance History</h2>
            {maintenance.length === 0 ? (
              <p>No maintenance logged yet</p>
            ) : (
              <div className="events-list">
                {maintenance.map((event) => (
                  <div key={event._id} className="event-card">
                    <h3>{event.type}</h3>
                    <p className="event-date">{new Date(event.date).toLocaleDateString()}</p>
                    <p>{event.notes}</p>
                    <div className="event-meta">
                      {event.mileage > 0 && <span>📍 {event.mileage} mi</span>}
                      {event.cost > 0 && <span>💰 £{event.cost}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "ai" && <AiAdvicePanel carId={id} car={car} />}
      </div>
    </div>
  );
}
