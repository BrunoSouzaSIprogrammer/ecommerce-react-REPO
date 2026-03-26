import Dashboard from "../components/Admin/DashBoard";

export default function Admin() {
  return (
    <div style={{ display: "flex" }}>
      
      {/* SIDEBAR */}
      <div style={{
        width: "250px",
        background: "var(--card)",
        padding: "20px"
      }}>
        <h2>MAZZA ADMIN</h2>

        <p>Dashboard</p>
        <p>Produtos</p>
        <p>Usuários</p>
        <p>Pedidos</p>
        <p>Financeiro</p>
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, padding: "30px" }}>
        <h1>Painel</h1>

        {/* 👉 AQUI ENTRA O DASHBOARD */}
        <Dashboard />

      </div>

    </div>
  );
}