import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Garage() {
  const [cars, setCars] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("modview_token");

    async function load() {
      try {
        const res = await fetch(`${base}/api/cars`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load cars");
        setCars(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h1>My Garage</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <ul>
        {cars.map((c) => (
          <li key={c._id}>
            <Link to={`/cars/${c._id}`}>
              {c.year} {c.make} {c.model}
            </Link>
          </li>
        ))}
      </ul>

      <p style={{ opacity: 0.7, marginTop: 12 }}>
        (Next: add “New Car” form + delete.)
      </p>
    </div>
  );
}
