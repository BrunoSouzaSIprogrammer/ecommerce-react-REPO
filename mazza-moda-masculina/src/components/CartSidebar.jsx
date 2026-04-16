import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CartSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { cart, subtotal, removeFromCart, updateQuantity } = useCart();

  function handleVerCarrinho() {
    onClose();
    navigate("/carrinho");
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
            zIndex: 998,
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
          maxWidth: "100%",
          height: "100%",
          background: "var(--card)",
          color: "var(--text)",
          borderLeft: "1px solid var(--border)",
          padding: "20px",
          transition: "0.3s",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Carrinho</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text)",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {cart.length === 0 && (
          <p style={{ opacity: 0.7 }}>Seu carrinho está vazio.</p>
        )}

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {cart.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 10,
                display: "flex",
                gap: 10,
              }}
            >
              {(item.imagem || item.image) && (
                <img
                  src={item.imagem || item.image}
                  alt={item.nome}
                  style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.nome}</div>
                {item.tamanho && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Tam: {item.tamanho}</div>
                )}
                <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>
                  {formatBRL(item.preco)}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                    style={qtdBtn}
                  >
                    −
                  </button>
                  <span style={{ fontSize: 13, minWidth: 18, textAlign: "center" }}>
                    {item.quantity || 1}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                    style={qtdBtn}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      marginLeft: "auto",
                      background: "transparent",
                      border: "none",
                      color: "#e53935",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 14,
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <span>Subtotal</span>
          <strong>{formatBRL(subtotal)}</strong>
        </div>

        <button
          onClick={handleVerCarrinho}
          disabled={cart.length === 0}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: "var(--primary)",
            color: "#000",
            fontWeight: 700,
            cursor: cart.length === 0 ? "not-allowed" : "pointer",
            opacity: cart.length === 0 ? 0.5 : 1,
          }}
        >
          Ver carrinho e finalizar
        </button>
      </div>
    </>
  );
}

const qtdBtn = {
  width: 24,
  height: 24,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  borderRadius: 4,
  fontSize: 14,
  cursor: "pointer",
  lineHeight: 1,
};
