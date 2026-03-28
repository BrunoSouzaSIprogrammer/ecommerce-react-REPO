import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import { useState, useEffect } from "react";
import { useCart } from "./context/CartContext";
import Toast from "./components/Toast";
import Register from "./pages/Register";

function App() {
  const { toast } = useCart();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setUser(JSON.parse(localStorage.getItem("user")));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/register" element={<Register />} />

        <Route path="/login" element={<Login />} />
        {/* 👉 se não estiver logado, força login */}
        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/login" />}
        />

        <Route
          path="/admin"
          element={user ? <Admin /> : <Navigate to="/login" />}
        />
        
      </Routes>
      <Toast
        message={toast.message}
        show={toast.show}
        onClose={() => {}}
      />
    </BrowserRouter>
  );
}

export default App;