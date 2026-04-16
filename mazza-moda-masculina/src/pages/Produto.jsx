import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CategoriaIcone from "../components/CategoriaIcone";
import useTheme from "../hooks/useTheme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  obterProduto,
  listarFavoritosIds,
  adicionarFavorito,
  removerFavorito,
} from "../services/api";
import { CATEGORIAS_POR_ID } from "../utils/filtros";
import "../styles/produto.css";

// Favoritos de visitantes (não autenticados) ficam em localStorage.
// Ao fazer login, a migração para o backend acontece automaticamente.
const FAV_KEY = "mazza:favoritos";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function lerFavoritosLocal() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

function salvarFavoritosLocal(ids) {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

export default function Produto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { addToCart, showToast } = useCart();
  const { user } = useAuth();
  const token = user?.token;

  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [imagemIdx, setImagemIdx] = useState(0);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const data = await obterProduto(id);
        if (data?.erro || data?.error) {
          setErro(data.erro || data.error);
          return;
        }
        setProduto(data);
        // Pré-seleciona primeiro tamanho disponível
        const tams = Array.isArray(data.tamanhos) ? data.tamanhos : [];
        if (tams.length === 1) setTamanhoSelecionado(tams[0]);
      } catch (e) {
        console.error(e);
        setErro("Não foi possível carregar o produto.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  useEffect(() => {
    let cancelado = false;
    async function carregarFav() {
      if (!produto) return;
      if (token) {
        try {
          const ids = await listarFavoritosIds(token);
          if (!cancelado) setFavorito(Array.isArray(ids) && ids.includes(produto.id));
        } catch (e) {
          console.warn("Falha ao listar favoritos:", e.message);
        }
      } else {
        setFavorito(lerFavoritosLocal().includes(produto.id));
      }
    }
    carregarFav();
    return () => {
      cancelado = true;
    };
  }, [produto, token]);

  async function toggleFavorito() {
    if (!produto) return;

    // Sem login — guarda localmente.
    if (!token) {
      const atuais = lerFavoritosLocal();
      let proximos;
      if (atuais.includes(produto.id)) {
        proximos = atuais.filter((x) => x !== produto.id);
        showToast("Removido dos favoritos");
      } else {
        proximos = [...atuais, produto.id];
        showToast("Adicionado aos favoritos");
      }
      salvarFavoritosLocal(proximos);
      setFavorito(proximos.includes(produto.id));
      return;
    }

    // Com login — chama API.
    try {
      if (favorito) {
        await removerFavorito(produto.id, token);
        setFavorito(false);
        showToast("Removido dos favoritos");
      } else {
        await adicionarFavorito(produto.id, token);
        setFavorito(true);
        showToast("Adicionado aos favoritos");
      }
    } catch (e) {
      showToast(e.message || "Erro ao atualizar favorito");
    }
  }

  function handleAddToCart() {
    if (!produto) return;
    const tamanhos = Array.isArray(produto.tamanhos) ? produto.tamanhos : [];
    if (tamanhos.length > 0 && !tamanhoSelecionado) {
      showToast("Selecione um tamanho");
      return;
    }
    addToCart({
      ...produto,
      // CartContext usa `price` em algumas partes — manter compat.
      price: Number(produto.preco || 0),
      tamanho: tamanhoSelecionado,
    });
    showToast(`${produto.nome} adicionado ao carrinho`);
  }

  // Lista de imagens (nova: `imagens[]`; legado: `imagem` string)
  const imagens = (() => {
    if (!produto) return [];
    if (Array.isArray(produto.imagens) && produto.imagens.length)
      return produto.imagens;
    if (produto.imagem) return [produto.imagem];
    return [];
  })();

  const imagemAtual = imagens[imagemIdx];
  const imagemUrl = imagemAtual
    ? `${API_URL}/uploads/${imagemAtual}`
    : "https://picsum.photos/600/800";

  function proximaImagem() {
    if (!imagens.length) return;
    setImagemIdx((i) => (i + 1) % imagens.length);
  }

  function imagemAnterior() {
    if (!imagens.length) return;
    setImagemIdx((i) => (i - 1 + imagens.length) % imagens.length);
  }

  if (loading) {
    return (
      <div className={`produto-page ${theme}`}>
        <Navbar
          onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          theme={theme}
        />
        <div className="produto-status">
          <div className="loading-spinner"></div>
          <p>Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (erro || !produto) {
    return (
      <div className={`produto-page ${theme}`}>
        <Navbar
          onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          theme={theme}
        />
        <div className="produto-status">
          <h2>{erro || "Produto não encontrado"}</h2>
          <button className="produto-voltar" onClick={() => navigate(-1)}>
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const catDef = CATEGORIAS_POR_ID[produto.categoriaId];
  const precoFormatado = Number(produto.preco || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const tamanhos = Array.isArray(produto.tamanhos) ? produto.tamanhos : [];

  return (
    <div className={`produto-page ${theme}`}>
      <Navbar
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        theme={theme}
      />

      <button className="produto-breadcrumb" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <div className="produto-container">
        {/* Galeria de imagens */}
        <div className="produto-galeria">
          <div className="galeria-principal">
            <img
              src={imagemUrl}
              alt={produto.nome}
              className="galeria-img"
            />
            {imagens.length > 1 && (
              <>
                <button
                  className="galeria-seta galeria-seta-prev"
                  onClick={imagemAnterior}
                  aria-label="Imagem anterior"
                >
                  ‹
                </button>
                <button
                  className="galeria-seta galeria-seta-next"
                  onClick={proximaImagem}
                  aria-label="Próxima imagem"
                >
                  ›
                </button>
                <div className="galeria-indicador">
                  {imagemIdx + 1} / {imagens.length}
                </div>
              </>
            )}
          </div>

          {imagens.length > 1 && (
            <div className="galeria-thumbs">
              {imagens.map((img, idx) => (
                <button
                  key={img}
                  className={`galeria-thumb ${
                    idx === imagemIdx ? "active" : ""
                  }`}
                  onClick={() => setImagemIdx(idx)}
                >
                  <img
                    src={`${API_URL}/uploads/${img}`}
                    alt={`${produto.nome} ${idx + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes */}
        <div className="produto-detalhes">
          {catDef && (
            <span className="produto-categoria">
              <CategoriaIcone categoria={catDef.id} size={16} /> {catDef.label}
            </span>
          )}

          <h1 className="produto-nome">{produto.nome}</h1>

          {produto.marca && (
            <span className="produto-marca">Marca: {produto.marca}</span>
          )}

          <div className="produto-preco">R$ {precoFormatado}</div>

          {produto.descricao && (
            <p className="produto-descricao">{produto.descricao}</p>
          )}

          {/* Tamanhos */}
          {tamanhos.length > 0 && (
            <div className="produto-campo">
              <h3 className="campo-label">Tamanho</h3>
              <div className="chip-grid">
                {tamanhos.map((t) => (
                  <button
                    key={t}
                    className={`chip chip-compact ${
                      tamanhoSelecionado === t ? "active" : ""
                    }`}
                    onClick={() => setTamanhoSelecionado(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cores (read-only, já filtradas no produto) */}
          {Array.isArray(produto.cores) && produto.cores.length > 0 && (
            <div className="produto-campo">
              <h3 className="campo-label">
                {produto.cores.length === 1 ? "Cor" : "Cores disponíveis"}
              </h3>
              <div className="chip-grid">
                {produto.cores.map((c) => (
                  <span key={c} className="chip chip-readonly">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Estoque */}
          {produto.estoque !== undefined && (
            <div className="produto-estoque">
              {produto.estoque === 0
                ? "⚠ Esgotado"
                : produto.estoque <= 5
                ? `Apenas ${produto.estoque} em estoque`
                : `Em estoque`}
            </div>
          )}

          {/* Ações */}
          <div className="produto-acoes">
            <button
              className="btn-adicionar"
              onClick={handleAddToCart}
              disabled={produto.estoque === 0}
            >
              🛒 Adicionar ao carrinho
            </button>
            <button
              className={`btn-favorito ${favorito ? "active" : ""}`}
              onClick={toggleFavorito}
              aria-label="Adicionar aos favoritos"
            >
              {favorito ? "♥" : "♡"} Favoritar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
