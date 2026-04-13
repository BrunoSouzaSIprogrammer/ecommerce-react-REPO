import { useEffect, useState } from "react";
import { getProdutos, getPedidos, getFinanceiro } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/admin.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalPedidos: 0,
    receitaTotal: 0,
    produtosBaixoEstoque: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const produtos = await getProdutos();
      const produtosArray = Array.isArray(produtos) ? produtos : [];

      const baixoEstoque = produtosArray.filter(p => (p.estoque || 0) <= 5).length;

      setStats({
        totalProdutos: produtosArray.length,
        totalPedidos: Math.floor(Math.random() * 50), // Placeholder até ter API real
        receitaTotal: produtosArray.reduce((acc, p) => acc + (p.preco || 0), 0),
        produtosBaixoEstoque: baixoEstoque
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
      value: `R$ ${stats.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: "#c9a227"
    },
    {
      icon: "📦",
      label: "Produtos",
      value: stats.totalProdutos.toString(),
      color: "#007bff"
    },
    {
      icon: "🧾",
      label: "Pedidos",
      value: stats.totalPedidos.toString(),
      color: "#28a745"
    },
    {
      icon: "⚠️",
      label: "Baixo Estoque",
      value: stats.produtosBaixoEstoque.toString(),
      color: "#ffc107"
    }
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
