import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { getProdutos } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import useTheme from "../hooks/useTheme";
import "../styles/home.css";

export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addToCart, showToast } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getProdutos();
        setProdutos(Array.isArray(data) ? data : []);
      } catch (error) {
        showToast("Erro ao carregar produtos");
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const produtosFiltrados = (produtos || []).filter(p => {
    const matchBusca = (p.nome || "").toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = !filtroCategoria || p.categoriaId === filtroCategoria;
    return matchBusca && matchCategoria;
  });

  const produtosEmDestaque = produtosFiltrados.filter(p => p.destaque);
  const produtosNormais = produtosFiltrados.filter(p => !p.destaque);

  const categorias = [...new Set(produtos.map(p => p.categoriaId))].filter(Boolean);

  const handleAddToCart = (produto) => {
    addToCart(produto);
    showToast(`${produto.nome} adicionado ao carrinho`);
  };

  return (
    <div className={`home-page ${theme}`}>
      <Navbar onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} theme={theme} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-highlight">MAZZA</span> Moda Masculina
          </h1>
          <p className="hero-subtitle">
            Estilo e elegância para o homem moderno
          </p>
          <button className="hero-cta" onClick={() => document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' })}>
            Ver Coleção
          </button>
        </div>
        <div className="hero-decoration">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
        </div>
      </section>

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
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
      </section>

      {/* Produtos em Destaque */}
      {produtosEmDestaque.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">⭐</span> Em Destaque
            </h2>
          </div>
          <div className="products-grid">
            {produtosEmDestaque.map(produto => (
              <ProductCard
                key={produto.id}
                produto={produto}
                onAddToCart={handleAddToCart}
                theme={theme}
              />
            ))}
          </div>
        </section>
      )}

      {/* Todos os Produtos */}
      <section className="products-section">
        <div className="section-header">
          <h2 className="section-title">
            {produtosEmDestaque.length > 0 ? 'Todos os Produtos' : 'Produtos'}
          </h2>
          <span className="products-count">{produtosNormais.length + produtosEmDestaque.length} produtos</span>
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
              <button className="clear-filters" onClick={() => { setBusca(""); setFiltroCategoria(""); }}>
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {produtosFiltrados.map(produto => (
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
            <p>Bem-vindo, <strong>{user?.nome || user?.email}</strong></p>
            {user?.role === 'admin' && (
              <button className="admin-link" onClick={() => navigate('/admin')}>
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
