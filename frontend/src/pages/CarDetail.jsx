import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AiAdvicePanel from "../components/AiAdvicePanel";
import "../styles/garage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function CarDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [editData, setEditData] = useState({ mileage: 0, engine: "", trim: "", notes: "" });
  const [maintenance, setMaintenance] = useState([]);
  const [mods, setMods] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);

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
    fetchCarDetails();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const token = localStorage.getItem("modview_token");

      const carRes = await fetch(`${API_URL}/api/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let carData = null;

      if (carRes.status === 401) {
        localStorage.removeItem("modview_token");
        navigate("/auth", { replace: true });
        return;
      }

      if (carRes.ok) {
        carData = await carRes.json();
      } else if (carRes.status === 404) {
        const listRes = await fetch(`${API_URL}/api/cars`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (listRes.status === 401) {
          localStorage.removeItem("modview_token");
          navigate("/auth", { replace: true });
          return;
        }

        if (listRes.ok) {
          const cars = await listRes.json();
          carData = cars.find((item) => item._id === id) || null;
        }
      }

      if (!carData) {
        const errorPayload = await carRes.json().catch(() => ({}));
        setLoadError(errorPayload.message || "Car not found in current data source");
        setCar(null);
        return;
      }

      setCar(carData);
      setEditData({
        mileage: carData.mileage || 0,
        engine: carData.engine || "",
        trim: carData.trim || "",
        notes: carData.notes || "",
      });

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
      setLoadError("Network error loading car details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCarDetails = async (e) => {
    e.preventDefault();
    setSaveMessage("");
    setSaving(true);

    console.log("Saving car details to:", `${API_URL}/api/cars/${id}`);
    console.log("Payload:", editData);

    try {
      const token = localStorage.getItem("modview_token");
      console.log("Token present:", !!token);

      const res = await fetch(`${API_URL}/api/cars/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      console.log("Response status:", res.status);

      if (res.status === 401) {
        localStorage.removeItem("modview_token");
        navigate("/auth", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      console.log("Response data:", data);

      if (!res.ok) {
        setSaveMessage(data.message || "Could not save car details");
        console.error("Save failed:", data);
        return;
      }

      setCar(data);
      setSaveMessage("Saved ✓");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error("Network error:", err);
      console.error("Error message:", err.message);
      setSaveMessage(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
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

  const handleUploadCarPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setPhotoUploading(true);
      const token = localStorage.getItem("modview_token");
      const formData = new FormData();
      for (const file of files) formData.append("photos", file);

      const res = await fetch(`${API_URL}/api/cars/${id}/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        localStorage.removeItem("modview_token");
        navigate("/auth", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not upload photos");
        return;
      }

      setCar(data);
    } catch (err) {
      console.error("Error uploading car photos:", err);
      alert("Network error while uploading photos");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveCarPhoto = async (url) => {
    if (!url) return;

    try {
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/cars/${id}/photos`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      if (res.status === 401) {
        localStorage.removeItem("modview_token");
        navigate("/auth", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not remove photo");
        return;
      }

      setCar(data);
    } catch (err) {
      console.error("Error removing car photo:", err);
      alert("Network error while removing photo");
    }
  };

  if (loading) return <div className="loading">Loading car details...</div>;
  if (!car) return <div>{loadError || "Car not found"}</div>;

  return (
    <div className="car-detail-container">
      <div className="car-header">
        <div className="car-image">
          {car.thumbnailUrl || car.photoUrls?.[0] ? (
            <img src={car.thumbnailUrl || car.photoUrls?.[0]} alt={`${car.year} ${car.make} ${car.model}`} />
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

            <div className="car-photos-section">
              <div className="car-photos-head">
                <h3>Car Photos</h3>
                <label className="primary-btn car-photo-upload-btn">
                  {photoUploading ? "Uploading..." : "+ Upload Photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadCarPhotos}
                    disabled={photoUploading}
                    hidden
                  />
                </label>
              </div>

              {car.photoUrls?.length > 0 ? (
                <div className="car-photo-grid">
                  {car.photoUrls.map((url) => (
                    <div key={url} className="car-photo-item">
                      <img src={url} alt="car" />
                      <button type="button" onClick={() => handleRemoveCarPhoto(url)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="event-category">No photos uploaded yet.</p>
              )}
            </div>

            <form className="add-car-form" onSubmit={handleSaveCarDetails}>
              <input
                type="number"
                placeholder="Mileage"
                value={editData.mileage}
                onChange={(e) => setEditData({ ...editData, mileage: parseInt(e.target.value) || 0 })}
              />
              <input
                type="text"
                placeholder="Engine"
                value={editData.engine}
                onChange={(e) => setEditData({ ...editData, engine: e.target.value })}
              />
              <input
                type="text"
                placeholder="Trim"
                value={editData.trim}
                onChange={(e) => setEditData({ ...editData, trim: e.target.value })}
              />
              <input
                type="text"
                placeholder="Notes"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              />
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Car Details"}
              </button>
              {saveMessage && <p className="error">{saveMessage}</p>}
            </form>

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

            {showModForm ? (
              <form className="add-car-form" onSubmit={handleAddMod}>
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
                <button type="submit" disabled={modSaving}>
                  {modSaving ? "Adding..." : "Add Mod"}
                </button>
                <button type="button" onClick={() => setShowModForm(false)}>
                  Cancel
                </button>
              </form>
            ) : (
              <button className="primary-btn" onClick={() => setShowModForm(true)}>
                + Add Mod
              </button>
            )}

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

            {showMainForm ? (
              <form className="add-car-form" onSubmit={handleAddMaintenance}>
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
                <button type="submit" disabled={mainSaving}>
                  {mainSaving ? "Adding..." : "Add Maintenance"}
                </button>
                <button type="button" onClick={() => setShowMainForm(false)}>
                  Cancel
                </button>
              </form>
            ) : (
              <button className="primary-btn" onClick={() => setShowMainForm(true)}>
                + Add Maintenance
              </button>
            )}

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
