import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { getProdutos, listarBannersAtivos } from "../services/api";
import { CATEGORIAS } from "../utils/filtros";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import useTheme from "../hooks/useTheme";
import "../styles/home.css";

export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const destaqueRef = useRef(null);
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addToCart, showToast } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [prodData, bannerData] = await Promise.all([
          getProdutos(),
          listarBannersAtivos().catch(() => []),
        ]);
        setProdutos(Array.isArray(prodData) ? prodData : []);
        setBanners(Array.isArray(bannerData) ? bannerData : []);
      } catch (error) {
        showToast("Erro ao carregar produtos");
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const produtosFiltrados = (produtos || []).filter((p) => {
    const matchBusca = (p.nome || "").toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = !filtroCategoria || p.categoriaId === filtroCategoria;
    return matchBusca && matchCategoria;
  });

  const produtosEmDestaque = produtos.filter((p) => p.destaque);
  const categorias = [...new Set(produtos.map((p) => p.categoriaId))].filter(Boolean);

  const categoriasComDados = CATEGORIAS.filter((cat) => categorias.includes(cat.id));

  const handleAddToCart = (produto) => {
    addToCart(produto);
    showToast(`${produto.nome} adicionado ao carrinho`);
  };

  function scrollDestaque(dir) {
    if (!destaqueRef.current) return;
    const amount = 320;
    destaqueRef.current.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  const bannerAtual = banners[bannerIdx];

  return (
    <div className={`home-page ${theme}`}>
      <Navbar onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} theme={theme} />

      {/* Banner Dinâmico ou Hero padrão */}
      {bannerAtual ? (
        <section
          className="banner-section"
          style={{
            background: bannerAtual.imagemUrl
              ? `url(${bannerAtual.imagemUrl}) center/cover no-repeat`
              : bannerAtual.corFundo,
            color: bannerAtual.corTexto,
          }}
          onClick={() => bannerAtual.linkTo && navigate(bannerAtual.linkTo)}
          role={bannerAtual.linkTo ? "link" : undefined}
        >
          <div className="banner-overlay">
            <h1 className="banner-title">{bannerAtual.titulo}</h1>
            {bannerAtual.subtitulo && <p className="banner-subtitle">{bannerAtual.subtitulo}</p>}
          </div>
          {banners.length > 1 && (
            <div className="banner-dots">
              {banners.map((_, i) => (
                <button
                  key={i}
                  className={`banner-dot ${i === bannerIdx ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-highlight">MAZZA</span> Moda Masculina
            </h1>
            <p className="hero-subtitle">Estilo e elegância para o homem moderno</p>
            <button
              className="hero-cta"
              onClick={() => document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver Coleção
            </button>
          </div>
          <div className="hero-decoration">
            <div className="hero-circle hero-circle-1"></div>
            <div className="hero-circle hero-circle-2"></div>
          </div>
        </section>
      )}

      {/* Categorias com ícones */}
      {categoriasComDados.length > 0 && (
        <section className="categories-strip">
          <div className="categories-scroll">
            {categoriasComDados.map((cat) => (
              <button
                key={cat.id}
                className={`category-chip ${filtroCategoria === cat.id ? "active" : ""}`}
                onClick={() => navigate(`/catalogo/${cat.id}`)}
              >
                <span className="chip-icon">{cat.icone}</span>
                <span className="chip-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Busca e Filtros */}
      <section className="filters-section" id="produtos">
        <div className="filters-container">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {categorias.length > 0 && (
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="category-select"
            >
              <option value="">Todas categorias</option>
              {categorias.map((cat) => {
                const catDef = CATEGORIAS.find((c) => c.id === cat);
                return (
                  <option key={cat} value={cat}>
                    {catDef ? `${catDef.icone} ${catDef.label}` : cat}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </section>

      {/* Destaques — rolagem horizontal */}
      {produtosEmDestaque.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">⭐</span> Em Destaque
            </h2>
            {produtosEmDestaque.length > 3 && (
              <div className="scroll-arrows">
                <button className="scroll-arrow" onClick={() => scrollDestaque(-1)}>‹</button>
                <button className="scroll-arrow" onClick={() => scrollDestaque(1)}>›</button>
              </div>
            )}
          </div>
          <div className="featured-scroll" ref={destaqueRef}>
            {produtosEmDestaque.map((produto) => (
              <div className="featured-card" key={produto.id}>
                <ProductCard
                  produto={produto}
                  onAddToCart={handleAddToCart}
                  theme={theme}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Todos os Produtos */}
      <section className="products-section">
        <div className="section-header">
          <h2 className="section-title">
            {produtosEmDestaque.length > 0 ? "Todos os Produtos" : "Produtos"}
          </h2>
          <span className="products-count">{produtosFiltrados.length} produtos</span>
        </div>

        {loading ? (
          <div className="loading-products">
            <div className="loading-spinner"></div>
            <p>Carregando produtos...</p>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="no-products">
            <span className="no-products-icon">🛍️</span>
            <p>Nenhum produto encontrado</p>
            {busca && (
              <button
                className="clear-filters"
                onClick={() => {
                  setBusca("");
                  setFiltroCategoria("");
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {produtosFiltrados.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                onAddToCart={handleAddToCart}
                theme={theme}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>MAZZA</h3>
            <p>Moda Masculina</p>
          </div>
          <div className="footer-user">
            <p>
              Bem-vindo, <strong>{user?.nome || user?.email}</strong>
            </p>
            {user?.role === "admin" && (
              <button className="admin-link" onClick={() => navigate("/admin")}>
                Painel Admin
              </button>
            )}
          </div>
          <button className="logout-button" onClick={signOut}>
            Sair
          </button>
        </div>
      </footer>
    </div>
  );
}
