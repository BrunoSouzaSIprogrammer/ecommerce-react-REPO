import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useTheme from "../hooks/useTheme";
import ProductsManager from "../components/Admin/ProductsManager";
import PedidosManager from "../components/Admin/PedidosManager";
import Dashboard from "../components/Admin/DashBoard";
import CuponsManager from "../components/Admin/CuponsManager";
import FavoritosRanking from "../components/Admin/FavoritosRanking";
import "../styles/admin.css";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className={`admin-page ${theme}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">MAZZA</h1>
          <p className="sidebar-subtitle">Admin</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeTab === "produtos" ? "active" : ""}`}
            onClick={() => setActiveTab("produtos")}
          >
            <span className="nav-icon">📦</span>
            <span>Produtos</span>
          </button>
          <button
            className={`nav-item ${activeTab === "pedidos" ? "active" : ""}`}
            onClick={() => setActiveTab("pedidos")}
          >
            <span className="nav-icon">🧾</span>
            <span>Pedidos</span>
          </button>
          <button
            className={`nav-item ${activeTab === "cupons" ? "active" : ""}`}
            onClick={() => setActiveTab("cupons")}
          >
            <span className="nav-icon">🎟️</span>
            <span>Cupons</span>
          </button>
          <button
            className={`nav-item ${activeTab === "favoritos" ? "active" : ""}`}
            onClick={() => setActiveTab("favoritos")}
          >
            <span className="nav-icon">♥</span>
            <span>Favoritos</span>
          </button>
          <button
            className={`nav-item ${activeTab === "financeiro" ? "active" : ""}`}
            onClick={() => setActiveTab("financeiro")}
          >
            <span className="nav-icon">💰</span>
            <span>Financeiro</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">{user.nome?.charAt(0).toUpperCase()}</span>
            <div className="user-details">
              <span className="user-name">{user.nome}</span>
              <span className="user-role">Administrador</span>
            </div>
          </div>
          <button className="logout-btn" onClick={signOut}>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Bar */}
        <header className="admin-header">
          <h2 className="page-title">
            {activeTab === "dashboard" && "Visão Geral"}
            {activeTab === "produtos" && "Gerenciar Produtos"}
            {activeTab === "pedidos" && "Pedidos"}
            {activeTab === "cupons" && "Cupons de desconto"}
            {activeTab === "favoritos" && "Revisão de favoritos"}
            {activeTab === "financeiro" && "Financeiro"}
          </h2>
          <div className="header-actions">
            <button
              className="theme-toggle-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button className="back-btn" onClick={() => navigate("/")}>
              ← Voltar à Loja
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "produtos" && <ProductsManager />}
          {activeTab === "pedidos" && <PedidosManager />}
          {activeTab === "cupons" && <CuponsManager />}
          {activeTab === "favoritos" && <FavoritosRanking />}
          {activeTab === "financeiro" && (
            <div className="coming-soon">
              <span className="icon">🚧</span>
              <h3>Em desenvolvimento</h3>
              <p>Painel financeiro estará disponível em breve</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
