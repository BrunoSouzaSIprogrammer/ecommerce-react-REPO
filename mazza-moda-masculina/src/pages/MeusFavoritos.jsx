import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useTheme from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
import { listarFavoritos, removerFavorito } from "../services/api";
import "../styles/meus-favoritos.css";

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function MeusFavoritos() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!user?.token) {
      navigate("/login");
      return;
    }
    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const data = await listarFavoritos(user.token);
        setFavoritos(Array.isArray(data) ? data : []);
      } catch (err) {
        setErro(err.message || "Erro ao carregar favoritos");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.token, navigate]);

  async function handleRemover(produtoId) {
    if (!user?.token) return;
    try {
      await removerFavorito(produtoId, user.token);
      setFavoritos((prev) => prev.filter((p) => p.id !== produtoId));
    } catch (err) {
      alert(err.message || "Erro ao remover favorito");
    }
  }

  return (
    <div className="meus-favoritos-page">
      <Navbar
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        theme={theme}
      />

      <div className="container meus-favoritos-container">
        <header className="meus-favoritos-header">
          <h1>Meus favoritos</h1>
          <p>Produtos que você salvou para ver depois.</p>
        </header>

        {loading && <div className="favoritos-info">Carregando...</div>}
        {erro && <div className="favoritos-erro">{erro}</div>}

        {!loading && !erro && favoritos.length === 0 && (
          <div className="favoritos-vazio">
            <p>Você ainda não favoritou nenhum produto.</p>
            <button className="btn-primary" onClick={() => navigate("/catalogo")}>
              Explorar catálogo
            </button>
          </div>
        )}

        {!loading && favoritos.length > 0 && (
          <div className="favoritos-grid">
            {favoritos.map((p) => {
              const indisponivel = p.estoque === 0;
              const imagens = Array.isArray(p.imagens) ? p.imagens : [];
              const primeiraImg = imagens[0] || p.imagem;
              const imagemUrl = primeiraImg
                ? `${API_URL}/uploads/${primeiraImg}`
                : "https://picsum.photos/400/500";

              return (
                <div key={p.id} className="favorito-card">
                  <button
                    className="favorito-remover"
                    onClick={() => handleRemover(p.id)}
                    aria-label="Remover dos favoritos"
                    title="Remover dos favoritos"
                  >
                    ♥
                  </button>
                  <div
                    className="favorito-img-wrap"
                    onClick={() => navigate(`/produto/${p.id}`)}
                  >
                    <img
                      src={imagemUrl}
                      alt={p.nome}
                      className="favorito-img"
                    />
                    {indisponivel && (
                      <span className="favorito-badge">Esgotado</span>
                    )}
                  </div>
                  <div className="favorito-info">
                    <h3 className="favorito-nome">{p.nome}</h3>
                    {p.preco !== undefined && (
                      <div className="favorito-preco">
                        {formatBRL(p.preco)}
                      </div>
                    )}
                    <div className="favorito-acoes">
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/produto/${p.id}`)}
                      >
                        Ver produto
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
