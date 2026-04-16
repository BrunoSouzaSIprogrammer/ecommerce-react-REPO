import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";
import useTheme from "../hooks/useTheme";
import logo from "../assets/logo-mazza-transparent.png";
import "../styles/auth.css";

export default function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    // Validações
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      await register(nome, email, senha);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-page ${theme}`}>
      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Alternar tema"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img 
              src={logo} 
              alt="Mazza" 
              className="auth-logo-img" 
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            />
            <h1 className="auth-logo">MAZZA</h1>
            <p className="auth-subtitle">Moda Masculina</p>
          </div>

          <h2 className="auth-title">Crie sua conta</h2>
          <p className="auth-description">
            Junte-se a nós e descubra o melhor da moda masculina
          </p>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmarSenha">Confirmar senha</label>
              <input
                id="confirmarSenha"
                type="password"
                placeholder="Repita sua senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">Criando conta...</span>
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          <p className="auth-footer">
            Já tem uma conta?{" "}
            <Link to="/login" className="auth-link">
              Fazer login
            </Link>
          </p>
        </div>

        <div className="auth-decoration">
          <div className="decoration-circle decoration-circle-1"></div>
          <div className="decoration-circle decoration-circle-2"></div>
          <div className="decoration-circle decoration-circle-3"></div>
        </div>
      </div>
    </div>
  );
}
