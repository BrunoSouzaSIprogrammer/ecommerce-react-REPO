import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import useTheme from "../hooks/useTheme";
import { useCart } from "../context/CartContext";
import { listarProdutos } from "../services/api";
import {
  CATEGORIAS,
  CATEGORIAS_POR_ID,
  ORDENACOES,
} from "../utils/filtros";
import "../styles/catalogo.css";

// Estado inicial dos filtros vazio — cada campo começa
// "sem filtro" e o usuário ativa conforme desejar.
function filtrosIniciais() {
  return {
    marca: "",
    tamanhos: [],
    cores: [],
    tipos: [],
    subtipo: "",
    estampa: null, // null = qualquer, true/false explícito
    precoMin: "",
    precoMax: "",
    ordenar: "",
  };
}

export default function Catalogo() {
  const { categoria: categoriaParam } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { addToCart, showToast } = useCart();

  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [ordemAberta, setOrdemAberta] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);

  const categoriaDef = CATEGORIAS_POR_ID[categoriaParam] || null;

  // Sempre que a categoria muda, resetamos os filtros
  // (cada categoria tem campos diferentes).
  useEffect(() => {
    setFiltros(filtrosIniciais());
  }, [categoriaParam]);

  // Busca no backend. Debounce leve (300ms) para input de marca/preço.
  useEffect(() => {
    if (!categoriaDef) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { categoria: categoriaDef.id };

        if (filtros.marca) params.marca = filtros.marca;
        if (filtros.tamanhos.length)
          params.tamanhos = filtros.tamanhos.join(",");
        if (filtros.cores.length) params.cores = filtros.cores.join(",");
        if (filtros.tipos.length) params.tipos = filtros.tipos.join(",");
        if (filtros.subtipo) params.subtipo = filtros.subtipo;
        if (filtros.estampa !== null) params.estampa = String(filtros.estampa);
        if (filtros.precoMin) params.precoMin = filtros.precoMin;
        if (filtros.precoMax) params.precoMax = filtros.precoMax;
        if (filtros.ordenar) params.ordenar = filtros.ordenar;

        const data = await listarProdutos(params);
        setProdutos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        showToast("Erro ao carregar produtos");
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
    // showToast é estável (vem do context); não precisa entrar na dep list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaDef, filtros]);

  // Shorts tem regra especial: se tipo Mauricinho está selecionado,
  // a lista de tamanhos muda para P/M/G/GG.
  const tamanhosDisponiveis = useMemo(() => {
    if (!categoriaDef?.filtros?.tamanho) return null;
    const t = categoriaDef.filtros.tamanho;
    if (
      categoriaDef.id === "shorts" &&
      filtros.tipos.includes("Mauricinho") &&
      t.opcoesMauricinho
    ) {
      return t.opcoesMauricinho;
    }
    return t.opcoes;
  }, [categoriaDef, filtros.tipos]);

  // Subtipos aparecem dinamicamente para acessórios
  // conforme o tipo escolhido.
  const subtipoOpcoes = useMemo(() => {
    const f = categoriaDef?.filtros?.subtipo;
    if (!f?.subtipoPor) return null;
    const tipoAtual = categoriaDef?.filtros?.tipo?.tipo === "select"
      ? filtros.tipos[0]
      : null;
    return tipoAtual ? f.subtipoPor[tipoAtual] || null : null;
  }, [categoriaDef, filtros.tipos]);

  function toggleMulti(key, valor) {
    setFiltros((f) => {
      const atual = f[key];
      return atual.includes(valor)
        ? { ...f, [key]: atual.filter((v) => v !== valor) }
        : { ...f, [key]: [...atual, valor] };
    });
  }

  function selecionarOrdem(id) {
    setFiltros((f) => ({ ...f, ordenar: id }));
    setOrdemAberta(false);
  }

  function handleAddToCart(produto) {
    addToCart(produto);
    showToast(`${produto.nome} adicionado ao carrinho`);
  }

  if (!categoriaDef) {
    return (
      <div className={`catalogo-page ${theme}`}>
        <Navbar
          onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          theme={theme}
        />
        <div className="catalogo-empty">
          <h2>Categoria não encontrada</h2>
          <p>Escolha uma categoria para começar a explorar.</p>
          <div className="catalogo-chips">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                className="catalogo-chip"
                onClick={() => navigate(`/catalogo/${c.id}`)}
              >
                <span className="chip-icon">{c.icone}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const ordemAtual =
    ORDENACOES.find((o) => o.id === filtros.ordenar)?.label || "Ordenar";

  return (
    <div className={`catalogo-page ${theme}`}>
      <Navbar
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        theme={theme}
      />

      {/* Tabs das categorias */}
      <div className="catalogo-tabs">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            className={`catalogo-tab ${
              c.id === categoriaDef.id ? "active" : ""
            }`}
            onClick={() => navigate(`/catalogo/${c.id}`)}
          >
            <span className="tab-icon">{c.icone}</span>
            <span className="tab-label">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="catalogo-layout">
        {/* Toggle mobile */}
        <button
          className="filtros-toggle"
          onClick={() => setSidebarAberta((v) => !v)}
          aria-expanded={sidebarAberta}
        >
          {sidebarAberta ? "✕ Fechar filtros" : "☰ Filtros"}
        </button>

        {/* Sidebar de filtros */}
        <aside className={`catalogo-sidebar ${sidebarAberta ? "open" : ""}`}>
          <header className="sidebar-header">
            <h3>Filtros</h3>
            <button
              className="sidebar-limpar"
              onClick={() => setFiltros(filtrosIniciais())}
            >
              Limpar
            </button>
          </header>

          {/* Marca (texto livre) */}
          {categoriaDef.filtros.marca && (
            <FieldBlock label="Marca">
              <input
                type="text"
                className="filtro-input"
                placeholder="Digite a marca..."
                value={filtros.marca}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, marca: e.target.value }))
                }
              />
            </FieldBlock>
          )}

          {/* Tipos */}
          {categoriaDef.filtros.tipo && (
            <FieldBlock label="Tipo">
              {categoriaDef.filtros.tipo.tipo === "select" ? (
                <select
                  className="filtro-input"
                  value={filtros.tipos[0] || ""}
                  onChange={(e) =>
                    setFiltros((f) => ({
                      ...f,
                      tipos: e.target.value ? [e.target.value] : [],
                      subtipo: "",
                    }))
                  }
                >
                  <option value="">Todos</option>
                  {categoriaDef.filtros.tipo.opcoes.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="chip-grid">
                  {categoriaDef.filtros.tipo.opcoes.map((op) => (
                    <button
                      key={op}
                      className={`chip ${
                        filtros.tipos.includes(op) ? "active" : ""
                      }`}
                      onClick={() => toggleMulti("tipos", op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              )}
            </FieldBlock>
          )}

          {/* Subtipo (acessórios) */}
          {subtipoOpcoes && (
            <FieldBlock label="Material / Subtipo">
              <select
                className="filtro-input"
                value={filtros.subtipo}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, subtipo: e.target.value }))
                }
              >
                <option value="">Todos</option>
                {subtipoOpcoes.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </FieldBlock>
          )}

          {/* Tamanhos */}
          {tamanhosDisponiveis && (
            <FieldBlock label="Tamanho">
              <div className="chip-grid">
                {tamanhosDisponiveis.map((t) => (
                  <button
                    key={t}
                    className={`chip chip-compact ${
                      filtros.tamanhos.includes(t) ? "active" : ""
                    }`}
                    onClick={() => toggleMulti("tamanhos", t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </FieldBlock>
          )}

          {/* Cores */}
          {categoriaDef.filtros.cor && (
            <FieldBlock label="Cor">
              <div className="chip-grid">
                {categoriaDef.filtros.cor.opcoes.map((c) => (
                  <button
                    key={c}
                    className={`chip ${
                      filtros.cores.includes(c) ? "active" : ""
                    }`}
                    onClick={() => toggleMulti("cores", c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </FieldBlock>
          )}

          {/* Estampa */}
          {categoriaDef.filtros.estampa && (
            <FieldBlock label="Estampa">
              <div className="chip-grid">
                <button
                  className={`chip ${filtros.estampa === true ? "active" : ""}`}
                  onClick={() =>
                    setFiltros((f) => ({
                      ...f,
                      estampa: f.estampa === true ? null : true,
                    }))
                  }
                >
                  Sim
                </button>
                <button
                  className={`chip ${
                    filtros.estampa === false ? "active" : ""
                  }`}
                  onClick={() =>
                    setFiltros((f) => ({
                      ...f,
                      estampa: f.estampa === false ? null : false,
                    }))
                  }
                >
                  Não
                </button>
              </div>
            </FieldBlock>
          )}

          {/* Faixa de preço */}
          <FieldBlock label="Preço (R$)">
            <div className="filtro-range">
              <input
                type="number"
                className="filtro-input"
                placeholder="Mín."
                value={filtros.precoMin}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, precoMin: e.target.value }))
                }
              />
              <span>–</span>
              <input
                type="number"
                className="filtro-input"
                placeholder="Máx."
                value={filtros.precoMax}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, precoMax: e.target.value }))
                }
              />
            </div>
          </FieldBlock>
        </aside>

        {/* Conteúdo — resultados */}
        <section className="catalogo-resultados">
          <header className="resultados-header">
            <h2 className="resultados-titulo">
              <span className="cat-icon">{categoriaDef.icone}</span>{" "}
              {categoriaDef.label}
              <span className="resultados-count">
                {loading ? "…" : `${produtos.length} produto${
                  produtos.length === 1 ? "" : "s"
                }`}
              </span>
            </h2>

            {/* Dropdown de ordenação: seta para cima = fechado, para baixo = aberto */}
            <div className={`ordenar ${ordemAberta ? "open" : ""}`}>
              <button
                className="ordenar-trigger"
                onClick={() => setOrdemAberta((v) => !v)}
                aria-expanded={ordemAberta}
              >
                {ordemAtual}
                <span className="ordenar-seta" aria-hidden="true">
                  {ordemAberta ? "▼" : "▲"}
                </span>
              </button>
              {ordemAberta && (
                <ul className="ordenar-menu" role="listbox">
                  {ORDENACOES.map((o) => (
                    <li key={o.id}>
                      <button
                        className={`ordenar-item ${
                          filtros.ordenar === o.id ? "active" : ""
                        }`}
                        onClick={() => selecionarOrdem(o.id)}
                      >
                        {o.label}
                      </button>
                    </li>
                  ))}
                  {filtros.ordenar && (
                    <li>
                      <button
                        className="ordenar-item ordenar-limpar"
                        onClick={() => selecionarOrdem("")}
                      >
                        Limpar ordenação
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </header>

          {loading ? (
            <div className="resultados-loading">
              <div className="loading-spinner"></div>
              <p>Carregando produtos...</p>
            </div>
          ) : produtos.length === 0 ? (
            <div className="resultados-vazio">
              <span className="vazio-icon">🛍️</span>
              <p>Nenhum produto encontrado com esses filtros</p>
              <button
                className="vazio-limpar"
                onClick={() => setFiltros(filtrosIniciais())}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="resultados-grid">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="resultados-item"
                  onClick={(e) => {
                    // Não navegar se clicou no botão de adicionar
                    if (e.target.closest(".add-to-cart-btn")) return;
                    navigate(`/produto/${produto.id}`);
                  }}
                >
                  <ProductCard
                    produto={produto}
                    onAddToCart={handleAddToCart}
                    theme={theme}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div className="filtro-bloco">
      <h4 className="filtro-label">{label}</h4>
      {children}
    </div>
  );
}
