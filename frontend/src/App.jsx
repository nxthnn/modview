import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Garage from "./pages/Garage.jsx";
import CarDetail from "./pages/CarDetail.jsx";
import AiHub from "./pages/AiHub.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />

          <Route
            path="/garage"
            element={
              <ProtectedRoute>
                <Garage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cars/:carId"
            element={
              <ProtectedRoute>
                <CarDetail />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
