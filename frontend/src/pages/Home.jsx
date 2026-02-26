import { Link } from "react-router-dom";
import "../styles/layout.css";
import "../styles/components.css";
import "../styles/auth.css";


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
