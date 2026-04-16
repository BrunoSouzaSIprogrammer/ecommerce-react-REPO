import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listarPedidos,
  atualizarStatusPedido,
  atualizarRastreio,
} from "../../services/api";
import {
  STATUS_FLUXO,
  STATUS_LABELS,
  labelStatus,
  corStatus,
  formatarData,
} from "../../utils/pedidoStatus";
import "../../styles/admin-pedidos.css";

const FILTROS = [
  { id: "ativos", label: "Em andamento" },
  { id: "aguardando_pagamento", label: "Aguardando pagamento" },
  { id: "em_producao", label: "Em produção" },
  { id: "enviado", label: "Enviados" },
  { id: "recebido", label: "Recebidos" },
  { id: "cancelado", label: "Cancelados" },
  { id: "todos", label: "Todos" },
];

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PedidosManager() {
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState("ativos");
  const [expandido, setExpandido] = useState(null);
  const [salvando, setSalvando] = useState(null);

  async function recarregar() {
    if (!user?.token) return;
    setLoading(true);
    setErro(null);
    try {
      const data = await listarPedidos(user.token);
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message || "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const filtrados = useMemo(() => {
    if (filtro === "todos") return pedidos;
    if (filtro === "ativos") {
      return pedidos.filter(
        (p) => p.status !== "recebido" && p.status !== "cancelado",
      );
    }
    return pedidos.filter((p) => p.status === filtro);
  }, [pedidos, filtro]);

  async function handleStatus(pedido, novoStatus) {
    setSalvando(pedido.id);
    try {
      await atualizarStatusPedido(pedido.id, novoStatus, user.token);
      await recarregar();
    } catch (err) {
      alert(err.message || "Erro ao atualizar");
    } finally {
      setSalvando(null);
    }
  }

  async function handleRastreio(pedido, dados) {
    setSalvando(pedido.id);
    try {
      await atualizarRastreio(pedido.id, dados, user.token);
      await recarregar();
    } catch (err) {
      alert(err.message || "Erro ao salvar rastreio");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="admin-pedidos">
      <div className="admin-pedidos-filtros">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            className={`filtro-chip ${filtro === f.id ? "ativo" : ""}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
            {f.id === "ativos" && (
              <span className="filtro-count">
                {
                  pedidos.filter(
                    (p) => p.status !== "recebido" && p.status !== "cancelado",
                  ).length
                }
              </span>
            )}
          </button>
        ))}
        <button
          className="filtro-refresh"
          onClick={recarregar}
          disabled={loading}
        >
          {loading ? "..." : "↻ Atualizar"}
        </button>
      </div>

      {erro && <div className="admin-pedidos-erro">{erro}</div>}

      {!loading && filtrados.length === 0 && (
        <div className="admin-pedidos-vazio">
          Nenhum pedido nesse filtro.
        </div>
      )}

      <div className="admin-pedidos-lista">
        {filtrados.map((p) => (
          <PedidoRow
            key={p.id}
            pedido={p}
            expandido={expandido === p.id}
            onToggle={() => setExpandido(expandido === p.id ? null : p.id)}
            onStatus={(s) => handleStatus(p, s)}
            onRastreio={(d) => handleRastreio(p, d)}
            salvando={salvando === p.id}
          />
        ))}
      </div>
    </div>
  );
}

function PedidoRow({ pedido, expandido, onToggle, onStatus, onRastreio, salvando }) {
  const [codigoRastreio, setCodigoRastreio] = useState(
    pedido.rastreio?.codigo || "",
  );
  const [transportadora, setTransportadora] = useState(
    pedido.rastreio?.transportadora || pedido.frete?.transportadora || "",
  );

  const statusSeguintes = STATUS_FLUXO.filter(
    (s) => s !== pedido.status && s !== "aguardando_pagamento",
  );

  const totalItens = (pedido.itens || []).reduce(
    (acc, it) => acc + (it.quantidade || it.quantity || 1),
    0,
  );

  return (
    <div className="admin-pedido-card">
      <div className="admin-pedido-topo" onClick={onToggle}>
        <div className="admin-pedido-id">
          <span className="pedido-label">Pedido</span>
          <strong>#{pedido.id.slice(0, 8)}</strong>
        </div>
        <div className="admin-pedido-cliente">
          <span className="pedido-label">Cliente</span>
          <strong>{pedido.contato?.nome || pedido.userEmail || "—"}</strong>
          <small>{pedido.contato?.email || pedido.userEmail}</small>
        </div>
        <div className="admin-pedido-total">
          <span className="pedido-label">Total</span>
          <strong>{formatBRL(pedido.total)}</strong>
          <small>{totalItens} {totalItens === 1 ? "item" : "itens"}</small>
        </div>
        <div className="admin-pedido-data">
          <span className="pedido-label">Criado</span>
          <strong>{formatarData(pedido.criadoEm)}</strong>
        </div>
        <div
          className="admin-pedido-status"
          style={{
            background: `${corStatus(pedido.status)}22`,
            color: corStatus(pedido.status),
            borderColor: `${corStatus(pedido.status)}66`,
          }}
        >
          {labelStatus(pedido.status)}
        </div>
        <button className="btn-expandir" aria-label="Expandir">
          {expandido ? "▲" : "▼"}
        </button>
      </div>

      {expandido && (
        <div className="admin-pedido-detalhe">
          {/* Itens */}
          <section>
            <h4>Itens</h4>
            <ul className="admin-itens-lista">
              {(pedido.itens || []).map((it, idx) => (
                <li key={idx}>
                  <span>
                    {it.quantidade || it.quantity || 1}× {it.nome}
                    {it.tamanho && ` (${it.tamanho})`}
                  </span>
                  <strong>{formatBRL(it.preco)}</strong>
                </li>
              ))}
            </ul>
          </section>

          {/* Endereço */}
          {pedido.endereco && (
            <section>
              <h4>Endereço</h4>
              <p className="admin-endereco">
                {pedido.endereco.rua}, {pedido.endereco.numero}
                {pedido.endereco.complemento &&
                  ` — ${pedido.endereco.complemento}`}
                <br />
                {pedido.endereco.bairro} — {pedido.endereco.cidade}/
                {pedido.endereco.uf}
                <br />
                CEP {pedido.endereco.cep}
              </p>
            </section>
          )}

          {/* Rastreio */}
          <section className="admin-rastreio-form">
            <h4>Rastreio</h4>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Código de rastreio"
                value={codigoRastreio}
                onChange={(e) => setCodigoRastreio(e.target.value)}
                disabled={salvando}
              />
              <input
                type="text"
                placeholder="Transportadora (PAC, SEDEX...)"
                value={transportadora}
                onChange={(e) => setTransportadora(e.target.value)}
                disabled={salvando}
              />
              <button
                className="btn-salvar"
                disabled={salvando || !codigoRastreio.trim()}
                onClick={() =>
                  onRastreio({
                    codigoRastreio: codigoRastreio.trim(),
                    transportadora: transportadora.trim(),
                  })
                }
              >
                {salvando ? "Salvando..." : "Salvar rastreio"}
              </button>
            </div>
            {pedido.rastreio?.codigo && (
              <small className="admin-rastreio-meta">
                Último: {pedido.rastreio.codigo} ·{" "}
                {formatarData(pedido.rastreio.adicionadoEm)}
              </small>
            )}
          </section>

          {/* Status actions */}
          <section>
            <h4>Atualizar status</h4>
            <div className="admin-status-acoes">
              {statusSeguintes.map((s) => (
                <button
                  key={s}
                  disabled={salvando}
                  className="btn-status"
                  style={{
                    borderColor: corStatus(s),
                    color: corStatus(s),
                  }}
                  onClick={() => onStatus(s)}
                >
                  → {STATUS_LABELS[s]}
                </button>
              ))}
              {pedido.status !== "cancelado" &&
                pedido.status !== "recebido" && (
                  <button
                    disabled={salvando}
                    className="btn-status cancelar"
                    onClick={() => {
                      if (window.confirm("Cancelar este pedido?")) {
                        onStatus("cancelado");
                      }
                    }}
                  >
                    Cancelar pedido
                  </button>
                )}
            </div>
          </section>

          {pedido.avaliacao && (
            <section>
              <h4>
                Avaliação — {pedido.avaliacao.nota} ★
              </h4>
              {pedido.avaliacao.comentario && (
                <p className="admin-avaliacao-comentario">
                  "{pedido.avaliacao.comentario}"
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
