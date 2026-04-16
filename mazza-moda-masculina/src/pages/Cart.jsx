import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useTheme from "../hooks/useTheme";
import { useCart } from "../context/CartContext";
import { calcularFrete } from "../services/api";
import { limparCep, formatarCep } from "../utils/viacep";
import { imagemProduto } from "../utils/imagemProduto";
import "../styles/carrinho.css";

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Cart() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    valorFrete,
    total,
    cepDestino,
    setCepDestino,
    freteSelecionado,
    setFreteSelecionado,
    showToast,
  } = useCart();

  const [cepInput, setCepInput] = useState(cepDestino || "");
  const [opcoesFrete, setOpcoesFrete] = useState([]);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState(null);

  function handleCepChange(e) {
    const valor = e.target.value;
    const clean = limparCep(valor).slice(0, 8);
    setCepInput(clean.length > 5 ? formatarCep(clean) : clean);
  }

  async function handleCalcularFrete() {
    setErroFrete(null);
    const clean = limparCep(cepInput);
    if (clean.length !== 8) {
      setErroFrete("Informe um CEP válido (8 dígitos)");
      return;
    }
    if (cart.length === 0) {
      setErroFrete("Carrinho vazio");
      return;
    }
    setLoadingFrete(true);
    try {
      const itens = cart.map((item) => ({
        id: item.id,
        preco: Number(item.preco) || 0,
        quantidade: item.quantity || 1,
      }));
      const res = await calcularFrete(clean, itens);
      setOpcoesFrete(res.opcoes || []);
      setCepDestino(clean);
      // Se já havia uma opção selecionada, tenta manter; senão pega a primeira.
      const opcoes = res.opcoes || [];
      if (opcoes.length > 0) {
        const anterior =
          freteSelecionado &&
          opcoes.find(
            (o) =>
              o.codigo === freteSelecionado.codigo &&
              o.servico === freteSelecionado.servico,
          );
        setFreteSelecionado(anterior || opcoes[0]);
      } else {
        setFreteSelecionado(null);
      }
    } catch (err) {
      setErroFrete(err.message || "Erro ao calcular frete");
      setOpcoesFrete([]);
      setFreteSelecionado(null);
    } finally {
      setLoadingFrete(false);
    }
  }

  function handleFinalizar() {
    if (cart.length === 0) {
      showToast("Carrinho vazio");
      return;
    }
    if (!freteSelecionado) {
      showToast("Calcule o frete antes de continuar");
      return;
    }
    navigate("/checkout");
  }

  return (
    <div className="carrinho-page">
      <Navbar
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        theme={theme}
      />

      <div className="container carrinho-container">
        <h1 className="carrinho-titulo">Meu Carrinho</h1>

        {cart.length === 0 ? (
          <div className="carrinho-vazio">
            <p>Seu carrinho está vazio.</p>
            <button
              className="btn-continuar"
              onClick={() => navigate("/")}
            >
              Continuar comprando
            </button>
          </div>
        ) : (
          <div className="carrinho-grid">
            {/* Itens */}
            <div className="carrinho-itens">
              {cart.map((item) => {
                const src = imagemProduto(item);
                return (
                <div key={item.id} className="carrinho-item">
                  <div className="item-img-wrap">
                    {src ? (
                      <img
                        src={src}
                        alt={item.nome}
                        className="item-img"
                      />
                    ) : (
                      <div className="item-img item-img-placeholder">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  <div className="item-info">
                    <h3 className="item-nome">{item.nome}</h3>
                    {item.tamanho && (
                      <p className="item-tamanho">
                        Tamanho: <strong>{item.tamanho}</strong>
                      </p>
                    )}
                    <p className="item-preco">
                      {formatBRL(item.preco)}
                    </p>
                  </div>

                  <div className="item-acoes">
                    <div className="qtd-control">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(1, (item.quantity || 1) - 1),
                          )
                        }
                        aria-label="Diminuir"
                      >
                        −
                      </button>
                      <span>{item.quantity || 1}</span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            (item.quantity || 1) + 1,
                          )
                        }
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="btn-remover"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Resumo lateral */}
            <aside className="carrinho-resumo">
              <h2>Resumo</h2>

              <div className="resumo-linha">
                <span>Subtotal</span>
                <strong>{formatBRL(subtotal)}</strong>
              </div>

              <div className="frete-box">
                <label htmlFor="cep-input">Calcular frete</label>
                <div className="frete-input-row">
                  <input
                    id="cep-input"
                    type="text"
                    placeholder="00000-000"
                    value={cepInput}
                    onChange={handleCepChange}
                    maxLength={9}
                  />
                  <button
                    onClick={handleCalcularFrete}
                    disabled={loadingFrete}
                    className="btn-calcular"
                  >
                    {loadingFrete ? "..." : "OK"}
                  </button>
                </div>

                {erroFrete && (
                  <p className="frete-erro">{erroFrete}</p>
                )}

                {opcoesFrete.length > 0 && (
                  <div className="frete-opcoes">
                    {opcoesFrete.map((op) => {
                      const selecionado =
                        freteSelecionado &&
                        freteSelecionado.codigo === op.codigo &&
                        freteSelecionado.servico === op.servico;
                      return (
                        <label
                          key={`${op.codigo}-${op.servico}`}
                          className={`frete-opcao ${
                            selecionado ? "selected" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="frete"
                            checked={!!selecionado}
                            onChange={() => setFreteSelecionado(op)}
                          />
                          <div className="frete-opcao-info">
                            <span className="frete-servico">
                              {op.servico}
                            </span>
                            <span className="frete-prazo">
                              {op.prazoDias} dia
                              {op.prazoDias === 1 ? "" : "s"} úteis
                            </span>
                          </div>
                          <span className="frete-preco">
                            {formatBRL(op.preco)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {freteSelecionado && (
                <div className="resumo-linha">
                  <span>Frete</span>
                  <strong>{formatBRL(valorFrete)}</strong>
                </div>
              )}

              <div className="resumo-total">
                <span>Total</span>
                <strong>{formatBRL(total)}</strong>
              </div>

              <button
                className="btn-finalizar"
                onClick={handleFinalizar}
                disabled={!freteSelecionado}
              >
                Finalizar compra
              </button>

              <button
                className="btn-continuar-link"
                onClick={() => navigate("/")}
              >
                ← Continuar comprando
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
