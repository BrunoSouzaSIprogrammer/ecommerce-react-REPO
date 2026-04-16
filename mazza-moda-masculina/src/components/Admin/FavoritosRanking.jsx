import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { rankingFavoritos } from "../../services/api";
import "../../styles/admin-favoritos.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FavoritosRanking() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (!user?.token) return;
    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const data = await rankingFavoritos(user.token, limit);
        setRanking(Array.isArray(data) ? data : []);
      } catch (err) {
        setErro(err.message || "Erro ao carregar ranking");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.token, limit]);

  return (
    <div className="favoritos-ranking">
      <div className="ranking-header">
        <div>
          <h3>Produtos mais favoritados</h3>
          <p className="ranking-sub">
            Use estes dados para decidir promoções e reposição de estoque.
          </p>
        </div>
        <div className="ranking-controls">
          <label>
            Top{" "}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      {loading && <div className="ranking-info">Carregando...</div>}
      {erro && <div className="ranking-erro">{erro}</div>}

      {!loading && !erro && ranking.length === 0 && (
        <div className="ranking-vazio">
          Nenhum produto foi favoritado ainda.
        </div>
      )}

      {!loading && ranking.length > 0 && (
        <div className="ranking-grid">
          {ranking.map((item, idx) => {
            const p = item.produto;
            const imagens = Array.isArray(p?.imagens) ? p.imagens : [];
            const primeiraImg = imagens[0] || p?.imagem;
            const imagemUrl = primeiraImg
              ? `${API_URL}/uploads/${primeiraImg}`
              : "https://picsum.photos/200/260";

            return (
              <div key={item.produtoId} className="ranking-card">
                <div className="ranking-posicao">#{idx + 1}</div>
                <div className="ranking-img-wrap">
                  <img
                    src={imagemUrl}
                    alt={p?.nome || "Produto"}
                    className="ranking-img"
                  />
                </div>
                <div className="ranking-info-bloco">
                  <h4 className="ranking-nome">
                    {p?.nome || "Produto removido"}
                  </h4>
                  {p?.preco !== undefined && (
                    <div className="ranking-preco">{formatBRL(p.preco)}</div>
                  )}
                  {p?.estoque !== undefined && (
                    <div className="ranking-estoque">
                      Estoque:{" "}
                      <strong
                        className={
                          p.estoque === 0
                            ? "estoque-zero"
                            : p.estoque <= 5
                            ? "estoque-baixo"
                            : ""
                        }
                      >
                        {p.estoque}
                      </strong>
                    </div>
                  )}
                  <div className="ranking-count">
                    <span className="coracao">♥</span> {item.total}{" "}
                    {item.total === 1 ? "favorito" : "favoritos"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
