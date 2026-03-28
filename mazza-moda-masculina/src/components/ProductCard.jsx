import { useCart } from "../context/CartContext";
import { useState } from "react";
import Toast from "./Toast";
import { animateToCart } from "../utils/animateToCart";

export default function ProductCard({ produto }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);

  function handleAdd(e) {
    animateToCart(e); // 💥 animação

    addToCart(produto);
    showToast("Produto adicionado ao carrinho");

    setAdded(true);
    setShowToast(true);

    setTimeout(() => setAdded(false), 2000);
    setTimeout(() => setShowToast(false), 2000);
  }

  return (
    <>
      <div style={{
        background: "var(--card)",
        borderRadius: "16px",
        padding: "15px",
        border: "1px solid var(--border)"
      }}>
        <img
          src={produto.imagem 
            ? `http://localhost:5000/uploads/${produto.imagem}`
            : "https://picsum.photos/300"}
          alt={produto.nome}
          style={{ width: "100%", borderRadius: "10px" }}
        />

        <h3>{produto.nome}</h3>

        <p style={{ color: "var(--primary)", fontWeight: "bold" }}>
          R$ {produto.preco}
        </p>

        <button
          onClick={handleAdd}
          style={{
            marginTop: "10px",
            padding: "10px",
            border: "none",
            borderRadius: "8px",
            background: added ? "#4CAF50" : "var(--primary)",
            color: "#000",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "0.3s"
          }}
        >
          {added ? "✔ Adicionado" : "Comprar"}
        </button>
      </div>

      <Toast
        message="Produto adicionado ao carrinho"
        show={showToast}
      />
    </>
  );
}