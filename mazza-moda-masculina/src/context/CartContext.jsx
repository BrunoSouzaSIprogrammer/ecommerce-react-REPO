import { createContext, useContext, useState, useEffect, useRef } from "react";

const CartContext = createContext();

// Normaliza preço vindo do backend (pode ser `preco`, `price`, string ou number).
function toNumber(v) {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readString(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }) {
  // Lazy init: lê do localStorage ANTES do primeiro render, evitando o race
  // em que o effect de save sobrescreve a chave com o valor vazio inicial.
  const [cart, setCart] = useState(() => {
    const v = readJSON("cart", []);
    return Array.isArray(v) ? v : [];
  });
  const [cepDestino, setCepDestino] = useState(() => readString("cartCep", ""));
  const [freteSelecionado, setFreteSelecionado] = useState(() =>
    readJSON("cartFrete", null)
  );
  // { servico, codigo, preco, prazoDias, transportadora }

  const [toast, setToast] = useState({ show: false, message: "" });

  // Guarda extra: só persiste depois do primeiro render real (evita gravar
  // valores transitórios em StrictMode).
  const hidratado = useRef(false);

  function showToast(message) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2000);
  }

  useEffect(() => {
    if (!hidratado.current) {
      hidratado.current = true;
      return;
    }
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("cartCep", cepDestino || "");
    } catch {
      /* ignore */
    }
  }, [cepDestino]);

  useEffect(() => {
    try {
      if (freteSelecionado)
        localStorage.setItem("cartFrete", JSON.stringify(freteSelecionado));
      else localStorage.removeItem("cartFrete");
    } catch {
      /* ignore */
    }
  }, [freteSelecionado]);

  function addToCart(product) {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      // Normaliza preço e garante campos mínimos.
      const preco = toNumber(product.preco ?? product.price);
      const nome = product.nome || product.title || "Produto";

      if (exists) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      }
      return [
        ...prev,
        { ...product, preco, nome, quantity: 1 },
      ];
    });
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function updateQuantity(id, quantity) {
    const q = Math.max(1, Number(quantity) || 1);
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: q } : item))
    );
  }

  function clearCart() {
    setCart([]);
    setFreteSelecionado(null);
  }

  const subtotal = cart.reduce(
    (acc, item) => acc + toNumber(item.preco) * (item.quantity || 1),
    0
  );
  const valorFrete = freteSelecionado ? toNumber(freteSelecionado.preco) : 0;
  const total = subtotal + valorFrete;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        total,
        toast,
        showToast,
        // frete
        cepDestino,
        setCepDestino,
        freteSelecionado,
        setFreteSelecionado,
        valorFrete,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
