import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import AvaliacaoModal from "../components/AvaliacaoModal";
import useTheme from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import {
  obterPedido,
  avaliarPedido,
  consultarRastreio,
} from "../services/api";
import {
  STATUS_FLUXO,
  labelStatus,
  corStatus,
  progressoStatus,
  formatarData,
} from "../utils/pedidoStatus";
import { imagemProduto } from "../utils/imagemProduto";
import "../styles/pedido-detalhe.css";

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PedidoDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [modalAvaliacao, setModalAvaliacao] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [carregandoTracking, setCarregandoTracking] = useState(false);
  const [erroTracking, setErroTracking] = useState(null);

  const carregar = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const data = await obterPedido(id, user.token);
      setPedido(data);
      // Se acabou de chegar em "recebido" e ainda não avaliou, abre modal.
      if (data.status === "recebido" && !data.avaliacao) {
        setModalAvaliacao(true);
      }
    } catch (err) {
      setErro(err.message || "Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }, [id, user?.token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleConsultarRastreio() {
    setErroTracking(null);
    setCarregandoTracking(true);
    try {
      const t = await consultarRastreio(id, user.token);
      setTracking(t);
    } catch (err) {
      setErroTracking(err.message || "Erro ao consultar rastreio");
    } finally {
      setCarregandoTracking(false);
    }
  }

  async function handleAvaliar({ nota, comentario }) {
    await avaliarPedido(id, nota, comentario, user.token);
    setModalAvaliacao(false);
    await carregar();
  }

  if (loading) {
    return (
      <div className="pedido-page">
        <Navbar
          onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          theme={theme}
        />
        <div className="container pedido-container">
          <p>Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (erro || !pedido) {
    return (
      <div className="pedido-page">
        <Navbar
          onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          theme={theme}
        />
        <div className="container pedido-container">
          <div className="pedido-erro">{erro || "Pedido não encontrado"}</div>
          <button className="btn-voltar" onClick={() => navigate("/conta/pedidos")}>
            ← Meus pedidos
          </button>
        </div>
      </div>
    );
  }

  const progresso = progressoStatus(pedido.status);
  const cancelado = pedido.status === "cancelado";

  return (
    <div className="pedido-page">
      <Navbar
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        theme={theme}
      />

      <div className="container pedido-container">
        <button
          className="btn-voltar"
          onClick={() => navigate("/conta/pedidos")}
        >
          ← Meus pedidos
        </button>

        <header className="pedido-header">
          <div>
            <span className="pedido-label">Pedido</span>
            <h1>#{pedido.id.slice(0, 12)}</h1>
          </div>
          <span
            className="pedido-status-badge"
            style={{
              background: `${corStatus(pedido.status)}22`,
              color: corStatus(pedido.status),
              borderColor: `${corStatus(pedido.status)}66`,
            }}
          >
            {labelStatus(pedido.status)}
          </span>
        </header>

        {/* Linha do tempo */}
        {!cancelado && (
          <div className="timeline">
            <div
              className="timeline-fill"
              style={{ width: `${progresso}%` }}
            />
            {STATUS_FLUXO.map((s, i) => {
              const ativo = progresso >= Math.round((i / (STATUS_FLUXO.length - 1)) * 100);
              return (
                <div
                  key={s}
                  className={`timeline-step ${ativo ? "ativo" : ""}`}
                >
                  <div className="timeline-dot" />
                  <span>{labelStatus(s)}</span>
                </div>
              );
            })}
          </div>
        )}

        {cancelado && (
          <div className="pedido-cancelado-bloco">
            Pedido cancelado em {formatarData(pedido.canceladoEm)}.
          </div>
        )}

        <div className="pedido-grid">
          {/* Coluna principal */}
          <div className="pedido-main">
            <section className="pedido-card-bloco">
              <h2>Itens ({pedido.itens?.length || 0})</h2>
              <div className="itens-lista">
                {(pedido.itens || []).map((it, idx) => {
                  const src = imagemProduto(it);
                  return (
                  <div key={idx} className="item-linha">
                    {src && (
                      <img src={src} alt={it.nome} />
                    )}
                    <div className="item-info">
                      <strong>{it.nome}</strong>
                      {it.tamanho && <span>Tamanho: {it.tamanho}</span>}
                      <span>
                        {it.quantidade || it.quantity || 1}× {formatBRL(it.preco)}
                      </span>
                    </div>
                    <div className="item-subtotal">
                      {formatBRL(
                        (Number(it.preco) || 0) *
                          (it.quantidade || it.quantity || 1),
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>

            {pedido.rastreio?.codigo && (
              <section className="pedido-card-bloco">
                <h2>Rastreio</h2>
                <div className="rastreio-info">
                  <div>
                    <span className="pedido-label">Código</span>
                    <strong className="codigo-rastreio">
                      {pedido.rastreio.codigo}
                    </strong>
                  </div>
                  {pedido.rastreio.transportadora && (
                    <div>
                      <span className="pedido-label">Transportadora</span>
                      <strong>{pedido.rastreio.transportadora}</strong>
                    </div>
                  )}
                  <button
                    className="btn-rastrear"
                    onClick={handleConsultarRastreio}
                    disabled={carregandoTracking}
                  >
                    {carregandoTracking ? "Consultando..." : "Atualizar status"}
                  </button>
                </div>

                {erroTracking && (
                  <p className="rastreio-erro">{erroTracking}</p>
                )}

                {tracking && (
                  <ul className="rastreio-eventos">
                    {tracking.eventos.map((e, i) => (
                      <li key={i}>
                        <span className="rastreio-data">
                          {formatarData(e.data)}
                        </span>
                        <strong>{e.status}</strong>
                        {e.local && <em>{e.local}</em>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {pedido.endereco && (
              <section className="pedido-card-bloco">
                <h2>Endereço de entrega</h2>
                <p className="endereco-txt">
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

            {pedido.avaliacao && (
              <section className="pedido-card-bloco">
                <h2>Sua avaliação</h2>
                <div className="avaliacao-resumo">
                  <div className="estrelas">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={
                          n <= pedido.avaliacao.nota ? "star on" : "star"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {pedido.avaliacao.comentario && (
                    <p>"{pedido.avaliacao.comentario}"</p>
                  )}
                  <small>
                    Avaliado em {formatarData(pedido.avaliacao.avaliadoEm)}
                  </small>
                </div>
              </section>
            )}

            {pedido.status === "recebido" && !pedido.avaliacao && (
              <button
                className="btn-avaliar"
                onClick={() => setModalAvaliacao(true)}
              >
                ⭐ Avaliar este pedido
              </button>
            )}
          </div>

          {/* Resumo lateral */}
          <aside className="pedido-resumo">
            <h2>Resumo</h2>

            <div className="resumo-linha">
              <span>Subtotal</span>
              <strong>{formatBRL(pedido.subtotalItens)}</strong>
            </div>
            <div className="resumo-linha">
              <span>Frete ({pedido.frete?.servico || "—"})</span>
              <strong>{formatBRL(pedido.valorFrete)}</strong>
            </div>
            <div className="resumo-total">
              <span>Total</span>
              <strong>{formatBRL(pedido.total)}</strong>
            </div>

            <div className="resumo-meta">
              <div>
                <span className="pedido-label">Criado</span>
                <strong>{formatarData(pedido.criadoEm)}</strong>
              </div>
              {pedido.pagoEm && (
                <div>
                  <span className="pedido-label">Pago</span>
                  <strong>{formatarData(pedido.pagoEm)}</strong>
                </div>
              )}
              {pedido.enviadoEm && (
                <div>
                  <span className="pedido-label">Enviado</span>
                  <strong>{formatarData(pedido.enviadoEm)}</strong>
                </div>
              )}
              {pedido.recebidoEm && (
                <div>
                  <span className="pedido-label">Recebido</span>
                  <strong>{formatarData(pedido.recebidoEm)}</strong>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <AvaliacaoModal
        open={modalAvaliacao}
        onClose={() => setModalAvaliacao(false)}
        onSubmit={handleAvaliar}
        pedidoId={pedido.id}
      />
    </div>
  );
}
