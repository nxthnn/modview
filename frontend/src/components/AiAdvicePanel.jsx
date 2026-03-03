import { useState } from "react";
import "../styles/components.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AiAdvicePanel({ carId, car }) {
  const [question, setQuestion] = useState("");
  const [budget, setBudget] = useState("");
  const [goals, setGoals] = useState([]);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-advice-panel">
      <h2>🤖 AI Advisor</h2>
      <p>Ask about mods, maintenance, and upgrades tailored to your {car?.model}</p>

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
