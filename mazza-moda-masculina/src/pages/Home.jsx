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

export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catsOpen, setCatsOpen] = useState(false);
  const catsRef = useRef(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (catsRef.current && !catsRef.current.contains(e.target)) setCatsOpen(false);
    }
    if (catsOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [catsOpen]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const produtosEmDestaque = produtos.filter((p) => p.destaque);

  const categoriasDisponiveis = CATEGORIAS.filter((c) =>
    CATEGORIAS_PRINCIPAIS.includes(c.id)
  );

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
          </div>
        </section>
      )}

      {/* Busca + Categorias lado a lado */}
      <section className="discover-bar">
        <button
          type="button"
          className="discover-search"
          onClick={() => navigate("/busca")}
        >
          <span className="discover-search-icon">🔍</span>
          <span className="discover-search-text">Pesquisar produtos, marcas...</span>
        </button>

        <div className="discover-cats-wrapper" ref={catsRef}>
          <button
            type="button"
            className={`discover-cats-toggle ${catsOpen ? "open" : ""}`}
            onClick={() => setCatsOpen((v) => !v)}
            aria-expanded={catsOpen}
          >
            <span className="discover-cats-icon">🗂️</span>
            <span className="discover-cats-label">Categorias</span>
            <span className={`discover-cats-caret ${catsOpen ? "up" : ""}`}>▾</span>
          </button>
          {catsOpen && (
            <div className="discover-cats-panel" role="menu">
              {categoriasDisponiveis.map((cat) => (
                <button
                  key={cat.id}
                  className="discover-cat-item"
                  role="menuitem"
                  onClick={() => {
                    setCatsOpen(false);
                    navigate(`/catalogo/${cat.id}`);
                  }}
                >
                  <span className="discover-cat-icon">{cat.icone}</span>
                  <span className="discover-cat-label">{cat.label}</span>
                </button>
              ))}
            </div>
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
      <section className="products-section" id="produtos">
        <div className="section-header">
          <h2 className="section-title">Todos os Produtos</h2>
          <span className="products-count">{produtos.length} produtos</span>
        </div>

        {loading ? (
          <div className="loading-products">
            <div className="loading-spinner"></div>
            <p>Carregando produtos...</p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="no-products">
            <span className="no-products-icon">🛍️</span>
            <p>Nenhum produto disponível</p>
          </div>
        ) : (
          <div className="products-grid">
            {produtos.map((produto) => (
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
