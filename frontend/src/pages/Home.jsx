import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>Welcome to Modview</h1>
      <p>
        The home of car mod + maintenance tracking. Plan, track and view mods
        tailored to your vehicle.
      </p>

      <Link to="/auth">
        <button>Join / Sign up</button>
      </Link>
    </div>
  );
}
