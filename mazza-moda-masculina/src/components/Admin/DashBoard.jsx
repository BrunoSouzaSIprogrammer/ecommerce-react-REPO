import { useEffect, useState } from "react";
import { getProdutosAdmin, getPedidos, getFinanceiro } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/admin.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalPedidos: 0,
    receitaTotal: 0,
    produtosBaixoEstoque: 0,
    semEstoque: 0,
    totalVendidos: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [produtos, pedidos] = await Promise.all([
        getProdutosAdmin(user.token),
        getPedidos(user.token).catch(() => []),
      ]);

      const produtosArray = Array.isArray(produtos) ? produtos : [];
      const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

      const baixoEstoque = produtosArray.filter(
        (p) => (p.estoque ?? 99) > 0 && (p.estoque ?? 99) <= 5
      ).length;
      const semEstoque = produtosArray.filter((p) => (p.estoque ?? 1) === 0).length;
      const totalVendidos = produtosArray.reduce((s, p) => s + (p.vendidos || 0), 0);

      const receitaTotal = pedidosArray.reduce((s, p) => s + (p.total || 0), 0);

      setStats({
        totalProdutos: produtosArray.length,
        totalPedidos: pedidosArray.length,
        receitaTotal,
        produtosBaixoEstoque: baixoEstoque,
        semEstoque,
        totalVendidos,
      });
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      icon: "💰",
      label: "Receita Total",
      value: `R$ ${stats.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      color: "#c9a227",
    },
    {
      icon: "📦",
      label: "Produtos",
      value: stats.totalProdutos.toString(),
      color: "#007bff",
    },
    {
      icon: "🧾",
      label: "Pedidos",
      value: stats.totalPedidos.toString(),
      color: "#28a745",
    },
    {
      icon: "🛒",
      label: "Unidades Vendidas",
      value: stats.totalVendidos.toString(),
      color: "#17a2b8",
    },
    {
      icon: "⚠️",
      label: "Baixo Estoque",
      value: stats.produtosBaixoEstoque.toString(),
      color: "#ffc107",
    },
    {
      icon: "🚫",
      label: "Sem Estoque (Ocultos)",
      value: stats.semEstoque.toString(),
      color: "#dc3545",
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {cards.map((card, index) => (
        <div key={index} className="dashboard-card">
          <div className="card-icon">{card.icon}</div>
          <div className="card-label">{card.label}</div>
          <div className="card-value" style={{ color: card.color }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
