import { Link } from "react-router-dom";

export default function Garage() {
  // TEMP demo data — later you’ll fetch from backend
  const cars = [
    { id: "mini-2011", name: "Mini Cooper S 2011" },
    { id: "micra-2008", name: "Nissan Micra 2008" },
  ];

  return (
    <div>
      <h1>My Garage</h1>

      <ul>
        {cars.map((c) => (
          <li key={c.id}>
            <Link to={`/cars/${c.id}`}>{c.name}</Link>
          </li>
        ))}
      </ul>

      <button style={{ marginTop: 12 }}>+ New Car</button>
    </div>
  );
}
