import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useTheme from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { listarPedidos } from "../services/api";
import { labelStatus, corStatus, formatarData } from "../utils/pedidoStatus";
import "../styles/meus-pedidos.css";

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Ordem de exibição dos grupos e labels "amigáveis" para o cliente.
const GRUPOS = [
  { status: "aguardando_pagamento", titulo: "Aguardando pagamento" },
  { status: "em_producao", titulo: "Em preparação" },
  { status: "enviado", titulo: "Enviados" },
  { status: "recebido", titulo: "Recebidos" },
  { status: "cancelado", titulo: "Cancelados" },
];

export default function MeusPedidos() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    (async () => {
      setLoading(true);
      try {
        const data = await listarPedidos(user.token);
        setPedidos(Array.isArray(data) ? data : []);
      } catch (err) {
        setErro(err.message || "Erro ao carregar pedidos");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.token]);

  const grupos = useMemo(() => {
    return GRUPOS.map((g) => ({
      ...g,
      pedidos: pedidos.filter((p) => p.status === g.status),
    })).filter((g) => g.pedidos.length > 0);
  }, [pedidos]);

  return (
    <div className="meus-pedidos-page">
      <Navbar
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        theme={theme}
      />

      <div className="container meus-pedidos-container">
        <header className="meus-pedidos-header">
          <h1>Meus pedidos</h1>
          <p>Acompanhe o status dos seus pedidos e avalie quando receber.</p>
        </header>

        {loading && <div className="pedidos-info">Carregando...</div>}

        {erro && <div className="pedidos-erro">{erro}</div>}

        {!loading && !erro && pedidos.length === 0 && (
          <div className="pedidos-vazio">
            <p>Você ainda não fez nenhum pedido.</p>
            <button onClick={() => navigate("/")}>Explorar loja</button>
          </div>
        )}

        {!loading && grupos.map((grupo) => (
          <section key={grupo.status} className="pedidos-grupo">
            <div className="pedidos-grupo-header">
              <span
                className="pedidos-grupo-dot"
                style={{ background: corStatus(grupo.status) }}
              />
              <h2 className="pedidos-grupo-titulo">{grupo.titulo}</h2>
              <span className="pedidos-grupo-qtd">
                {grupo.pedidos.length}
              </span>
            </div>

            <ul className="pedidos-lista">
              {grupo.pedidos.map((p) => {
                const totalItens = (p.itens || []).reduce(
                  (acc, it) => acc + (it.quantidade || it.quantity || 1),
                  0,
                );
                const precisaAvaliar =
                  p.status === "recebido" && !p.avaliacao;
                return (
                  <li
                    key={p.id}
                    className="pedido-card"
                    onClick={() => navigate(`/conta/pedidos/${p.id}`)}
                  >
                    <div className="pedido-topo">
                      <span className="pedido-id">#{p.id.slice(0, 8)}</span>
                      <span
                        className="pedido-status"
                        style={{
                          background: `${corStatus(p.status)}22`,
                          color: corStatus(p.status),
                          borderColor: `${corStatus(p.status)}66`,
                        }}
                      >
                        {labelStatus(p.status)}
                      </span>
                    </div>

                    <div className="pedido-meio">
                      <div>
                        <span className="pedido-label">Itens</span>
                        <strong>{totalItens}</strong>
                      </div>
                      <div>
                        <span className="pedido-label">Total</span>
                        <strong>{formatBRL(p.total)}</strong>
                      </div>
                      <div>
                        <span className="pedido-label">Criado</span>
                        <strong>{formatarData(p.criadoEm)}</strong>
                      </div>
                    </div>

                    {precisaAvaliar && (
                      <div className="pedido-flag">
                        ⭐ Avalie este pedido
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
