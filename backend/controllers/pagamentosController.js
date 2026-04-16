const db = require("../config/firebase");
const mp = require("../services/mercadopago");
const { validarCupom } = require("./cuponsController");

// ==========================================
// POST /pagamentos/preferencia
//
// Fluxo:
//   1. Valida entrada.
//   2. Cria pedido no Firestore com status "aguardando_pagamento"
//      — serve como external_reference para reconciliação via webhook.
//   3. Cria preferência no Mercado Pago (ou stub) com split de 5%.
//   4. Devolve { pedidoId, initPoint } para o frontend redirecionar.
//
// Body: {
//   itens: [{ id, nome, preco, quantidade }],
//   frete: { servico, codigo, preco },
//   endereco: { cep, rua, numero, bairro, cidade, uf, complemento? },
//   contato: { nome, email, telefone }
// }
// ==========================================
exports.criarPreferencia = async (req, res) => {
  try {
    const { itens, frete, endereco, contato, cupomCodigo } = req.body;

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: "Itens são obrigatórios" });
    }
    if (!endereco || !endereco.cep || !endereco.numero) {
      return res.status(400).json({ error: "Endereço incompleto" });
    }
    if (!frete || !frete.servico) {
      return res.status(400).json({ error: "Frete não selecionado" });
    }
    if (!contato || !contato.email) {
      return res.status(400).json({ error: "Dados de contato incompletos" });
    }

    // Cálculo de totais — tudo em números.
    const subtotalItens = itens.reduce(
      (acc, it) =>
        acc + Number(it.preco || 0) * Number(it.quantidade || 1),
      0
    );
    const valorFrete = Number(frete.preco || 0);

    // Revalida cupom no servidor — nunca confia em desconto enviado pelo cliente.
    let cupomAplicado = null;
    let descontoCupom = 0;
    if (cupomCodigo) {
      const categorias = itens
        .map((it) => it.categoria || it.categoriaId)
        .filter(Boolean);
      const resultado = await validarCupom({
        codigo: cupomCodigo,
        subtotalItens,
        categorias,
      });
      if (!resultado.ok) {
        return res.status(400).json({ error: resultado.erro });
      }
      descontoCupom = resultado.desconto;
      cupomAplicado = {
        codigo: resultado.cupom.codigo,
        tipo: resultado.cupom.tipo,
        valor: resultado.cupom.valor,
        desconto: descontoCupom,
      };
    }

    const total = Number((subtotalItens - descontoCupom + valorFrete).toFixed(2));

    const comissaoPercent = mp.feePercent();
    const valorComissaoAdmin = Number(
      ((total * comissaoPercent) / 100).toFixed(2)
    );
    const valorLoja = Number((total - valorComissaoAdmin).toFixed(2));

    // 1. Persiste pedido com status "aguardando_pagamento".
    const novoPedido = {
      itens,
      frete,
      endereco,
      contato,
      subtotalItens,
      valorFrete,
      cupom: cupomAplicado,
      descontoCupom,
      total,
      comissaoAdmin: valorComissaoAdmin,
      valorLoja,
      porcentagemComissao: comissaoPercent,
      userId: req.user?.id || null,
      userEmail: req.user?.email || contato.email,
      metodoPagamento: "mercadopago",
      status: "aguardando_pagamento",
      statusPagamento: "pendente",
      mpMode: mp.mode(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const docRef = await db.collection("pedidos").add(novoPedido);
    const pedidoId = docRef.id;

    // 2. Monta items do MP (produtos + frete como item adicional).
    const mpItems = itens.map((it) => ({
      id: String(it.id || ""),
      title: String(it.nome || "Item"),
      quantity: Number(it.quantidade || 1),
      unit_price: Number(it.preco || 0),
    }));
    if (valorFrete > 0) {
      mpItems.push({
        id: "frete",
        title: `Frete (${frete.servico})`,
        quantity: 1,
        unit_price: valorFrete,
      });
    }
    if (descontoCupom > 0) {
      mpItems.push({
        id: "cupom",
        title: `Desconto (${cupomAplicado.codigo})`,
        quantity: 1,
        unit_price: -Number(descontoCupom.toFixed(2)),
      });
    }

    const front = process.env.MP_FRONTEND_URL || "http://localhost:3000";
    const notificationUrl =
      process.env.MP_NOTIFICATION_URL ||
      "http://localhost:5000/webhooks/mercadopago";

    const preferencia = await mp.criarPreferencia({
      items: mpItems,
      externalReference: pedidoId,
      total,
      payer: {
        name: contato.nome || undefined,
        email: contato.email,
        phone: contato.telefone
          ? { number: String(contato.telefone) }
          : undefined,
        address: {
          zip_code: String(endereco.cep || "").replace(/\D/g, ""),
          street_name: endereco.rua,
          street_number: Number(endereco.numero) || undefined,
        },
      },
      backUrls: {
        success: `${front}/pagamento/sucesso?pedido=${pedidoId}`,
        pending: `${front}/pagamento/pendente?pedido=${pedidoId}`,
        failure: `${front}/pagamento/falha?pedido=${pedidoId}`,
      },
      notificationUrl,
    });

    // 3. Atualiza pedido com o id da preferência.
    await db.collection("pedidos").doc(pedidoId).update({
      mpPreferenceId: preferencia.id,
      mpStub: !!preferencia._stub,
      atualizadoEm: new Date().toISOString(),
    });

    const initPoint =
      mp.mode() === "test"
        ? preferencia.sandbox_init_point || preferencia.init_point
        : preferencia.init_point;

    res.json({
      pedidoId,
      preferenciaId: preferencia.id,
      initPoint,
      stub: !!preferencia._stub,
      feePercent: comissaoPercent,
      total,
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    res.status(500).json({ error: error.message || "Erro ao criar preferência" });
  }
};
