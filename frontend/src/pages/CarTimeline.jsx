import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/garage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function CarTimeline() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [maintenance, setMaintenance] = useState([]);
  const [mods, setMods] = useState([]);
  const [planned, setPlanned] = useState([]);
  const [carData, setCarData] = useState(null);
  const [markingDoneId, setMarkingDoneId] = useState("");
  const [previewGeneratingId, setPreviewGeneratingId] = useState("");
  const [previewStatus, setPreviewStatus] = useState({
    enabled: false,
    hfConfigured: false,
    cloudinaryConfigured: false,
    model: "",
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Mod form state
  const [showModForm, setShowModForm] = useState(false);
  const [modForm, setModForm] = useState({
    category: "",
    brand: "",
    part: "",
    date: new Date().toISOString().split("T")[0],
    mileage: "",
    cost: "",
    notes: "",
  });
  const [modSaving, setModSaving] = useState(false);

  // Maintenance form state
  const [showMainForm, setShowMainForm] = useState(false);
  const [mainForm, setMainForm] = useState({
    type: "",
    date: new Date().toISOString().split("T")[0],
    mileage: "",
    cost: "",
    notes: "",
  });
  const [mainSaving, setMainSaving] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, [id]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("modview_token");

      const [mainRes, modRes, plansRes, carRes, previewStatusRes] = await Promise.all([
        fetch(`${API_URL}/api/maintenance?carId=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/mods?carId=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/plans?carId=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/cars/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/ai/preview-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (mainRes.ok) setMaintenance(await mainRes.json());
      if (modRes.ok) setMods(await modRes.json());
      if (plansRes.ok) setPlanned(await plansRes.json());
      if (carRes.ok) setCarData(await carRes.json());
      if (previewStatusRes.ok) setPreviewStatus(await previewStatusRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMod = async (e) => {
    e.preventDefault();
    setModSaving(true);

    try {
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/mods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carId: id,
          ...modForm,
          mileage: parseInt(modForm.mileage) || 0,
          cost: parseFloat(modForm.cost) || 0,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("modview_token");
        navigate("/auth", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Could not add mod");
        return;
      }

      setMods([data, ...mods]);
      setModForm({
        category: "",
        brand: "",
        part: "",
        date: new Date().toISOString().split("T")[0],
        mileage: "",
        cost: "",
        notes: "",
      });
      setShowModForm(false);
    } catch (err) {
      console.error("Error adding mod:", err);
      alert("Network error while adding mod");
    } finally {
      setModSaving(false);
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    setMainSaving(true);

    try {
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carId: id,
          ...mainForm,
          mileage: parseInt(mainForm.mileage) || 0,
          cost: parseFloat(mainForm.cost) || 0,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("modview_token");
        navigate("/auth", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Could not add maintenance");
        return;
      }

      setMaintenance([data, ...maintenance]);
      setMainForm({
        type: "",
        date: new Date().toISOString().split("T")[0],
        mileage: "",
        cost: "",
        notes: "",
      });
      setShowMainForm(false);
    } catch (err) {
      console.error("Error adding maintenance:", err);
      alert("Network error while adding maintenance");
    } finally {
      setMainSaving(false);
    }
  };

  const handleMarkPlannedDone = async (planId) => {
    if (!planId || markingDoneId) return;

    try {
      setMarkingDoneId(planId);
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/plans/${planId}/done`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Could not mark planned item as done");
        return;
      }

      setPlanned((prev) => prev.filter((item) => item._id !== planId));
    } catch (err) {
      console.error("Error marking planned item done:", err);
      alert("Network error while marking planned item as done");
    } finally {
      setMarkingDoneId("");
    }
  };

  const handleGeneratePreview = async (plan) => {
    if (!plan?._id || previewGeneratingId) return;

    try {
      setPreviewGeneratingId(plan._id);
      const token = localStorage.getItem("modview_token");
      const basePhotoUrl = carData?.photoUrls?.[0] || carData?.thumbnailUrl || "";

      const res = await fetch(`${API_URL}/api/ai/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan._id, basePhotoUrl }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not generate preview");
        return;
      }

      const updatedPlan = data.plan;
      if (updatedPlan?._id) {
        setPlanned((prev) => prev.map((item) => (item._id === updatedPlan._id ? updatedPlan : item)));
      }
    } catch (err) {
      console.error("Error generating preview:", err);
      alert("Network error while generating preview");
    } finally {
      setPreviewGeneratingId("");
    }
  };

  const timeline = [
    ...maintenance.map((m) => ({ ...m, kind: "maintenance" })),
    ...mods.map((m) => ({ ...m, kind: "mod" })),
    ...planned.map((p) => ({ ...p, kind: "planned" })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredTimeline =
    activeTab === "all" ? timeline : timeline.filter((item) => item.kind === activeTab);

  if (loading) return <div className="loading">Loading timeline...</div>;

  return (
    <div className="timeline-container">
      <h1>Car Timeline</h1>

      <p className={`preview-status ${previewStatus.enabled ? "ready" : "not-ready"}`}>
        {previewStatus.enabled
          ? `AI Preview ready (${previewStatus.model})`
          : "AI Preview not configured. Add HF and Cloudinary keys in backend env."}
      </p>

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
        <button
          className={activeTab === "planned" ? "active" : ""}
          onClick={() => setActiveTab("planned")}
        >
          To Be Added ({planned.length})
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          className="primary-btn"
          onClick={() => setShowModForm(!showModForm)}
          style={{ flex: 1 }}
        >
          {showModForm ? "Cancel Mod" : "+ Add Mod"}
        </button>
        <button
          className="primary-btn"
          onClick={() => setShowMainForm(!showMainForm)}
          style={{ flex: 1 }}
        >
          {showMainForm ? "Cancel Maintenance" : "+ Add Maintenance"}
        </button>
      </div>

      {showModForm && (
        <form className="add-car-form" style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Category (e.g., suspension, wheels, engine)"
            value={modForm.category}
            onChange={(e) => setModForm({ ...modForm, category: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Brand"
            value={modForm.brand}
            onChange={(e) => setModForm({ ...modForm, brand: e.target.value })}
          />
          <input
            type="text"
            placeholder="Part (e.g., Coilovers)"
            value={modForm.part}
            onChange={(e) => setModForm({ ...modForm, part: e.target.value })}
            required
          />
          <input
            type="date"
            value={modForm.date}
            onChange={(e) => setModForm({ ...modForm, date: e.target.value })}
          />
          <input
            type="number"
            placeholder="Mileage at install (optional)"
            value={modForm.mileage}
            onChange={(e) =>
              setModForm({
                ...modForm,
                mileage: e.target.value === "" ? "" : parseInt(e.target.value) || "",
              })
            }
          />
          <input
            type="number"
            placeholder="Cost in £ (optional)"
            value={modForm.cost}
            onChange={(e) =>
              setModForm({
                ...modForm,
                cost: e.target.value === "" ? "" : parseFloat(e.target.value) || "",
              })
            }
            step="0.01"
          />
          <input
            type="text"
            placeholder="Notes"
            value={modForm.notes}
            onChange={(e) => setModForm({ ...modForm, notes: e.target.value })}
          />
          <button type="submit" onClick={handleAddMod} disabled={modSaving}>
            {modSaving ? "Adding..." : "Add Mod"}
          </button>
        </form>
      )}

      {showMainForm && (
        <form className="add-car-form" style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Type (e.g., oil change, brake inspection)"
            value={mainForm.type}
            onChange={(e) => setMainForm({ ...mainForm, type: e.target.value })}
            required
          />
          <input
            type="date"
            value={mainForm.date}
            onChange={(e) => setMainForm({ ...mainForm, date: e.target.value })}
          />
          <input
            type="number"
            placeholder="Mileage at service (optional)"
            value={mainForm.mileage}
            onChange={(e) =>
              setMainForm({
                ...mainForm,
                mileage: e.target.value === "" ? "" : parseInt(e.target.value) || "",
              })
            }
          />
          <input
            type="number"
            placeholder="Cost in £ (optional)"
            value={mainForm.cost}
            onChange={(e) =>
              setMainForm({
                ...mainForm,
                cost: e.target.value === "" ? "" : parseFloat(e.target.value) || "",
              })
            }
            step="0.01"
          />
          <input
            type="text"
            placeholder="Notes"
            value={mainForm.notes}
            onChange={(e) => setMainForm({ ...mainForm, notes: e.target.value })}
          />
          <button type="submit" onClick={handleAddMaintenance} disabled={mainSaving}>
            {mainSaving ? "Adding..." : "Add Maintenance"}
          </button>
        </form>
      )}

      <div className="timeline">
        {filteredTimeline.length === 0 ? (
          <p>No events yet. Add maintenance, mods, or AI planned items to track your car's history.</p>
        ) : (
          filteredTimeline.map((item) => (
            <div key={item._id} className={`timeline-item timeline-${item.kind}`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <h3>
                    {item.kind === "maintenance"
                      ? item.type
                      : item.kind === "mod"
                      ? `${item.brand} ${item.part}`
                      : item.title}
                  </h3>
                  <span className="timeline-date">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                {item.kind === "planned" && <p className="timeline-badge">To Be Added</p>}
                <p>{item.kind === "planned" ? item.why || "Planned from AI recommendation" : item.notes || "No notes"}</p>
                <div className="timeline-meta">
                  {item.mileage > 0 && <span>📍 {item.mileage} mi</span>}
                  {item.cost > 0 && <span>💰 £{item.cost}</span>}
                  {item.kind === "planned" && item.priority && <span>⭐ Priority {item.priority}</span>}
                  {item.kind === "planned" && item.estCost && <span>💰 {item.estCost}</span>}
                  {item.kind === "planned" && item.when && <span>🗓️ {item.when}</span>}
                </div>
                {item.kind === "planned" && item.requires?.length > 0 && (
                  <p className="event-category">Requires: {item.requires.join(", ")}</p>
                )}
                {item.kind === "planned" && item.risks && (
                  <p className="event-category">Risks: {item.risks}</p>
                )}
                {item.kind === "planned" && item.itemType === "mod" && (
                  <button
                    type="button"
                    className="planned-preview-btn"
                    onClick={() => handleGeneratePreview(item)}
                    disabled={previewGeneratingId === item._id || !previewStatus.enabled}
                  >
                    {previewGeneratingId === item._id ? "Generating Preview..." : "Generate AI Preview"}
                  </button>
                )}
                {item.kind === "planned" && item.previewUrl && (
                  <div className="planned-preview-wrap">
                    <p className="event-category">{item.previewMessage || "AI visual preview"}</p>
                    <img className="planned-preview-image" src={item.previewUrl} alt="AI mod preview" />
                  </div>
                )}
                {item.kind === "planned" && (
                  <button
                    type="button"
                    className="planned-done-btn"
                    onClick={() => handleMarkPlannedDone(item._id)}
                    disabled={markingDoneId === item._id}
                  >
                    {markingDoneId === item._id ? "Marking..." : "Mark as Done"}
                  </button>
                )}
                {item.kind === "maintenance" && item.receiptUrls?.length > 0 && (
                  <div className="timeline-receipts">
                    {item.receiptUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        📄 Receipt {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
                {item.kind === "mod" && item.photoUrls?.length > 0 && (
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
