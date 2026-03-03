import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/layout.css";
import "../styles/components.css";
import "../styles/auth.css";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("modview_token");
    if (token) {
      navigate("/feed");
    }
  }, [navigate]);

  return (
    <div className="home-page">
      <div className="hero">
        <h1>Welcome to Modview</h1>
        <p className="tagline">Share your car mods & maintenance with the community</p>
        <p className="description">
          Track your modifications, maintenance events, and get AI-powered advice tailored to your vehicle.
          Connect with other car enthusiasts and share your build journey.
        </p>

        <Link to="/auth" className="cta-button">
          Join / Sign Up
        </Link>
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>🚗 Car Tracking</h3>
            <p>Track all your cars and their modification timelines in one place</p>
          </div>
          <div className="feature-card">
            <h3>📱 Social Feed</h3>
            <p>Share your builds, follow enthusiasts, and discover new ideas</p>
          </div>
          <div className="feature-card">
            <h3>🤖 AI Advisor</h3>
            <p>Get personalized advice on mods and maintenance based on your vehicle's history</p>
          </div>
          <div className="feature-card">
            <h3>📊 Timeline</h3>
            <p>View your car's complete modification and maintenance history</p>
          </div>
        </div>
      </div>
    </div>
  );
}
