import { useEffect, useMemo, useState } from "react";
import { getFinanceiro } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/admin-financeiro.css";

const STATUS_LABELS = {
  aguardando_pagamento: "Aguardando Pagamento",
  processando: "Processando",
  pago: "Pago",
  em_producao: "Em Produção",
  enviado: "Enviado",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function Financeiro() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    let cancelado = false;
    (async () => {
      try {
        setLoading(true);
        setErro(null);
        const res = await getFinanceiro(user.token, periodo);
        if (!cancelado) {
          if (res?.erro) setErro(res.erro);
          else setData(res);
        }
      } catch (e) {
        if (!cancelado) setErro("Não foi possível carregar os dados financeiros.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, [user?.token, periodo]);

  const maxVendaDia = useMemo(() => {
    if (!data?.vendasPorDia?.length) return 0;
    return Math.max(...data.vendasPorDia.map((d) => d.total));
  }, [data]);

  if (loading) {
    return (
      <div className="fin-loading">
        <div className="fin-spinner" />
        <p>Carregando dados financeiros...</p>
      </div>
    );
  }

  if (erro) {
    return <div className="fin-erro">⚠ {erro}</div>;
  }

  if (!data) return null;

  return (
    <div className="financeiro">
      <div className="fin-header">
        <div>
          <h3>Resumo Financeiro</h3>
          <p className="fin-sub">
            Comissão admin: {data.comissaoPercentual}% por venda aprovada (seller MAZZA recebe {100 - data.comissaoPercentual}%)
          </p>
        </div>
        <div className="fin-periodo">
          {["7d", "30d", "90d", "all"].map((p) => (
            <button
              key={p}
              className={`fin-per-btn ${periodo === p ? "active" : ""}`}
              onClick={() => setPeriodo(p)}
            >
              {p === "all" ? "Tudo" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="fin-kpis">
        <div className="fin-card fin-card-primary">
          <span className="fin-card-label">Faturamento</span>
          <strong className="fin-card-value">{formatBRL(data.totalVendas)}</strong>
          <span className="fin-card-hint">{data.totalPedidos} pedido(s) pagos</span>
        </div>
        <div className="fin-card">
          <span className="fin-card-label">Ticket médio</span>
          <strong className="fin-card-value">{formatBRL(data.ticketMedio)}</strong>
        </div>
        <div className="fin-card">
          <span className="fin-card-label">Líquido MAZZA ({100 - data.comissaoPercentual}%)</span>
          <strong className="fin-card-value">{formatBRL(data.valorLiquidoSeller)}</strong>
        </div>
        <div className="fin-card fin-card-accent">
          <span className="fin-card-label">Comissão admin ({data.comissaoPercentual}%)</span>
          <strong className="fin-card-value">{formatBRL(data.comissaoAdmin)}</strong>
        </div>
        <div className="fin-card fin-card-muted">
          <span className="fin-card-label">Receita pendente</span>
          <strong className="fin-card-value">{formatBRL(data.receitaPendente)}</strong>
          <span className="fin-card-hint">{data.pedidosPendentes} aguardando pagamento</span>
        </div>
      </div>

      <div className="fin-section">
        <h4>Vendas por dia</h4>
        {data.vendasPorDia.every((d) => d.total === 0) ? (
          <div className="fin-vazio">Nenhuma venda registrada no período.</div>
        ) : (
          <div className="fin-chart">
            {data.vendasPorDia.map((d) => {
              const altura = maxVendaDia ? (d.total / maxVendaDia) * 100 : 0;
              return (
                <div
                  key={d.data}
                  className="fin-bar-wrap"
                  title={`${d.data}: ${formatBRL(d.total)} (${d.pedidos} pedidos)`}
                >
                  <div className="fin-bar" style={{ height: `${altura}%` }} />
                  <span className="fin-bar-date">{formatData(d.data)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fin-section">
        <h4>Top 5 produtos</h4>
        {data.topProdutos.length === 0 ? (
          <div className="fin-vazio">Sem vendas no período.</div>
        ) : (
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produto</th>
                  <th style={{ textAlign: "center" }}>Unidades</th>
                  <th style={{ textAlign: "right" }}>Receita</th>
                </tr>
              </thead>
              <tbody>
                {data.topProdutos.map((p, i) => (
                  <tr key={p.produtoId}>
                    <td className="fin-rank">{i + 1}</td>
                    <td>{p.nome}</td>
                    <td style={{ textAlign: "center" }}>{p.unidades}</td>
                    <td style={{ textAlign: "right" }}>{formatBRL(p.receita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fin-section">
        <h4>Pedidos por status</h4>
        {Object.keys(data.statusCount).length === 0 ? (
          <div className="fin-vazio">Sem pedidos cadastrados.</div>
        ) : (
          <div className="fin-status-grid">
            {Object.entries(data.statusCount).map(([status, qtd]) => (
              <div key={status} className="fin-status-card">
                <span className="fin-status-qtd">{qtd}</span>
                <span className="fin-status-label">{STATUS_LABELS[status] || status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
