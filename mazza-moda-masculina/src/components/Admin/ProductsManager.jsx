import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getProdutos, createProduto, updateProduto, deleteProduto } from "../../services/api";
import "../../styles/products-manager.css";

export default function ProductsManager() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { user } = useAuth();
  const { showToast } = useCart();

  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    categoriaId: "",
    estoque: "",
    destaque: false
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProdutos();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  function openModal(product = null) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nome: product.nome || "",
        preco: product.preco || "",
        categoriaId: product.categoriaId || "",
        estoque: product.estoque || "",
        destaque: product.destaque || false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nome: "",
        preco: "",
        categoriaId: "",
        estoque: "",
        destaque: false
      });
    }
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const produtoData = {
        ...formData,
        preco: parseFloat(formData.preco),
        estoque: parseInt(formData.estoque) || 0
      };

      if (editingProduct) {
        await updateProduto(editingProduct.id, produtoData, user.token);
        showToast("Produto atualizado com sucesso!");
      } else {
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
      showToast("Produto deletado com sucesso!");
      loadProducts();
    } catch (error) {
      showToast("Erro ao deletar produto");
    }
  }

  async function toggleDestaque(produto) {
    try {
      await updateProduto(produto.id, { ...produto, destaque: !produto.destaque }, user.token);
      showToast(produto.destaque ? "Destaque removido" : "Produto em destaque!");
      loadProducts();
    } catch (error) {
      showToast("Erro ao atualizar destaque");
    }
  }

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
      {/* Header */}
      <div className="manager-header">
        <div className="header-info">
          <h3>Total de Produtos</h3>
          <p className="count">{produtos.length} produtos cadastrados</p>
        </div>
        <button className="add-btn" onClick={() => openModal()}>
          <span className="btn-icon">+</span>
          Novo Produto
        </button>
      </div>

      {/* Products Table */}
      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Preço</th>
              <th>Categoria</th>
              <th>Estoque</th>
              <th>Destaque</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-products">
                  <span className="icon">📦</span>
                  <p>Nenhum produto cadastrado</p>
                </td>
              </tr>
            ) : (
              produtos.map(produto => (
                <tr key={produto.id}>
                  <td>
                    <div className="product-cell">
                      <img
                        src={produto.imagem
                          ? `http://localhost:5000/uploads/${produto.imagem}`
                          : "https://picsum.photos/50"}
                        alt={produto.nome}
                        className="product-thumb"
                      />
                      <span className="product-name">{produto.nome}</span>
                    </div>
                  </td>
                  <td className="price">
                    R$ {typeof produto.preco === 'number'
                      ? produto.preco.toFixed(2)
                      : '0.00'}
                  </td>
                  <td>{produto.categoriaId || "-"}</td>
                  <td>
                    <span className={`stock-badge ${produto.estoque <= 5 ? 'low' : ''} ${produto.estoque === 0 ? 'out' : ''}`}>
                      {produto.estoque !== undefined ? produto.estoque : '∞'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`toggle-destaque ${produto.destaque ? 'active' : ''}`}
                      onClick={() => toggleDestaque(produto)}
                    >
                      {produto.destaque ? '⭐' : '☆'}
                    </button>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="edit-btn"
                        onClick={() => openModal(produto)}
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(produto.id)}
                      >
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nome do Produto</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Camisa Social"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={e => setFormData({ ...formData, preco: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Estoque</label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={e => setFormData({ ...formData, estoque: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <input
                  type="text"
                  value={formData.categoriaId}
                  onChange={e => setFormData({ ...formData, categoriaId: e.target.value })}
                  placeholder="Ex: Camisas"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.destaque}
                    onChange={e => setFormData({ ...formData, destaque: e.target.checked })}
                  />
                  <span>Marcar como destaque</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
