import { createContext, useContext, useState, useEffect } from "react";
import { login, register } from "../services/api";

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
