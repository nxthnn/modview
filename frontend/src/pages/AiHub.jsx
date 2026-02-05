import { useState } from "react";

export default function AiHub() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");

  function run() {
    // TEMP placeholder — replace with backend/OpenAI later
    setResult(
      `Based on what you entered: "${idea}", I would recommend starting with maintenance basics and only then planning mods.`
    );
  }

  return (
    <div>
      <h1>AI Adviser</h1>

      <label style={{ display: "block", marginBottom: 8 }}>
        What’s your idea?
      </label>
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={run}>Get recommendation</button>
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          <h2>Recommendation</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
