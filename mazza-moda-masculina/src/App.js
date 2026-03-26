import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import { useState, useEffect } from "react";

function App() {
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
    </BrowserRouter>
  );
}

export default App;