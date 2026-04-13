import { useState } from "react";
import { useCart } from "../context/CartContext";
import "../styles/product-card.css";

export default function ProductCard({ produto, onAddToCart, theme = "dark" }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const precoFormatado = typeof produto.preco === 'number'
    ? produto.preco.toFixed(2)
    : (produto.preco || '0');

  const handleAddToCart = (e) => {
    setIsAdding(true);
    onAddToCart?.(produto);
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <div
      className={`product-card ${theme}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-wrapper">
        <img
          src={produto.imagem
            ? `http://localhost:5000/uploads/${produto.imagem}`
            : "https://picsum.photos/400/400"}
          alt={produto.nome}
          className="product-image"
        />
        {produto.destaque && (
          <span className="featured-badge">⭐ Destaque</span>
        )}
        {produto.estoque !== undefined && produto.estoque <= 5 && (
          <span className="stock-warning">
            {produto.estoque > 0 ? `Apenas ${produto.estoque} restantes` : 'Esgotado'}
          </span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{produto.nome}</h3>

        <div className="product-price-wrapper">
          <span className="product-price">
            R$ {Number(precoFormatado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <button
          className={`add-to-cart-btn ${isAdding ? 'adding' : ''} ${produto.estoque === 0 ? 'out-of-stock' : ''}`}
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
        >
          {isAdding ? (
            <>
              <span className="btn-check">✓</span>
              <span>Adicionado</span>
            </>
          ) : produto.estoque === 0 ? (
            'Esgotado'
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
