import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { getProdutos } from "../services/api";
import { CATEGORIAS_POR_ID, CORES, ORDENACOES } from "../utils/filtros";
import { useCart } from "../context/CartContext";
import useTheme from "../hooks/useTheme";
import "../styles/busca.css";

const CATEGORIAS_PRINCIPAIS = [
  "camisetas",
  "blusas",
  "calcas",
  "bermudas",
  "shorts",
  "calcados",
  "bones",
  "acessorios",
];

function tamanhosDaCategoria(cat) {
  if (!cat?.filtros?.tamanho) return [];
  return cat.filtros.tamanho.opcoes || [];
}

function tiposDaCategoria(cat) {
  if (!cat?.filtros?.tipo) return [];
  return cat.filtros.tipo.opcoes || [];
}

export default function Busca() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { addToCart, showToast } = useCart();

  const [busca, setBusca] = useState(searchParams.get("q") || "");
  const [categoria, setCategoria] = useState(searchParams.get("cat") || "");
  const [marca, setMarca] = useState("");
  const [tamanhos, setTamanhos] = useState([]);
  const [cores, setCores] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [somenteEstampa, setSomenteEstampa] = useState(false);
  const [ordem, setOrdem] = useState("mais-vendidos");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getProdutos();
        setProdutos(Array.isArray(data) ? data : []);
      } catch {
        showToast("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = {};
    if (busca) params.q = busca;
    if (categoria) params.cat = categoria;
    setSearchParams(params, { replace: true });
  }, [busca, categoria, setSearchParams]);

  const catAtual = CATEGORIAS_POR_ID[categoria];
  const tamanhosDisponiveis = useMemo(() => tamanhosDaCategoria(catAtual), [catAtual]);
  const tiposDisponiveis = useMemo(() => tiposDaCategoria(catAtual), [catAtual]);
  const temEstampa = !!catAtual?.filtros?.estampa;

  // quando mudar categoria, limpa filtros dependentes
  useEffect(() => {
    setTamanhos([]);
    setTipos([]);
    setSomenteEstampa(false);
  }, [categoria]);

  function toggleItem(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function limparFiltros() {
    setBusca("");
    setCategoria("");
    setMarca("");
    setTamanhos([]);
    setCores([]);
    setTipos([]);
    setSomenteEstampa(false);
    setOrdem("mais-vendidos");
  }

  const resultados = useMemo(() => {
    let list = produtos.filter((p) => {
      if (busca) {
        const q = busca.toLowerCase();
        const hay = `${p.nome || ""} ${p.marca || ""} ${p.descricao || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoria && p.categoriaId !== categoria) return false;
      if (marca && !(p.marca || "").toLowerCase().includes(marca.toLowerCase())) return false;
      if (tamanhos.length) {
        const pSizes = Array.isArray(p.tamanhos) ? p.tamanhos : [];
        if (!tamanhos.some((t) => pSizes.includes(t))) return false;
      }
      if (cores.length) {
        const pCores = Array.isArray(p.cores) ? p.cores : [];
        if (!cores.some((c) => pCores.includes(c))) return false;
      }
      if (tipos.length) {
        if (!tipos.includes(p.tipo)) return false;
      }
      if (somenteEstampa && !p.estampa) return false;
      return true;
    });

    if (ordem === "menor-preco") list = [...list].sort((a, b) => (a.preco || 0) - (b.preco || 0));
    else if (ordem === "maior-preco") list = [...list].sort((a, b) => (b.preco || 0) - (a.preco || 0));
    else if (ordem === "mais-vendidos") list = [...list].sort((a, b) => (b.vendidos || 0) - (a.vendidos || 0));

    return list;
  }, [produtos, busca, categoria, marca, tamanhos, cores, tipos, somenteEstampa, ordem]);

  const handleAddToCart = (produto) => {
    addToCart(produto);
    showToast(`${produto.nome} adicionado ao carrinho`);
  };

  return (
    <div className={`busca-page ${theme}`}>
      <Navbar onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} theme={theme} />

      {/* Header de busca */}
      <section className="busca-header">
        <div className="busca-input-wrapper">
          <span className="busca-input-icon">🔍</span>
          <input
            type="text"
            autoFocus
            className="busca-input"
            placeholder="Pesquisar produtos, marcas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button className="busca-clear" onClick={() => setBusca("")}>×</button>
          )}
        </div>
        <div className="busca-meta">
          <span>{loading ? "Carregando..." : `${resultados.length} resultado(s)`}</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="busca-select">
            {ORDENACOES.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Tira de categorias */}
      <section className="busca-categorias">
        <button
          className={`cat-chip ${!categoria ? "active" : ""}`}
          onClick={() => setCategoria("")}
        >
          <span className="chip-icon">✨</span> Todas
        </button>
        {CATEGORIAS_PRINCIPAIS.map((id) => {
          const cat = CATEGORIAS_POR_ID[id];
          if (!cat) return null;
          return (
            <button
              key={cat.id}
              className={`cat-chip ${categoria === cat.id ? "active" : ""}`}
              onClick={() => setCategoria(cat.id)}
            >
              <span className="chip-icon">{cat.icone}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </section>

      {/* Corpo: sidebar + resultados */}
      <div className="busca-body">
        <aside className="busca-sidebar">
          <div className="filter-header">
            <h3>Filtros</h3>
            <button className="filter-clear" onClick={limparFiltros}>Limpar</button>
          </div>

          <div className="filter-group">
            <label className="filter-label">Marca</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Ex.: Nike"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />
          </div>

          {tamanhosDisponiveis.length > 0 && (
            <div className="filter-group">
              <label className="filter-label">Tamanho</label>
              <div className="filter-chips">
                {tamanhosDisponiveis.map((t) => (
                  <button
                    key={t}
                    className={`filter-chip ${tamanhos.includes(t) ? "on" : ""}`}
                    onClick={() => toggleItem(tamanhos, setTamanhos, t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-group">
            <label className="filter-label">Cor</label>
            <div className="filter-chips">
              {CORES.map((c) => (
                <button
                  key={c}
                  className={`filter-chip ${cores.includes(c) ? "on" : ""}`}
                  onClick={() => toggleItem(cores, setCores, c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {tiposDisponiveis.length > 0 && (
            <div className="filter-group">
              <label className="filter-label">Tipo</label>
              <div className="filter-list">
                {tiposDisponiveis.map((t) => (
                  <label key={t} className="filter-check">
                    <input
                      type="checkbox"
                      checked={tipos.includes(t)}
                      onChange={() => toggleItem(tipos, setTipos, t)}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {temEstampa && (
            <div className="filter-group">
              <label className="filter-check">
                <input
                  type="checkbox"
                  checked={somenteEstampa}
                  onChange={(e) => setSomenteEstampa(e.target.checked)}
                />
                <span>Somente com estampa</span>
              </label>
            </div>
          )}
        </aside>

        <section className="busca-resultados">
          {loading ? (
            <div className="busca-loading">
              <div className="busca-spinner"></div>
              <p>Carregando...</p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="busca-vazio">
              <span className="vazio-icon">🔎</span>
              <p>Nenhum produto encontrado</p>
              <button className="vazio-btn" onClick={limparFiltros}>Limpar filtros</button>
            </div>
          ) : (
            <div className="busca-grid">
              {resultados.map((p) => (
                <ProductCard
                  key={p.id}
                  produto={p}
                  onAddToCart={handleAddToCart}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
