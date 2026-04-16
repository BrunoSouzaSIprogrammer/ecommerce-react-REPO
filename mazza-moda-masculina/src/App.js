import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Produto from "./pages/Produto";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PagamentoResultado from "./pages/PagamentoResultado";
import MeusPedidos from "./pages/MeusPedidos";
import PedidoDetalhe from "./pages/PedidoDetalhe";
import MeusFavoritos from "./pages/MeusFavoritos";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Toast from "./components/Toast";
import { useCart } from "./context/CartContext";

function ToastWrapper() {
  const { toast } = useCart();
  return (
    <Toast
      message={toast.message}
      show={toast.show}
      onClose={() => {}}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/catalogo/:categoria"
              element={
                <ProtectedRoute>
                  <Catalogo />
                </ProtectedRoute>
              }
            />

            <Route
              path="/produto/:id"
              element={
                <ProtectedRoute>
                  <Produto />
                </ProtectedRoute>
              }
            />

            <Route
              path="/carrinho"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pagamento/:status"
              element={
                <ProtectedRoute>
                  <PagamentoResultado />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conta/pedidos"
              element={
                <ProtectedRoute>
                  <MeusPedidos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conta/pedidos/:id"
              element={
                <ProtectedRoute>
                  <PedidoDetalhe />
                </ProtectedRoute>
              }
            />

            <Route
              path="/conta/favoritos"
              element={
                <ProtectedRoute>
                  <MeusFavoritos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
          <ToastWrapper />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
