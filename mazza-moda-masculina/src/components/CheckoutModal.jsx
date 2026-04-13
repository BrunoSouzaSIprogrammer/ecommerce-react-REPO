import { useState } from "react";
import { createPedido } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "../styles/checkout.css";

export default function CheckoutModal({ open, onClose }) {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState(null);

  if (!open) return null;

  async function handleFinalizarCompra() {
    if (!metodoPagamento) {
      alert("Selecione uma forma de pagamento");
      return;
    }

    if (!user) {
      alert("Você precisa estar logado para finalizar a compra");
      return;
    }

    setProcessing(true);

    try {
      const token = user.token;
      const itens = cart.map(item => ({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantity || 1
      }));

      const resultado = await createPedido({
        itens,
        total,
        metodoPagamento,
        dadosPagamento: {}
      }, token);

      setPedidoCriado(resultado);

      // Limpa o carrinho apenas se o pedido foi criado com sucesso
      if (resultado.id) {
        clearCart();
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      alert("Erro ao finalizar compra: " + error.message);
    } finally {
      setProcessing(false);
    }
  }

  function handleClose() {
    if (pedidoCriado) {
      onClose();
      setPedidoCriado(null);
    } else {
      onClose();
    }
  }

  return (
    <div className="checkout-modal-overlay" onClick={handleClose}>
      <div className="checkout-modal" onClick={e => e.stopPropagation()}>
        <div className="checkout-header">
          <h2>{pedidoCriado ? "Pedido Confirmado!" : "Finalizar Compra"}</h2>
          <button className="checkout-close" onClick={handleClose}>×</button>
        </div>

        {pedidoCriado ? (
          <div className="checkout-success">
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
              <h3 style={{ marginBottom: "8px" }}>Pedido realizado com sucesso!</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
                ID do pedido: {pedidoCriado.id}
              </p>

              {pedidoCriado.pixQrCode && (
                <div className="pix-info">
                  <p style={{ fontWeight: "600", marginBottom: "8px" }}>PIX para pagamento:</p>
                  <div className="pix-key">{pedidoCriado.pixChave}</div>
                  <div className="pix-qr-code">
                    {pedidoCriado.pixQrCode.substring(0, 50)}...
                  </div>
                  <p className="pix-timer">Vence em 24 horas</p>
                </div>
              )}

              <button
                className="checkout-confirm"
                onClick={handleClose}
                style={{ marginTop: "20px" }}
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="checkout-items">
              {cart.map((item) => (
                <div key={item.id} className="checkout-item">
                  <div className="checkout-item-info">
                    <div className="checkout-item-name">{item.nome}</div>
                    <div className="checkout-item-quantity">
                      Qtd: {item.quantity || 1}
                    </div>
                  </div>
                  <div className="checkout-item-price">
                    R$ {(item.preco * (item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-total">
              <span className="checkout-total-label">Total</span>
              <span className="checkout-total-value">R$ {total.toFixed(2)}</span>
            </div>

            <div className="payment-methods">
              <h3>Forma de Pagamento</h3>
              <div className="payment-options">
                <div
                  className={`payment-option ${metodoPagamento === "pix" ? "selected" : ""}`}
                  onClick={() => setMetodoPagamento("pix")}
                >
                  <div className="payment-option-icon">📱</div>
                  <div className="payment-option-label">PIX</div>
                </div>

                <div
                  className={`payment-option ${metodoPagamento === "cartao_credito" ? "selected" : ""}`}
                  onClick={() => setMetodoPagamento("cartao_credito")}
                >
                  <div className="payment-option-icon">💳</div>
                  <div className="payment-option-label">Crédito</div>
                </div>

                <div
                  className={`payment-option ${metodoPagamento === "cartao_debito" ? "selected" : ""}`}
                  onClick={() => setMetodoPagamento("cartao_debito")}
                >
                  <div className="payment-option-icon">💳</div>
                  <div className="payment-option-label">Débito</div>
                </div>
              </div>
            </div>

            {metodoPagamento === "pix" && (
              <div className="payment-details">
                <h4>Pagamento via PIX</h4>
                <div className="pix-info">
                  <p style={{ marginBottom: "12px" }}>
                    Ao confirmar, será gerado um código PIX para pagamento.
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    O pedido será confirmado após a compensação do pagamento (até 24h)
                  </p>
                </div>
              </div>
            )}

            {(metodoPagamento === "cartao_credito" || metodoPagamento === "cartao_debito") && (
              <div className="payment-details">
                <h4>Pagamento com Cartão</h4>
                <div className="card-info">
                  <p>🔒 Ambiente seguro</p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Os dados do cartão serão processados diretamente pelo Stripe.
                  </p>
                </div>
              </div>
            )}

            <div className="commission-info">
              <p>Taxa de serviço: 5% será adicionada ao valor da loja</p>
            </div>

            <div className="checkout-actions">
              <button className="checkout-cancel" onClick={handleClose}>
                Cancelar
              </button>
              <button
                className="checkout-confirm"
                onClick={handleFinalizarCompra}
                disabled={processing || !metodoPagamento}
              >
                {processing ? "Processando..." : `Confirmar Pedido`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
