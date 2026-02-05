import { Link, useParams } from "react-router-dom";

export default function CarDetail() {
  const { carId } = useParams();

  return (
    <div>
      <h1>Vehicle: {carId}</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button>Mod list</button>
        <button>Maintenance</button>
        <button>Notes / ideas</button>
        <Link to="/ai">
          <button>AI adviser</button>
        </Link>
      </div>

      <div style={{ marginTop: 18 }}>
        <h2>Photos</h2>
        <p>(front / back / driver side / passenger side placeholders)</p>
      </div>
    </div>
  );
}
