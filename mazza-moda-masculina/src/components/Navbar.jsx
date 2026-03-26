import { useState } from "react";
import useTheme from "../hooks/useTheme";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartSidebar from "./CartSidebar";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { cart } = useCart();
  const [open, setOpen] = useState(false);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "var(--card)",
        borderBottom: "1px solid var(--border)"
      }}>
        <h1 style={{ color: "var(--primary)", fontWeight: "bold" }}>
          MAZZA
        </h1>

        <input
          placeholder="Buscar produtos..."
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            width: "300px"
          }}
        />

        {/* 🛒 CARRINHO CORRIGIDO */}
        <div
          id="cart-icon"
          onClick={() => setOpen(true)}
          style={{ position: "relative", cursor: "pointer" }}
        >
          🛒

          {totalItems > 0 && (
            <span style={{
              position: "absolute",
              top: "-8px",
              right: "-10px",
              background: "red",
              color: "#fff",
              borderRadius: "50%",
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              {totalItems}
            </span>
          )}
        </div>

        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          🌙
        </button>

        <button
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/login");
          }}
        >
          Sair
        </button>
      </nav>

      <CartSidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}