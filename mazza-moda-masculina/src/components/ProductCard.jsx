export default function ProductCard({ produto }) {
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "16px",
        padding: "15px",
        transition: "0.3s",
        cursor: "pointer",
        border: "1px solid var(--border)"
      }}
    >
      <button style={{
        marginTop: "10px",
        padding: "10px",
        border: "none",
        borderRadius: "8px",
        background: "var(--primary)",
        color: "#000",
        fontWeight: "bold",
        cursor: "pointer"
      }}>
        Comprar
      </button>
      
      <img
        src={produto.imagem 
              ? `http://localhost:5000/uploads/${produto.imagem}`
              : "https://via.placeholder.com/300"}
        alt=""
        style={{ width: "100%", borderRadius: "10px" }}
      />

      <h3>{produto.nome}</h3>

      <p style={{ color: "var(--primary)", fontWeight: "bold" }}>
        R$ {produto.preco}
      </p>
    </div>
  );
}