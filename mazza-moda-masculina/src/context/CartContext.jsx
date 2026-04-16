import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

// Normaliza preço vindo do backend (pode ser `preco`, `price`, string ou number).
function toNumber(v) {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cepDestino, setCepDestino] = useState("");
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  // { servico, codigo, preco, prazoDias, transportadora }

  const [toast, setToast] = useState({ show: false, message: "" });

  function showToast(message) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2000);
  }

  // Hidrata do localStorage na primeira render.
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      if (storedCart) setCart(JSON.parse(storedCart));
      const storedCep = localStorage.getItem("cartCep");
      if (storedCep) setCepDestino(storedCep);
      const storedFrete = localStorage.getItem("cartFrete");
      if (storedFrete) setFreteSelecionado(JSON.parse(storedFrete));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("cartCep", cepDestino || "");
  }, [cepDestino]);

  useEffect(() => {
    if (freteSelecionado)
      localStorage.setItem("cartFrete", JSON.stringify(freteSelecionado));
    else localStorage.removeItem("cartFrete");
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
