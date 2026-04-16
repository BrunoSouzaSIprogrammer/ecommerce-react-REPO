import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  listarBannersAdmin,
  criarBanner,
  atualizarBanner,
  deletarBanner,
} from "../../services/api";
import "../../styles/admin-banners.css";

const FORM_INICIAL = {
  titulo: "",
  subtitulo: "",
  imagemUrl: "",
  linkTo: "",
  corFundo: "#0a0a0a",
  corTexto: "#ffffff",
};

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const { user } = useAuth();
  const { showToast } = useCart();

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      setLoading(true);
      const data = await listarBannersAdmin(user.token);
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Erro ao carregar banners");
    } finally {
      setLoading(false);
    }
  }

  function openModal(banner = null) {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        titulo: banner.titulo || "",
        subtitulo: banner.subtitulo || "",
        imagemUrl: banner.imagemUrl || "",
        linkTo: banner.linkTo || "",
        corFundo: banner.corFundo || "#0a0a0a",
        corTexto: banner.corTexto || "#ffffff",
      });
    } else {
      setEditingBanner(null);
      setFormData(FORM_INICIAL);
    }
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingBanner) {
        await atualizarBanner(editingBanner.id, formData, user.token);
        showToast("Banner atualizado!");
      } else {
        await criarBanner(formData, user.token);
        showToast("Banner criado!");
      }
      setShowModal(false);
      loadBanners();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Deletar este banner?")) return;
    try {
      await deletarBanner(id, user.token);
      showToast("Banner deletado");
      loadBanners();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleToggleAtivo(banner) {
    try {
      await atualizarBanner(banner.id, { ativo: !banner.ativo }, user.token);
      showToast(banner.ativo ? "Banner desativado" : "Banner ativado");
      loadBanners();
    } catch (error) {
      showToast(error.message);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando banners...</p>
      </div>
    );
  }

  return (
    <div className="banner-manager">
      <div className="manager-header">
        <div className="header-info">
          <h3>Banners da Home</h3>
          <p className="count">
            {banners.length} banners &middot;{" "}
            {banners.filter((b) => b.ativo).length} ativos
          </p>
        </div>
        <button className="add-btn" onClick={() => openModal()}>
          <span className="btn-icon">+</span>
          Novo Banner
        </button>
      </div>

      <div className="banners-grid">
        {banners.length === 0 ? (
          <div className="no-products">
            <p>Nenhum banner criado. Crie o primeiro!</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className={`banner-card ${!banner.ativo ? "inativo" : ""}`}
            >
              <div
                className="banner-preview"
                style={{
                  background: banner.imagemUrl
                    ? `url(${banner.imagemUrl}) center/cover`
                    : banner.corFundo,
                  color: banner.corTexto,
                }}
              >
                <h4>{banner.titulo}</h4>
                {banner.subtitulo && <p>{banner.subtitulo}</p>}
              </div>
              <div className="banner-card-footer">
                <div className="banner-meta">
                  <span className={`status-dot ${banner.ativo ? "ativo" : ""}`}></span>
                  <span>{banner.ativo ? "Ativo" : "Inativo"}</span>
                  {banner.linkTo && (
                    <span className="banner-link-info">→ {banner.linkTo}</span>
                  )}
                </div>
                <div className="actions">
                  <button
                    className={`toggle-btn ${banner.ativo ? "on" : "off"}`}
                    onClick={() => handleToggleAtivo(banner)}
                    title={banner.ativo ? "Desativar" : "Ativar"}
                  >
                    {banner.ativo ? "●" : "○"}
                  </button>
                  <button className="edit-btn" onClick={() => openModal(banner)}>
                    ✏️
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(banner.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingBanner ? "Editar Banner" : "Novo Banner"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Nova Coleção Verão 2026"
                  required
                />
              </div>
              <div className="form-group">
                <label>Subtítulo</label>
                <input
                  type="text"
                  value={formData.subtitulo}
                  onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  placeholder="Ex: Até 30% de desconto"
                />
              </div>
              <div className="form-group">
                <label>URL da Imagem (opcional)</label>
                <input
                  type="text"
                  value={formData.imagemUrl}
                  onChange={(e) => setFormData({ ...formData, imagemUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Link (para onde o banner leva)</label>
                <input
                  type="text"
                  value={formData.linkTo}
                  onChange={(e) => setFormData({ ...formData, linkTo: e.target.value })}
                  placeholder="Ex: /catalogo/camisetas"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cor de Fundo</label>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      value={formData.corFundo}
                      onChange={(e) => setFormData({ ...formData, corFundo: e.target.value })}
                    />
                    <input
                      type="text"
                      value={formData.corFundo}
                      onChange={(e) => setFormData({ ...formData, corFundo: e.target.value })}
                      className="color-text"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Cor do Texto</label>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      value={formData.corTexto}
                      onChange={(e) => setFormData({ ...formData, corTexto: e.target.value })}
                    />
                    <input
                      type="text"
                      value={formData.corTexto}
                      onChange={(e) => setFormData({ ...formData, corTexto: e.target.value })}
                      className="color-text"
                    />
                  </div>
                </div>
              </div>

              <div className="banner-form-preview">
                <p className="preview-label">Preview</p>
                <div
                  className="banner-preview"
                  style={{
                    background: formData.imagemUrl
                      ? `url(${formData.imagemUrl}) center/cover`
                      : formData.corFundo,
                    color: formData.corTexto,
                  }}
                >
                  <h4>{formData.titulo || "Título do Banner"}</h4>
                  {formData.subtitulo && <p>{formData.subtitulo}</p>}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  {editingBanner ? "Salvar" : "Criar Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
