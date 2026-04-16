import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { listarUsuarios, alterarRoleUsuario, desativarUsuario } from "../../services/api";
import "../../styles/admin-users.css";

const ADMIN_MASTER_EMAIL = "jackfrostbr3210@gmail.com";

export default function UsersManager() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const { user } = useAuth();
  const { showToast } = useCart();

  const isMaster = user?.email === ADMIN_MASTER_EMAIL;

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await listarUsuarios(user.token);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRole(u) {
    const novoRole = u.role === "admin" ? "user" : "admin";
    const msg = novoRole === "admin"
      ? `Promover "${u.nome || u.email}" a administrador?`
      : `Rebaixar "${u.nome || u.email}" para usuário comum?`;

    if (!window.confirm(msg)) return;

    try {
      await alterarRoleUsuario(u.id, novoRole, user.token);
      showToast(`${u.nome || u.email} agora é ${novoRole === "admin" ? "administrador" : "usuário"}`);
      loadUsers();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleDesativar(u) {
    if (!window.confirm(`Desativar "${u.nome || u.email}"? O usuário não poderá fazer login.`)) return;
    try {
      await desativarUsuario(u.id, user.token);
      showToast("Usuário desativado");
      loadUsers();
    } catch (error) {
      showToast(error.message);
    }
  }

  const filtrados = usuarios.filter((u) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      (u.nome || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const totalAdmins = usuarios.filter((u) => u.role === "admin").length;
  const totalAtivos = usuarios.filter((u) => u.ativo !== false).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="users-manager">
      <div className="manager-header">
        <div className="header-info">
          <h3>Gestão de Usuários</h3>
          <p className="count">
            {usuarios.length} usuários &middot; {totalAdmins} admins &middot; {totalAtivos} ativos
          </p>
        </div>
      </div>

      {!isMaster && (
        <div className="info-banner">
          Apenas o administrador master pode promover ou rebaixar usuários.
        </div>
      )}

      <div className="manager-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              {isMaster && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={isMaster ? 5 : 4} className="no-products">
                  <p>Nenhum usuário encontrado</p>
                </td>
              </tr>
            ) : (
              filtrados.map((u) => (
                <tr key={u.id} className={u.ativo === false ? "row-sem-estoque" : ""}>
                  <td>
                    <span className="product-name">{u.nome || "Sem nome"}</span>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${u.ativo === false ? "inativo" : "ativo"}`}>
                      {u.ativo === false ? "Inativo" : "Ativo"}
                    </span>
                  </td>
                  {isMaster && (
                    <td>
                      <div className="actions">
                        {u.email !== ADMIN_MASTER_EMAIL && (
                          <>
                            <button
                              className={`role-toggle-btn ${u.role === "admin" ? "demote" : "promote"}`}
                              onClick={() => handleToggleRole(u)}
                              title={u.role === "admin" ? "Rebaixar" : "Promover"}
                            >
                              {u.role === "admin" ? "↓" : "↑"}
                            </button>
                            {u.ativo !== false && (
                              <button
                                className="delete-btn"
                                onClick={() => handleDesativar(u)}
                                title="Desativar"
                              >
                                🚫
                              </button>
                            )}
                          </>
                        )}
                        {u.email === ADMIN_MASTER_EMAIL && (
                          <span className="master-badge">Master</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
