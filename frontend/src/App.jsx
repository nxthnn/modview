import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Garage from "./pages/Garage";
import CarDetail from "./pages/CarDetail";
import AiHub from "./pages/AiHub";

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
