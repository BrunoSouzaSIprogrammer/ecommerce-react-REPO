import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/product-card.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ProductCard({ produto, onAddToCart, theme = "dark" }) {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const imagens = useMemo(() => {
    if (Array.isArray(produto.imagens) && produto.imagens.length) {
      return produto.imagens;
    }
    if (produto.imagem) return [produto.imagem];
    return [];
  }, [produto.imagens, produto.imagem]);

  const temMultiplas = imagens.length > 1;
  const imagemAtual = imagens[imgIdx] || null;

  const precoFormatado =
    typeof produto.preco === "number"
      ? produto.preco.toFixed(2)
      : produto.preco || "0";

  const handleNavegar = () => {
    navigate(`/produto/${produto.id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    setIsAdding(true);
    onAddToCart?.(produto);
    setTimeout(() => setIsAdding(false), 500);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + imagens.length) % imagens.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % imagens.length);
  };

  return (
    <div className={`product-card ${theme}`}>
      <div
        className="product-image-wrapper product-image-clickable"
        onClick={handleNavegar}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleNavegar();
        }}
      >
        <img
          src={
            imagemAtual
              ? `${API_URL}/uploads/${imagemAtual}`
              : "https://picsum.photos/400/400"
          }
          alt={produto.nome}
          className="product-image"
        />

        {temMultiplas && (
          <>
            <button
              type="button"
              className="product-arrow product-arrow-left"
              onClick={handlePrev}
              aria-label="Imagem anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="product-arrow product-arrow-right"
              onClick={handleNext}
              aria-label="Próxima imagem"
            >
              ›
            </button>
            <div className="product-dots" onClick={(e) => e.stopPropagation()}>
              {imagens.map((_, i) => (
                <span
                  key={i}
                  className={`product-dot ${i === imgIdx ? "active" : ""}`}
                />
              ))}
            </div>
          </>
        )}

        {produto.destaque && (
          <span className="featured-badge">⭐ Destaque</span>
        )}
        {produto.estoque !== undefined && produto.estoque <= 5 && (
          <span className="stock-warning">
            {produto.estoque > 0
              ? `Apenas ${produto.estoque} restantes`
              : "Esgotado"}
          </span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name" onClick={handleNavegar}>
          {produto.nome}
        </h3>

        <div className="product-price-wrapper">
          <span className="product-price">
            R${" "}
            {Number(precoFormatado).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        <button
          className={`add-to-cart-btn ${isAdding ? "adding" : ""} ${
            produto.estoque === 0 ? "out-of-stock" : ""
          }`}
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
        >
          {isAdding ? (
            <>
              <span className="btn-check">✓</span>
              <span>Adicionado</span>
            </>
          ) : produto.estoque === 0 ? (
            "Esgotado"
          ) : (
            <>
              <span className="btn-cart-icon">🛒</span>
              <span>Adicionar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
