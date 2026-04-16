const db = require("../config/firebase");
const mp = require("../services/mercadopago");
const email = require("../services/email");

// ==========================================
// POST /webhooks/mercadopago
//
// O MP envia várias variações de payload dependendo do
// evento. Exemplo de um evento de payment:
//   { type: "payment", data: { id: "12345678" } }
// Também pode vir:
//   ?topic=payment&id=12345678  (legado)
//
// Sempre respondemos 200 rápido e processamos async —
// senão o MP tenta de novo agressivamente.
// ==========================================
exports.receber = async (req, res) => {
  // Responde imediatamente — MP espera 200.
  res.sendStatus(200);

  try {
    const topic =
      req.query.topic || req.query.type || req.body?.type || req.body?.topic;

    const paymentId =
      req.body?.data?.id ||
      req.query.id ||
      req.query["data.id"] ||
      (topic === "payment" && req.body?.resource) ||
      null;

    if (!paymentId) {
      console.warn("Webhook MP sem paymentId:", { query: req.query, body: req.body });
      return;
    }

    if (topic && String(topic) !== "payment") {
      // Outros tópicos (merchant_order, etc.) — ignorar por enquanto.
      return;
    }

    const pagamento = await mp.obterPagamento(paymentId);
    if (!pagamento) {
      console.warn("Pagamento não encontrado no MP:", paymentId);
      return;
    }

    const pedidoId = pagamento.external_reference;
    if (!pedidoId) {
      console.warn("Pagamento sem external_reference:", paymentId);
      return;
    }

    // Mapeia status MP → nosso domínio.
    const statusPagamento = mapStatus(pagamento.status);
    const statusPedido =
      statusPagamento === "pago" ? "em_producao" : "aguardando_pagamento";

    const pedidoRef = db.collection("pedidos").doc(pedidoId);
    const pedidoSnap = await pedidoRef.get();
    const pedidoAtual = pedidoSnap.exists ? pedidoSnap.data() : null;

    await pedidoRef.update({
      statusPagamento,
      status: statusPedido,
      mpPaymentId: String(paymentId),
      mpPaymentStatus: pagamento.status,
      mpPaymentStatusDetail: pagamento.status_detail || null,
      mpPaymentMethod: pagamento.payment_method_id || null,
      mpPaymentType: pagamento.payment_type_id || null,
      atualizadoEm: new Date().toISOString(),
      ...(statusPagamento === "pago"
        ? { pagoEm: new Date().toISOString() }
        : {}),
    });

    // Incrementa uso do cupom apenas na primeira confirmação "pago".
    if (
      statusPagamento === "pago" &&
      pedidoAtual?.statusPagamento !== "pago" &&
      pedidoAtual?.cupom?.codigo
    ) {
      const admin = require("firebase-admin");
      await db
        .collection("cupons")
        .doc(pedidoAtual.cupom.codigo)
        .update({
          usos: admin.firestore.FieldValue.increment(1),
          atualizadoEm: new Date().toISOString(),
        });
    }

    // Dispara email de confirmação de pagamento — apenas na primeira transição "pago".
    if (
      statusPagamento === "pago" &&
      pedidoAtual?.statusPagamento !== "pago" &&
      pedidoAtual?.userEmail
    ) {
      email
        .emailPagamentoConfirmado(pedidoAtual.userEmail, {
          id: pedidoId,
          total: pedidoAtual.total,
        })
        .catch(() => {});
    }
  } catch (err) {
    console.error("Erro processando webhook MP:", err);
  }
};

function mapStatus(mpStatus) {
  switch (mpStatus) {
    case "approved":
      return "pago";
    case "pending":
    case "in_process":
    case "in_mediation":
    case "authorized":
      return "pendente";
    case "rejected":
    case "cancelled":
      return "recusado";
    case "refunded":
    case "charged_back":
      return "estornado";
    default:
      return "pendente";
  }
}
