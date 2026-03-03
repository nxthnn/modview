import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Garage from "./pages/Garage";
import CarDetail from "./pages/CarDetail";
import CarTimeline from "./pages/CarTimeline";
import AiHub from "./pages/AiHub";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";

import "./styles/layout.css";
import "./styles/components.css";



export default function App() {
  return (
    <>
      <Navbar />
      <main className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />

          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route path="/explore" element={<Explore />} />
          <Route path="/profile/:id" element={<Profile />} />

          <Route
            path="/garage"
            element={
              <ProtectedRoute>
                <Garage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/:id"
            element={
              <ProtectedRoute>
                <CarDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage/:id/timeline"
            element={
              <ProtectedRoute>
                <CarTimeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <AiHub />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}
