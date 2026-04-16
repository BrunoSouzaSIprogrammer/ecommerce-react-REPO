import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useTheme from "../hooks/useTheme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { criarPreferenciaPagamento, validarCupom } from "../services/api";
import { buscarCep, limparCep, formatarCep } from "../utils/viacep";
import "../styles/checkout-page.css";

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const {
    cart,
    subtotal,
    valorFrete,
    total,
    freteSelecionado,
    cepDestino,
    clearCart,
  } = useCart();

  const [endereco, setEndereco] = useState({
    cep: cepDestino ? formatarCep(cepDestino) : "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  });
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState(null);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  // Cupom de desconto — validado no backend.
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(null); // { codigo, tipo, valor, desconto, descricao }
  const [cupomErro, setCupomErro] = useState(null);
  const [aplicandoCupom, setAplicandoCupom] = useState(false);

  const descontoCupom = cupomAplicado?.desconto || 0;
  const totalComDesconto = Math.max(0, Number((total - descontoCupom).toFixed(2)));

  async function aplicarCupom() {
    setCupomErro(null);
    const cod = cupomCodigo.trim();
    if (!cod) {
      setCupomErro("Informe o código");
      return;
    }
    if (!user?.token) {
      setCupomErro("Faça login para usar cupons");
      return;
    }
    setAplicandoCupom(true);
    try {
      const categorias = cart
        .map((it) => it.categoria || it.categoriaId)
        .filter(Boolean);
      const result = await validarCupom(
        { codigo: cod, subtotalItens: subtotal, categorias },
        user.token,
      );
      setCupomAplicado(result);
    } catch (err) {
      setCupomAplicado(null);
      setCupomErro(err.message || "Cupom inválido");
    } finally {
      setAplicandoCupom(false);
    }
  }

  function removerCupom() {
    setCupomAplicado(null);
    setCupomCodigo("");
    setCupomErro(null);
  }

  // Se o carrinho estiver vazio OU sem frete, volta pro carrinho.
  useEffect(() => {
    if (cart.length === 0) {
      navigate("/carrinho", { replace: true });
      return;
    }
    if (!freteSelecionado) {
      navigate("/carrinho", { replace: true });
    }
  }, [cart.length, freteSelecionado, navigate]);

  // Autofill ao digitar CEP completo.
  useEffect(() => {
    const clean = limparCep(endereco.cep);
    if (clean.length !== 8) return;
    let cancelado = false;
    (async () => {
      setBuscandoCep(true);
      setErroCep(null);
      try {
        const dados = await buscarCep(clean);
        if (cancelado) return;
        setEndereco((e) => ({
          ...e,
          rua: dados.rua || e.rua,
          bairro: dados.bairro || e.bairro,
          cidade: dados.cidade || e.cidade,
          uf: dados.uf || e.uf,
        }));
      } catch (err) {
        if (!cancelado) setErroCep(err.message || "CEP inválido");
      } finally {
        if (!cancelado) setBuscandoCep(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [endereco.cep]);

  function handleCepChange(e) {
    const clean = limparCep(e.target.value).slice(0, 8);
    setEndereco((prev) => ({
      ...prev,
      cep: clean.length > 5 ? formatarCep(clean) : clean,
    }));
  }

  function handleChange(campo) {
    return (e) => setEndereco((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  function validar() {
    if (!endereco.rua) return "Informe a rua";
    if (!endereco.numero) return "Informe o número";
    if (!endereco.bairro) return "Informe o bairro";
    if (!endereco.cidade) return "Informe a cidade";
    if (!endereco.uf) return "Informe o estado";
    if (limparCep(endereco.cep).length !== 8) return "CEP inválido";
    return null;
  }

  async function handlePagar() {
    setErro(null);
    const msg = validar();
    if (msg) {
      setErro(msg);
      return;
    }
    if (!user?.token) {
      setErro("Sessão expirada. Faça login novamente.");
      return;
    }

    setEnviando(true);
    try {
      const itens = cart.map((item) => ({
        id: item.id,
        nome: item.nome,
        preco: Number(item.preco) || 0,
        quantidade: item.quantity || 1,
        tamanho: item.tamanho || null,
        imagem: item.imagem || item.image || null,
      }));

      const payload = {
        itens,
        subtotal,
        frete: {
          servico: freteSelecionado.servico,
          codigo: freteSelecionado.codigo,
          preco: Number(freteSelecionado.preco) || 0,
          prazoDias: freteSelecionado.prazoDias,
          transportadora: freteSelecionado.transportadora || null,
        },
        total,
        endereco: {
          cep: limparCep(endereco.cep),
          rua: endereco.rua,
          numero: endereco.numero,
          complemento: endereco.complemento,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          uf: endereco.uf,
        },
        contato: {
          nome: user.nome || user.name || "",
          email: user.email || "",
          telefone: user.telefone || null,
        },
        cupomCodigo: cupomAplicado?.codigo || null,
      };

      const res = await criarPreferenciaPagamento(payload, user.token);

      // IMPORTANTE: usamos window.location.href em vez de navigate() porque
      // clearCart() dispara o useEffect que vigia `cart.length === 0` e
      // redireciona pra /carrinho antes do navigate completar (race condition).
      // window.location.href força uma navegação hard que desmonta tudo.
      //
      // Em modo stub, MP retorna initPoint apontando para /pagamento/sucesso,
      // permitindo validar o fluxo sem credenciais reais.
      clearCart();

      if (res.stub || !res.initPoint) {
        window.location.href = `/pagamento/sucesso?pedido=${
          res.pedidoId || ""
        }&stub=1`;
        return;
      }

      window.location.href = res.initPoint;
    } catch (err) {
      setErro(err.message || "Erro ao iniciar pagamento");
    } finally {
      setEnviando(false);
    }
  }

  if (cart.length === 0 || !freteSelecionado) {
    // evita render flicker antes do redirect
    return null;
  }

  return (
    <div className="checkout-page">
      <Navbar
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        theme={theme}
      />

      <div className="container checkout-container">
        <h1 className="checkout-titulo">Finalizar pedido</h1>

        <div className="checkout-grid">
          {/* Formulário */}
          <div className="checkout-form">
            <section className="checkout-card">
              <h2>Endereço de entrega</h2>

              <div className="form-row">
                <div className="form-field">
                  <label>CEP</label>
                  <input
                    type="text"
                    value={endereco.cep}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {buscandoCep && (
                    <span className="hint">Buscando endereço...</span>
                  )}
                  {erroCep && <span className="hint erro">{erroCep}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field flex-3">
                  <label>Rua</label>
                  <input
                    type="text"
                    value={endereco.rua}
                    onChange={handleChange("rua")}
                  />
                </div>
                <div className="form-field flex-1">
                  <label>Número</label>
                  <input
                    type="text"
                    value={endereco.numero}
                    onChange={handleChange("numero")}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Complemento</label>
                  <input
                    type="text"
                    value={endereco.complemento}
                    onChange={handleChange("complemento")}
                    placeholder="Apto, bloco, etc (opcional)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field flex-2">
                  <label>Bairro</label>
                  <input
                    type="text"
                    value={endereco.bairro}
                    onChange={handleChange("bairro")}
                  />
                </div>
                <div className="form-field flex-2">
                  <label>Cidade</label>
                  <input
                    type="text"
                    value={endereco.cidade}
                    onChange={handleChange("cidade")}
                  />
                </div>
                <div className="form-field flex-1">
                  <label>UF</label>
                  <input
                    type="text"
                    value={endereco.uf}
                    onChange={handleChange("uf")}
                    maxLength={2}
                  />
                </div>
              </div>
            </section>

            <section className="checkout-card">
              <h2>Pagamento</h2>
              <p className="mp-info">
                Você será redirecionado para o <strong>Mercado Pago</strong>,
                onde poderá pagar com <strong>PIX</strong>,{" "}
                <strong>cartão de crédito</strong> ou{" "}
                <strong>boleto</strong>, de forma 100% segura.
              </p>
            </section>
          </div>

          {/* Resumo */}
          <aside className="checkout-resumo">
            <h2>Seu pedido</h2>

            <div className="resumo-itens">
              {cart.map((item) => (
                <div key={item.id} className="resumo-item">
                  <span className="resumo-item-nome">
                    {item.quantity || 1}× {item.nome}
                    {item.tamanho && (
                      <small> ({item.tamanho})</small>
                    )}
                  </span>
                  <span className="resumo-item-preco">
                    {formatBRL(
                      (Number(item.preco) || 0) * (item.quantity || 1),
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="resumo-divider" />

            <div className="resumo-linha">
              <span>Subtotal</span>
              <strong>{formatBRL(subtotal)}</strong>
            </div>
            <div className="resumo-linha">
              <span>
                Frete ({freteSelecionado.servico})
              </span>
              <strong>{formatBRL(valorFrete)}</strong>
            </div>

            {/* Cupom de desconto */}
            <div className="resumo-cupom">
              {!cupomAplicado ? (
                <>
                  <div className="cupom-input-row">
                    <input
                      type="text"
                      className="cupom-input"
                      value={cupomCodigo}
                      onChange={(e) =>
                        setCupomCodigo(e.target.value.toUpperCase())
                      }
                      placeholder="Código do cupom"
                      disabled={aplicandoCupom}
                    />
                    <button
                      type="button"
                      className="btn-aplicar-cupom"
                      onClick={aplicarCupom}
                      disabled={aplicandoCupom || !cupomCodigo.trim()}
                    >
                      {aplicandoCupom ? "..." : "Aplicar"}
                    </button>
                  </div>
                  {cupomErro && (
                    <div className="cupom-erro">{cupomErro}</div>
                  )}
                </>
              ) : (
                <div className="cupom-aplicado">
                  <span>
                    Cupom <strong>{cupomAplicado.codigo}</strong> aplicado
                  </span>
                  <button
                    type="button"
                    className="btn-remover-cupom"
                    onClick={removerCupom}
                    aria-label="Remover cupom"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {descontoCupom > 0 && (
              <div className="resumo-linha resumo-linha-desconto">
                <span>Desconto</span>
                <strong>- {formatBRL(descontoCupom)}</strong>
              </div>
            )}

            <div className="resumo-total">
              <span>Total</span>
              <strong>{formatBRL(totalComDesconto)}</strong>
            </div>

            {erro && <div className="checkout-erro">{erro}</div>}

            <button
              className="btn-pagar"
              onClick={handlePagar}
              disabled={enviando}
            >
              {enviando ? "Redirecionando..." : "Pagar com Mercado Pago"}
            </button>

            <button
              className="btn-voltar"
              onClick={() => navigate("/carrinho")}
              disabled={enviando}
            >
              ← Voltar ao carrinho
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
