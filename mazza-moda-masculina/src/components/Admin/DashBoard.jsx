export default function Dashboard() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
      <div className="card">💰 R$ 12.500</div>
      <div className="card">📦 120 Produtos</div>
      <div className="card">🧾 45 Pedidos</div>
      <div className="card">👥 300 Usuários</div>
    </div>
  );
}