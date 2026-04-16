import { useEffect, useState } from "react";
import "../styles/components.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AiAdvicePanel({ carId, car }) {
  const [question, setQuestion] = useState("");
  const [budget, setBudget] = useState("");
  const [goals, setGoals] = useState([]);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingMap, setAddingMap] = useState({});
  const [savingPreviewMap, setSavingPreviewMap] = useState({});
  const [addedMap, setAddedMap] = useState({});
  const [addedPlanMap, setAddedPlanMap] = useState({});
  const [directPreviewMap, setDirectPreviewMap] = useState({});
  const [generatingPreviewMap, setGeneratingPreviewMap] = useState({});
  const [previewStatus, setPreviewStatus] = useState({
    enabled: false,
    hfConfigured: false,
    cloudinaryConfigured: false,
    model: "",
  });

  useEffect(() => {
    const fetchPreviewStatus = async () => {
      try {
        const token = localStorage.getItem("modview_token");
        const res = await fetch(`${API_URL}/api/ai/preview-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPreviewStatus(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPreviewStatus();
  }, []);

  const handleGoalToggle = (goal) => {
    setGoals(goals.includes(goal) ? goals.filter((g) => g !== goal) : [...goals, goal]);
  };

  const handleGetAdvice = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/ai/advice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carId,
          question,
          budget: budget ? parseInt(budget) : null,
          goals,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdvice(data);
        setAddedMap({});
        setAddedPlanMap({});
        setDirectPreviewMap({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTimeline = async (itemType, item, idx) => {
    const key = `${itemType}-${idx}`;
    if (addingMap[key] || addedMap[key]) return;

    const directPreview = directPreviewMap[key];

    try {
      setAddingMap((prev) => ({ ...prev, [key]: true }));
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carId,
          itemType,
          title: item.title,
          priority: item.priority,
          why: item.why || "",
          when: item.when || "",
          estCost: item.est_cost || "",
          requires: item.requires || [],
          risks: item.risks || "",
          source: "ai",
          previewUrl: directPreview?.previewUrl || "",
          previewMessage: directPreview?.previewMessage || "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Could not add recommendation to timeline");
        return;
      }

      setAddedMap((prev) => ({ ...prev, [key]: true }));
      if (data?._id) {
        setAddedPlanMap((prev) => ({ ...prev, [key]: data }));
      }
    } catch (err) {
      console.error(err);
      alert("Network error while adding recommendation to timeline");
    } finally {
      setAddingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveDirectPreviewToTimeline = async (item, idx) => {
    const key = `mod-${idx}`;
    if (savingPreviewMap[key] || addedMap[key]) return;

    try {
      setSavingPreviewMap((prev) => ({ ...prev, [key]: true }));
      await handleAddToTimeline("mod", item, idx);
    } finally {
      setSavingPreviewMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleGeneratePreview = async (key, item) => {
    const plan = addedPlanMap[key];
    if (generatingPreviewMap[key]) return;

    try {
      setGeneratingPreviewMap((prev) => ({ ...prev, [key]: true }));
      const token = localStorage.getItem("modview_token");
      const basePhotoUrl = car?.photoUrls?.[0] || car?.thumbnailUrl || "";

      if (!previewStatus.enabled) {
        alert("Visual previews are not configured yet.");
        return;
      }

      if (plan?._id) {
        const res = await fetch(`${API_URL}/api/ai/preview`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planId: plan._id,
            basePhotoUrl,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.message || "Could not generate preview");
          return;
        }

        if (data?.plan?._id) {
          setAddedPlanMap((prev) => ({ ...prev, [key]: data.plan }));
        }
        return;
      }

      const res = await fetch(`${API_URL}/api/ai/preview-direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carId,
          mod: {
            title: item?.title || "",
            why: item?.why || "",
            requires: item?.requires || [],
            risks: item?.risks || "",
          },
          basePhotoUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Could not generate preview");
        return;
      }

      setDirectPreviewMap((prev) => ({
        ...prev,
        [key]: {
          previewUrl: data.previewUrl || "",
          previewMessage: data.previewMessage || "AI visual preview",
        },
      }));
    } catch (err) {
      console.error(err);
      alert("Network error while generating preview");
    } finally {
      setGeneratingPreviewMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="ai-advice-panel">
      <h2>🤖 AI Advisor</h2>
      <p>Ask about mods, maintenance, and upgrades tailored to your {car?.model}</p>
      <p className="ai-context-note">
        AI now considers your completed timeline items and uploaded car photos when generating advice.
      </p>
      <p className={`ai-preview-status ${previewStatus.enabled ? "ready" : "not-ready"}`}>
        {previewStatus.enabled
          ? `Visual previews enabled (${previewStatus.model})`
          : "Visual previews not configured (set HF and Cloudinary keys)."}
      </p>

      <div className="ai-form">
        <textarea
          placeholder="What would you like advice on? (e.g., Best performance upgrades under £500, Brake maintenance schedule)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
        />

        <div className="form-group">
          <label>Goals (optional):</label>
          <div className="goals-toggle">
            {["comfort", "performance", "show", "track"].map((goal) => (
              <label key={goal} className="goal-label">
                <input
                  type="checkbox"
                  checked={goals.includes(goal)}
                  onChange={() => handleGoalToggle(goal)}
                />
                {goal.charAt(0).toUpperCase() + goal.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Budget (£, optional):</label>
          <input
            type="number"
            placeholder="e.g., 500"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        <button onClick={handleGetAdvice} disabled={loading || !question.trim()}>
          {loading ? "Thinking..." : "Get Advice"}
        </button>

        <div className="ai-preview-hint-box">
          <strong>AI image preview</strong>
          <p>
            Generate advice first. Preview buttons will appear on each mod recommendation after the
            response loads.
          </p>
          <button type="button" className="advice-preview-btn" disabled>
            Generate Preview
          </button>
        </div>
      </div>

      {advice && (
        <div className="ai-response">
          <div className="advice-summary">
            <h3>Summary</h3>
            <p>{advice.summary}</p>
          </div>

          {advice.maintenance && advice.maintenance.length > 0 && (
            <div className="advice-section">
              <h3>🔧 Maintenance</h3>
              <div className="advice-list">
                {advice.maintenance.map((item, idx) => (
                  <div key={idx} className="advice-item">
                    <div className="item-header">
                      <h4>{item.title}</h4>
                      <span className={`priority priority-${item.priority}`}>
                        Priority {item.priority}
                      </span>
                    </div>
                    <p><strong>Why:</strong> {item.why}</p>
                    <p><strong>When:</strong> {item.when}</p>
                    <p><strong>Cost:</strong> {item.est_cost}</p>
                    <button
                      type="button"
                      className="advice-add-btn"
                      onClick={() => handleAddToTimeline("maintenance", item, idx)}
                      disabled={!!addingMap[`maintenance-${idx}`] || !!addedMap[`maintenance-${idx}`]}
                    >
                      {addedMap[`maintenance-${idx}`]
                        ? "Added to Timeline"
                        : addingMap[`maintenance-${idx}`]
                        ? "Adding..."
                        : "Add to Timeline"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {advice.mods && advice.mods.length > 0 && (
            <div className="advice-section">
              <h3>⚙️ Mods</h3>
              <div className="advice-list">
                {advice.mods.map((item, idx) => (
                  <div key={idx} className="advice-item">
                    {(() => {
                      const key = `mod-${idx}`;
                      const plan = addedPlanMap[key];
                      const directPreview = directPreviewMap[key];
                      return (
                        <>
                    <div className="item-header">
                      <h4>{item.title}</h4>
                      <span className={`priority priority-${item.priority}`}>
                        Priority {item.priority}
                      </span>
                    </div>
                    <p><strong>Why:</strong> {item.why}</p>
                    <p><strong>Cost:</strong> {item.est_cost}</p>
                    {item.risks && <p><strong>Risks:</strong> {item.risks}</p>}
                    {item.requires?.length > 0 && (
                      <p><strong>Requires:</strong> {item.requires.join(", ")}</p>
                    )}
                    <button
                      type="button"
                      className="advice-add-btn"
                      onClick={() => handleAddToTimeline("mod", item, idx)}
                      disabled={!!addingMap[key] || !!addedMap[key]}
                    >
                      {addedMap[key]
                        ? "Added to Timeline"
                        : addingMap[key]
                        ? "Adding..."
                        : "Add to Timeline"}
                    </button>
                    <button
                      type="button"
                      className="advice-preview-btn"
                      onClick={() => handleGeneratePreview(key, item)}
                      disabled={!previewStatus.enabled || !!generatingPreviewMap[key]}
                      title="Generate AI preview"
                    >
                      {generatingPreviewMap[key] ? "Generating Preview..." : "Generate Preview"}
                    </button>
                    {!plan?._id && (
                      <p className="ai-context-note">Preview is generated directly from this recommendation.</p>
                    )}
                    {plan?.previewUrl && (
                      <div className="advice-preview-wrap">
                        <p className="ai-context-note">{plan.previewMessage || "AI visual preview"}</p>
                        <img className="advice-preview-image" src={plan.previewUrl} alt="AI preview" />
                      </div>
                    )}
                    {!plan?.previewUrl && directPreview?.previewUrl && (
                      <div className="advice-preview-wrap">
                        <p className="ai-context-note">{directPreview.previewMessage}</p>
                        <img className="advice-preview-image" src={directPreview.previewUrl} alt="AI preview" />
                        <button
                          type="button"
                          className="advice-add-btn"
                          onClick={() => handleSaveDirectPreviewToTimeline(item, idx)}
                          disabled={!!savingPreviewMap[key] || !!addedMap[key]}
                        >
                          {addedMap[key]
                            ? "Saved to Timeline"
                            : savingPreviewMap[key]
                            ? "Saving..."
                            : "Save This Preview to Timeline"}
                        </button>
                      </div>
                    )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {advice.checks && advice.checks.length > 0 && (
            <div className="advice-section">
              <h3>❓ Questions to Consider</h3>
              <ul>
                {advice.checks.map((check, idx) => (
                  <li key={idx}>{check}</li>
                ))}
              </ul>
            </div>
          )}

          {advice.disclaimer && (
            <div className="advice-disclaimer">
              <em>⚠️ {advice.disclaimer}</em>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
