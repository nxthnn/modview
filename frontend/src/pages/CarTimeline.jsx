import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/garage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function CarTimeline() {
  const { id } = useParams();
  const [maintenance, setMaintenance] = useState([]);
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchTimeline();
  }, [id]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("modview_token");

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const timeline = [
    ...maintenance.map((m) => ({ ...m, type: "maintenance" })),
    ...mods.map((m) => ({ ...m, type: "mod" })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredTimeline =
    activeTab === "all" ? timeline : timeline.filter((item) => item.type === activeTab);

  if (loading) return <div className="loading">Loading timeline...</div>;

  return (
    <div className="timeline-container">
      <h1>Car Timeline</h1>

      <div className="timeline-tabs">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All Events ({timeline.length})
        </button>
        <button
          className={activeTab === "maintenance" ? "active" : ""}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance ({maintenance.length})
        </button>
        <button className={activeTab === "mod" ? "active" : ""} onClick={() => setActiveTab("mod")}>
          Mods ({mods.length})
        </button>
      </div>

      <div className="timeline">
        {filteredTimeline.length === 0 ? (
          <p>No events yet. Add maintenance or mods to track your car's history.</p>
        ) : (
          filteredTimeline.map((item) => (
            <div key={item._id} className={`timeline-item timeline-${item.type}`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <h3>{item.type === "maintenance" ? item.type : `${item.brand} ${item.part}`}</h3>
                  <span className="timeline-date">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <p>{item.notes || "No notes"}</p>
                <div className="timeline-meta">
                  {item.mileage > 0 && <span>📍 {item.mileage} mi</span>}
                  {item.cost > 0 && <span>💰 £{item.cost}</span>}
                </div>
                {item.type === "maintenance" && item.receiptUrls?.length > 0 && (
                  <div className="timeline-receipts">
                    {item.receiptUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        📄 Receipt {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
                {item.type === "mod" && item.photoUrls?.length > 0 && (
                  <div className="timeline-photos">
                    {item.photoUrls.slice(0, 3).map((url, idx) => (
                      <img key={idx} src={url} alt="mod photo" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
