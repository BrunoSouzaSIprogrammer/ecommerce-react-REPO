import { createContext, useContext, useState, useEffect } from "react";
import { login, register, adicionarFavorito } from "../services/api";

const FAV_KEY = "mazza:favoritos";

// Migra favoritos guardados em localStorage (visitante) para o backend
// assim que o usuário faz login. Executa uma chamada por id — lista curta.
async function migrarFavoritosLocais(token) {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids) || ids.length === 0) {
      localStorage.removeItem(FAV_KEY);
      return;
    }
    await Promise.allSettled(ids.map((id) => adicionarFavorito(id, token)));
    localStorage.removeItem(FAV_KEY);
  } catch (err) {
    console.warn("Falha ao migrar favoritos locais:", err.message);
  }
}

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  async function signIn(email, senha) {
    const data = await login(email, senha);
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    // Migra favoritos locais (se houver) para o backend.
    if (data?.token) {
      migrarFavoritosLocais(data.token);
    }
    return data;
  }

  async function signUp(nome, email, senha) {
    const data = await register(nome, email, senha);
    return data;
  }

  function signOut() {
    localStorage.removeItem("user");
    setUser(null);
  }

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
