import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartSidebar from "./CartSidebar";
import "../styles/navbar.css";

export default function Navbar({ onThemeToggle, theme }) {
  const { cart } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h1 className="brand-logo">MAZZA</h1>
        </div>

        <div className="navbar-actions">
          {isAdmin && (
            <button className="nav-admin-btn" onClick={() => navigate('/admin')}>
              <span className="btn-icon">📊</span>
              <span>Admin</span>
            </button>
          )}

          <div
            className="cart-icon-wrapper"
            onClick={() => setOpen(true)}
          >
            <span className="cart-icon">🛒</span>
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </div>

          <button className="theme-btn" onClick={onThemeToggle}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      <CartSidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}
