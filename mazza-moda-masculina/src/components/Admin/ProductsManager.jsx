import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
import {
  getProdutosAdmin,
  createProduto,
  updateProduto,
  deleteProduto,
  updateEstoque,
} from "../../services/api";
import { CATEGORIAS, CATEGORIAS_POR_ID } from "../../utils/filtros";
import "../../styles/products-manager.css";

const IMG_W = 450;
const IMG_H = 600;

function redimensionarImagem(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      canvas.width = IMG_W;
      canvas.height = IMG_H;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, IMG_W, IMG_H);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Erro ao processar imagem"));
          const resized = new File([blob], file.name, { type: file.type });
          resolve(resized);
        },
        file.type,
        0.92
      );
    };
    img.onerror = () => reject(new Error(`Não foi possível carregar "${file.name}"`));
    img.src = URL.createObjectURL(file);
  });
}

const FORM_INICIAL = {
  nome: "",
  descricao: "",
  preco: "",
  categoriaId: "",
  marca: "",
  tipo: "",
  subtipo: "",
  cores: "",
  tamanhos: "",
  estampa: false,
  destaque: false,
  estoque: "",
};

export default function ProductsManager() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagens, setImagens] = useState([]);
  const [imgError, setImgError] = useState("");
  const [filtroEstoque, setFiltroEstoque] = useState("todos");
  const [busca, setBusca] = useState("");
  const fileRef = useRef();
  const { user } = useAuth();
  const { showToast } = useCart();
  const [formData, setFormData] = useState(FORM_INICIAL);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProdutosAdmin(user.token);
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  const categoriaSelecionada = formData.categoriaId
    ? CATEGORIAS_POR_ID[formData.categoriaId]
    : null;

  function openModal(product = null) {
    setImgError("");
    setImagens([]);
    if (product) {
      setEditingProduct(product);
      setFormData({
        nome: product.nome || "",
        descricao: product.descricao || "",
        preco: product.preco ?? "",
        categoriaId: product.categoriaId || "",
        marca: product.marca || "",
        tipo: product.tipo || "",
        subtipo: product.subtipo || "",
        cores: Array.isArray(product.cores) ? product.cores.join(", ") : product.cores || "",
        tamanhos: Array.isArray(product.tamanhos) ? product.tamanhos.join(", ") : product.tamanhos || "",
        estampa: product.estampa || false,
        destaque: product.destaque || false,
        estoque: product.estoque ?? "",
      });
    } else {
      setEditingProduct(null);
      setFormData(FORM_INICIAL);
    }
    setShowModal(true);
  }

  async function handleImageChange(e) {
    const files = Array.from(e.target.files);
    setImgError("");

    try {
      const redimensionadas = await Promise.all(files.map(redimensionarImagem));
      setImagens(redimensionadas);
    } catch (err) {
      setImgError(err.message || "Erro ao processar imagem.");
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const produtoData = {
        ...formData,
        preco: parseFloat(formData.preco),
        estoque: parseInt(formData.estoque) || 0,
      };

      if (editingProduct) {
        await updateProduto(editingProduct.id, produtoData, user.token);
        showToast("Produto atualizado com sucesso!");
      } else {
        if (imagens.length) {
          produtoData.imagens = imagens;
        }
        await createProduto(produtoData, user.token);
        showToast("Produto criado com sucesso!");
      }

      setShowModal(false);
      loadProducts();
    } catch (error) {
      showToast(error.message || "Erro ao salvar produto");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja deletar este produto?")) return;
    try {
      await deleteProduto(id, user.token);
      showToast("Produto deletado!");
      loadProducts();
    } catch (error) {
      showToast("Erro ao deletar produto");
    }
  }

  async function toggleDestaque(produto) {
    try {
      await updateProduto(produto.id, { destaque: !produto.destaque }, user.token);
      showToast(produto.destaque ? "Destaque removido" : "Produto em destaque!");
      loadProducts();
    } catch (error) {
      showToast("Erro ao atualizar destaque");
    }
  }

  async function handleEstoqueInline(produto, delta) {
    const novoEstoque = Math.max(0, (produto.estoque || 0) + delta);
    try {
      await updateEstoque(produto.id, novoEstoque, user.token);
      loadProducts();
    } catch (error) {
      showToast("Erro ao atualizar estoque");
    }
  }

  const produtosFiltrados = produtos.filter((p) => {
    if (filtroEstoque === "sem-estoque" && (p.estoque ?? 1) > 0) return false;
    if (filtroEstoque === "baixo" && (p.estoque ?? 99) > 5) return false;
    if (filtroEstoque === "em-estoque" && (p.estoque ?? 1) <= 0) return false;
    if (busca) {
      const q = busca.toLowerCase();
      if (
        !(p.nome || "").toLowerCase().includes(q) &&
        !(p.categoriaId || "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const totalVendidos = produtos.reduce((s, p) => s + (p.vendidos || 0), 0);
  const semEstoque = produtos.filter((p) => (p.estoque ?? 1) === 0).length;
  const baixoEstoque = produtos.filter((p) => (p.estoque ?? 99) > 0 && (p.estoque ?? 99) <= 5).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="products-manager">
      <div className="manager-header">
        <div className="header-info">
          <h3>Gestão de Produtos</h3>
          <p className="count">
            {produtos.length} produtos &middot; {totalVendidos} vendidos &middot;{" "}
            <span className="text-warning">{baixoEstoque} baixo estoque</span> &middot;{" "}
            <span className="text-danger">{semEstoque} sem estoque</span>
          </p>
        </div>
        <button className="add-btn" onClick={() => openModal()}>
          <span className="btn-icon">+</span>
          Novo Produto
        </button>
      </div>

      <div className="manager-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nome ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="filter-select"
          value={filtroEstoque}
          onChange={(e) => setFiltroEstoque(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="em-estoque">Em estoque</option>
          <option value="baixo">Baixo estoque (≤5)</option>
          <option value="sem-estoque">Sem estoque (ocultos)</option>
        </select>
      </div>

      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Preço</th>
              <th>Categoria</th>
              <th>Estoque</th>
              <th>Vendidos</th>
              <th>Destaque</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-products">
                  <span className="icon">📦</span>
                  <p>Nenhum produto encontrado</p>
                </td>
              </tr>
            ) : (
              produtosFiltrados.map((produto) => (
                <tr key={produto.id} className={produto.estoque === 0 ? "row-sem-estoque" : ""}>
                  <td>
                    <div className="product-cell">
                      <img
                        src={
                          produto.imagem
                            ? `${API_URL}/uploads/${produto.imagem}`
                            : "https://picsum.photos/50"
                        }
                        alt={produto.nome}
                        className="product-thumb"
                      />
                      <div>
                        <span className="product-name">{produto.nome}</span>
                        {produto.estoque === 0 && (
                          <span className="badge-oculto">Oculto da vitrine</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="price">
                    R$ {typeof produto.preco === "number" ? produto.preco.toFixed(2) : "0.00"}
                  </td>
                  <td>{produto.categoriaId || "-"}</td>
                  <td>
                    <div className="estoque-inline">
                      <button className="estoque-btn" onClick={() => handleEstoqueInline(produto, -1)}>−</button>
                      <span
                        className={`stock-badge ${
                          produto.estoque <= 5 ? "low" : ""
                        } ${produto.estoque === 0 ? "out" : ""}`}
                      >
                        {produto.estoque !== undefined ? produto.estoque : "∞"}
                      </span>
                      <button className="estoque-btn" onClick={() => handleEstoqueInline(produto, 1)}>+</button>
                    </div>
                  </td>
                  <td className="vendidos">{produto.vendidos || 0}</td>
                  <td>
                    <button
                      className={`toggle-destaque ${produto.destaque ? "active" : ""}`}
                      onClick={() => toggleDestaque(produto)}
                    >
                      {produto.destaque ? "⭐" : "☆"}
                    </button>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="edit-btn" onClick={() => openModal(produto)}>
                        ✏️
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(produto.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? "Editar Produto" : "Novo Produto"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nome do Produto</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Camisa Polo Premium"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do produto..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Estoque</label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={formData.categoriaId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoriaId: e.target.value, tipo: "", subtipo: "" })
                    }
                    required
                  >
                    <option value="">Selecione...</option>
                    {CATEGORIAS.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icone} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ex: Nike"
                  />
                </div>
              </div>

              {categoriaSelecionada?.filtros?.tipo && (
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value, subtipo: "" })}
                  >
                    <option value="">Selecione...</option>
                    {categoriaSelecionada.filtros.tipo.opcoes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {categoriaSelecionada?.filtros?.subtipo?.subtipoPor?.[formData.tipo] && (
                <div className="form-group">
                  <label>Subtipo</label>
                  <select
                    value={formData.subtipo}
                    onChange={(e) => setFormData({ ...formData, subtipo: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {categoriaSelecionada.filtros.subtipo.subtipoPor[formData.tipo].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Cores (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={formData.cores}
                    onChange={(e) => setFormData({ ...formData, cores: e.target.value })}
                    placeholder="Azul, Preto, Branco"
                  />
                </div>
                <div className="form-group">
                  <label>Tamanhos (separados por vírgula)</label>
                  <input
                    type="text"
                    value={formData.tamanhos}
                    onChange={(e) => setFormData({ ...formData, tamanhos: e.target.value })}
                    placeholder="P, M, G, GG"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="form-group">
                  <label>Imagens (redimensionado automaticamente para {IMG_W}x{IMG_H}px)</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    onChange={handleImageChange}
                  />
                  {imgError && <p className="field-error">{imgError}</p>}
                </div>
              )}

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.estampa}
                      onChange={(e) => setFormData({ ...formData, estampa: e.target.checked })}
                    />
                    <span>Com estampa</span>
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.destaque}
                      onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                    />
                    <span>Marcar como destaque</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  {editingProduct ? "Salvar Alterações" : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
