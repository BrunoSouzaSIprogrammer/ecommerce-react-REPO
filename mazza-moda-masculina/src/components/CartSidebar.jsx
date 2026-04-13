import { useState } from "react";
import { useCart } from "../context/CartContext";
import CheckoutModal from "./CheckoutModal";

export default function CartSidebar({ open, onClose }) {
  const { cart, total, clearCart, removeFromCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  function handleFinalizarCompra() {
    setCheckoutOpen(true);
  }

  function handleCheckoutClose() {
    setCheckoutOpen(false);
    onClose();
  }

  return (
    <>
      {/* overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            zIndex: 998
          }}
        />
      )}

      {/* sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: open ? "0" : "-400px",
          width: "350px",
          height: "100%",
          background: "var(--card)",
          color: "var(--text)",
          borderLeft: "1px solid var(--border)",
          padding: "20px",
          transition: "0.3s",
          zIndex: 999,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <h2>Carrinho</h2>

        {cart.length === 0 && <p>Carrinho vazio</p>}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {cart.map((item) => (
            <div key={item.id} style={{ marginBottom: "15px" }}>
              <h4>{item.nome}</h4>
              <p>R$ {item.preco}</p>

              <button onClick={() => removeFromCart(item.id)}>
                Remover
              </button>
            </div>
          ))}
        </div>

        <h3>Total: R$ {total}</h3>

        <button
          onClick={handleFinalizarCompra}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "var(--primary)",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "10px"
          }}
        >
          Finalizar compra
        </button>
      </div>

      <CheckoutModal open={checkoutOpen} onClose={handleCheckoutClose} />
    </>
  );
}