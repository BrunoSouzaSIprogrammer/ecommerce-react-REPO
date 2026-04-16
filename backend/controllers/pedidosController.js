require("dotenv").config();
const db = require("../config/firebase");
const frenet = require("../services/frenet");
const email = require("../services/email");
// Pagamento com cartão: migração para Mercado Pago planejada para a Fase 2.
// Até lá, `processarPagamentoCartao` opera em modo dev (aprovação automática).

// ================= CONFIGURAÇÃO DE COMISSÃO =================
const COMISSAO_COLLECTION = "config_comissao";

// Obtém a % de comissão do ADMIN (padrão: 5%)
async function getComissaoConfig() {
  const doc = await db.firestore().collection(COMISSAO_COLLECTION).doc("config").get();
  if (doc.exists) {
    return doc.data();
  }
  // Valor padrão
  return { porcentagem: 5, ativo: true };
}

// ================= LISTAR PEDIDOS =================
exports.listarPedidos = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";

    let snapshot;

    if (isAdmin) {
      snapshot = await db.firestore()
        .collection("pedidos")
        .orderBy("criadoEm", "desc")
        .get();
    } else {
      // Sem orderBy aqui — a combinação where + orderBy em campos diferentes
      // exige índice composto no Firestore. Ordenamos em memória abaixo.
      snapshot = await db.firestore()
        .collection("pedidos")
        .where("userId", "==", req.user.id)
        .get();
    }

    const pedidos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (!isAdmin) {
      pedidos.sort((a, b) =>
        String(b.criadoEm || "").localeCompare(String(a.criadoEm || ""))
      );
    }

    res.json(pedidos);
  } catch (error) {
    console.error("ERRO LISTAR PEDIDOS:", error.message);
    res.status(500).json({ error: "Erro ao listar pedidos" });
  }
};

// ================= CRIAR PEDIDO COM PAGAMENTO =================
exports.criarPedido = async (req, res) => {
  try {
    const { itens, total, metodoPagamento, dadosPagamento } = req.body;

    // Validações básicas
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: "Itens são obrigatórios" });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: "Total deve ser maior que zero" });
    }

    if (!metodoPagamento || !["pix", "cartao_credito", "cartao_debito"].includes(metodoPagamento)) {
      return res.status(400).json({
        error: "Método de pagamento inválido. Use: pix, cartao_credito, ou cartao_debito"
      });
    }

    // Valida estoque dos produtos
    const errosEstoque = await validarEstoqueProdutos(itens);
    if (errosEstoque.length > 0) {
      return res.status(400).json({
        error: "Problemas no estoque",
        detalhes: errosEstoque
      });
    }

    // Calcula comissão do ADMIN
    const configComissao = await getComissaoConfig();
    const porcentagemComissao = configComissao.porcentagem / 100;
    const valorComissaoAdmin = total * porcentagemComissao;
    const valorLoja = total - valorComissaoAdmin;

    // Processa pagamento conforme método
    let pagamentoProcessado = false;
    let paymentId = null;

    if (metodoPagamento === "cartao_credito" || metodoPagamento === "cartao_debito") {
      // Processa pagamento com cartão (stub até a Fase 2 — Mercado Pago)
      const resultado = await processarPagamentoCartao(total, metodoPagamento, dadosPagamento);
      pagamentoProcessado = resultado.success;
      paymentId = resultado.paymentId;

      if (!resultado.success) {
        return res.status(402).json({
          error: "Pagamento recusado",
          paymentId: resultado.paymentId
        });
      }
    }

    const novoPedido = {
      itens,
      total,
      userId: req.user.id,
      userEmail: req.user.email,
      metodoPagamento,
      dadosPagamento: dadosPagamento || {},
      status: metodoPagamento === "pix" ? "aguardando_pagamento" : "processando",
      statusPagamento: metodoPagamento === "pix" ? "pendente" : (pagamentoProcessado ? "pago" : "pendente"),
      comissaoAdmin: valorComissaoAdmin,
      valorLoja: valorLoja,
      porcentagemComissao: configComissao.porcentagem,
      paymentId,
      criadoEm: db.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: db.firestore.FieldValue.serverTimestamp()
    };

    // Se for PIX, gera o código PIX e QR Code
    if (metodoPagamento === "pix") {
      const pixData = gerarPixCode(total, req.user.email);
      novoPedido.pixCode = pixData.codigo;
      novoPedido.pixChave = pixData.chavePix;
      novoPedido.pixQrCode = pixData.qrcode;
      novoPedido.pixVencimento = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    }

    const docRef = await db.firestore().collection("pedidos").add(novoPedido);

    // Decrementa estoque dos produtos
    for (const item of itens) {
      const produtoRef = db.firestore().collection("produtos").doc(item.id);
      await db.firestore().runTransaction(async (transaction) => {
        const produtoDoc = await transaction.get(produtoRef);
        if (produtoDoc.exists) {
          const currentEstoque = produtoDoc.data().estoque || 0;
          transaction.update(produtoRef, {
            estoque: Math.max(0, currentEstoque - (item.quantidade || 1))
          });
        }
      });
    }

    const resposta = {
      message: "Pedido criado com sucesso",
      id: docRef.id,
      comissaoAdmin: valorComissaoAdmin,
      valorLoja: valorLoja
    };

    if (metodoPagamento === "pix") {
      resposta.pixCode = novoPedido.pixCode;
      resposta.pixChave = novoPedido.pixChave;
      resposta.pixQrCode = novoPedido.pixQrCode;
      resposta.pixVencimento = novoPedido.pixVencimento;
    }

    if (paymentId) {
      resposta.paymentId = paymentId;
    }

    res.json(resposta);

    // Email de confirmação (fire-and-forget)
    email.emailPedidoCriado(req.user.email, {
      id: docRef.id,
      itens,
      total,
      metodoPagamento,
      pixCode: novoPedido.pixCode || null,
    }).catch(() => {});
  } catch (error) {
    console.error("ERRO CRIAR PEDIDO:", error.message);
    res.status(500).json({ error: "Erro ao criar pedido: " + error.message });
  }
};

// ================= CONFIRMAR PAGAMENTO PIX =================
exports.confirmarPagamentoPix = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const isAdmin = req.user.role === "admin";

    // Apenas admin pode confirmar pagamento PIX
    if (!isAdmin) {
      return res.status(403).json({ error: "Apenas administradores podem confirmar pagamentos" });
    }

    await db.firestore().collection("pedidos").doc(pedidoId).update({
      status: "pago",
      statusPagamento: "pago",
      pagoEm: db.firestore.FieldValue.serverTimestamp(),
      confirmadoPor: req.user.id,
      atualizadoEm: db.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Pagamento PIX confirmado com sucesso" });
  } catch (error) {
    console.error("ERRO CONFIRMAR PIX:", error.message);
    res.status(500).json({ error: "Erro ao confirmar pagamento" });
  }
};

// ================= STATUS CANÔNICOS =================
// Fluxo oficial:
//   aguardando_pagamento → em_producao → enviado → recebido
//   (em qualquer ponto) → cancelado
const STATUS_VALIDOS = [
  "aguardando_pagamento",
  "em_producao",
  "enviado",
  "recebido",
  "cancelado",
];

// Transições que só ADMIN pode fazer manualmente.
const STATUS_ADMIN_ONLY = ["em_producao", "enviado", "recebido", "cancelado"];

// ================= OBTER PEDIDO POR ID =================
exports.obterPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const doc = await db
      .firestore()
      .collection("pedidos")
      .doc(pedidoId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const pedido = { id: doc.id, ...doc.data() };
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && pedido.userId !== req.user.id) {
      return res.status(403).json({ error: "Sem permissão para ver este pedido" });
    }

    res.json(pedido);
  } catch (error) {
    console.error("ERRO OBTER PEDIDO:", error.message);
    res.status(500).json({ error: "Erro ao obter pedido" });
  }
};

// ================= ATUALIZAR STATUS DO PEDIDO =================
// Cliente só pode cancelar o próprio pedido se ainda estiver aguardando_pagamento.
// Qualquer outra transição exige ADMIN.
exports.atualizarStatusPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { status } = req.body;
    const isAdmin = req.user.role === "admin";

    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const ref = db.firestore().collection("pedidos").doc(pedidoId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    const pedido = snap.data();

    if (!isAdmin) {
      // Cliente só pode cancelar o próprio pedido, e apenas antes do pagamento.
      if (pedido.userId !== req.user.id) {
        return res.status(403).json({ error: "Sem permissão" });
      }
      if (status !== "cancelado") {
        return res.status(403).json({ error: "Apenas ADMIN pode avançar status" });
      }
      if (pedido.status !== "aguardando_pagamento") {
        return res.status(400).json({
          error: "Só é possível cancelar antes do pagamento",
        });
      }
    } else if (STATUS_ADMIN_ONLY.includes(status) && !isAdmin) {
      return res.status(403).json({ error: "Apenas ADMIN" });
    }

    const updates = {
      status,
      atualizadoEm: db.firestore.FieldValue.serverTimestamp(),
    };

    // Registra timestamps por status (linha do tempo).
    if (status === "enviado") updates.enviadoEm = db.firestore.FieldValue.serverTimestamp();
    if (status === "recebido") updates.recebidoEm = db.firestore.FieldValue.serverTimestamp();
    if (status === "cancelado") updates.canceladoEm = db.firestore.FieldValue.serverTimestamp();

    await ref.update(updates);

    res.json({ message: "Status atualizado com sucesso", status });

    // Email de mudança de status (fire-and-forget)
    if (pedido.userEmail) {
      const snap2 = await ref.get();
      const pedidoAtualizado = { id: pedidoId, ...snap2.data() };
      email.emailStatusAtualizado(pedido.userEmail, pedidoAtualizado).catch(() => {});
    }
  } catch (error) {
    console.error("ERRO ATUALIZAR STATUS:", error.message);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
};

// ================= ATUALIZAR RASTREIO (ADMIN) =================
// Admin adiciona código de rastreio + transportadora.
// Se o pedido estava em_producao, avança automaticamente para "enviado".
exports.atualizarRastreio = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { codigoRastreio, transportadora, linkRastreio } = req.body;

    if (!codigoRastreio) {
      return res.status(400).json({ error: "codigoRastreio é obrigatório" });
    }

    const ref = db.firestore().collection("pedidos").doc(pedidoId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const pedido = snap.data();
    const updates = {
      rastreio: {
        codigo: String(codigoRastreio).trim().toUpperCase(),
        transportadora: transportadora || pedido?.frete?.transportadora || null,
        link: linkRastreio || null,
        adicionadoEm: new Date().toISOString(),
      },
      atualizadoEm: db.firestore.FieldValue.serverTimestamp(),
    };

    // Se ainda estava em produção, avança para enviado.
    if (pedido.status === "em_producao" || pedido.status === "aguardando_pagamento") {
      updates.status = "enviado";
      updates.enviadoEm = db.firestore.FieldValue.serverTimestamp();
    }

    await ref.update(updates);
    res.json({ message: "Rastreio atualizado", rastreio: updates.rastreio });
  } catch (error) {
    console.error("ERRO ATUALIZAR RASTREIO:", error.message);
    res.status(500).json({ error: "Erro ao atualizar rastreio" });
  }
};

// ================= CONSULTAR RASTREIO =================
// Cliente dono do pedido ou ADMIN. Consulta status atual via Frenet (stub em dev).
exports.consultarRastreio = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const ref = db.firestore().collection("pedidos").doc(pedidoId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    const pedido = snap.data();
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && pedido.userId !== req.user.id) {
      return res.status(403).json({ error: "Sem permissão" });
    }
    if (!pedido.rastreio?.codigo) {
      return res.status(400).json({ error: "Pedido sem código de rastreio" });
    }

    const tracking = await frenet.consultarRastreio({
      codigoRastreio: pedido.rastreio.codigo,
      transportadora: pedido.rastreio.transportadora,
      postadoEm: pedido.rastreio.adicionadoEm || pedido.enviadoEm || null,
    });

    // Persiste último snapshot.
    await ref.update({
      "rastreio.ultimaConsulta": tracking,
      atualizadoEm: db.firestore.FieldValue.serverTimestamp(),
    });

    res.json(tracking);
  } catch (error) {
    console.error("ERRO CONSULTAR RASTREIO:", error.message);
    res.status(500).json({ error: error.message || "Erro ao consultar rastreio" });
  }
};

// ================= AVALIAÇÃO DO PEDIDO (CLIENTE) =================
// Só permite se status=recebido e ainda não avaliado.
exports.avaliarPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { nota, comentario } = req.body;

    const n = Number(nota);
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      return res.status(400).json({ error: "Nota deve ser entre 1 e 5" });
    }

    const ref = db.firestore().collection("pedidos").doc(pedidoId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    const pedido = snap.data();

    if (pedido.userId !== req.user.id) {
      return res.status(403).json({ error: "Sem permissão" });
    }
    if (pedido.status !== "recebido") {
      return res.status(400).json({
        error: "Só é possível avaliar pedidos recebidos",
      });
    }
    if (pedido.avaliacao) {
      return res.status(400).json({ error: "Pedido já foi avaliado" });
    }

    const avaliacao = {
      nota: n,
      comentario: (comentario || "").toString().slice(0, 1000),
      avaliadoEm: new Date().toISOString(),
      userId: req.user.id,
    };

    await ref.update({
      avaliacao,
      atualizadoEm: db.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "Avaliação registrada", avaliacao });
  } catch (error) {
    console.error("ERRO AVALIAR PEDIDO:", error.message);
    res.status(500).json({ error: "Erro ao avaliar pedido" });
  }
};

// ================= OBTER CONFIGURAÇÃO DE COMISSÃO (Admin) =================
exports.getComissaoConfig = async (req, res) => {
  try {
    const config = await getComissaoConfig();
    res.json(config);
  } catch (error) {
    console.error("ERRO GET COMISSAO:", error.message);
    res.status(500).json({ error: "Erro ao obter configuração de comissão" });
  }
};

// ================= ATUALIZAR CONFIGURAÇÃO DE COMISSÃO (Admin) =================
exports.setComissaoConfig = async (req, res) => {
  try {
    const { porcentagem, ativo } = req.body;

    if (porcentagem === undefined || porcentagem < 0 || porcentagem > 100) {
      return res.status(400).json({ error: "Porcentagem deve ser entre 0 e 100" });
    }

    await db.firestore().collection(COMISSAO_COLLECTION).doc("config").set({
      porcentagem: parseFloat(porcentagem),
      ativo: ativo !== undefined ? ativo : true,
      atualizadoEm: db.firestore.FieldValue.serverTimestamp(),
      atualizadoPor: req.user.id
    });

    res.json({ message: "Configuração de comissão atualizada com sucesso" });
  } catch (error) {
    console.error("ERRO SET COMISSAO:", error.message);
    res.status(500).json({ error: "Erro ao atualizar configuração de comissão" });
  }
};

// ================= OBTER RESUMO FINANCEIRO (Admin) =================
exports.getResumoFinanceiro = async (req, res) => {
  try {
    const { periodo } = req.query; // 'dia', 'semana', 'mes', 'ano', 'todos'

    let dataInicio = new Date();
    const hoje = new Date();

    switch (periodo) {
      case 'dia':
        dataInicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        dataInicio.setDate(hoje.getDate() - 7);
        break;
      case 'mes':
        dataInicio.setMonth(hoje.getMonth() - 1);
        break;
      case 'ano':
        dataInicio.setFullYear(hoje.getFullYear() - 1);
        break;
      default:
        dataInicio = new Date(2000, 0, 1); // Todos
    }

    const snapshot = await db.firestore()
      .collection("pedidos")
      .where("statusPagamento", "==", "pago")
      .where("criadoEm", ">=", dataInicio)
      .get();

    let totalVendas = 0;
    let totalComissaoAdmin = 0;
    let totalLoja = 0;
    const pedidosCount = snapshot.size;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalVendas += data.total || 0;
      totalComissaoAdmin += data.comissaoAdmin || 0;
      totalLoja += data.valorLoja || 0;
    });

    res.json({
      periodo,
      pedidosCount,
      totalVendas,
      totalComissaoAdmin,
      totalLoja,
      porcentagemComissao: (totalVendas > 0) ? ((totalComissaoAdmin / totalVendas) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error("ERRO RESUMO FINANCEIRO:", error.message);
    res.status(500).json({ error: "Erro ao obter resumo financeiro" });
  }
};

// ================= HELPER: Gerar código PIX (simulado) =================
function gerarPixCode(valor, email) {
  // Em produção, integrar com API do banco (Banco Central, Gerencianet, etc.)
  // Este é um código simulado para desenvolvimento
  const timestamp = Date.now().toString(36).toUpperCase();
  const valorFormatado = valor.toFixed(2).replace('.', '');
  const chavePix = process.env.PIX_KEY || "jackfrostbr3210@gmail.com";

  return {
    codigo: `PIX-MAZZA-${timestamp}-${valorFormatado}`,
    chavePix,
    qrcode: `00020126${String(58 + chavePix.length).padStart(2, '0')}BR.GOV.BCB.PIX${chavePix.length}${chavePix}52040000530398654${String(valorFormatado.length).padStart(2, '0')}${valorFormatado}5802BR5913MAZZA MODA6008SAO PAULO62${String(21 + timestamp.length).padStart(2, '0')}05${timestamp.length}${timestamp}6304ABCD`
  };
}

// ================= PROCESSAR PAGAMENTO CARTÃO =================
// TODO Fase 2: integrar Mercado Pago (Payment API / Checkout Bricks).
// Por ora, aprovamos qualquer tentativa em modo dev.
// Parâmetros mantidos para a assinatura não quebrar os callers.
// eslint-disable-next-line no-unused-vars
async function processarPagamentoCartao(total, metodoPagamento, dadosPagamento) {
  return { success: true, paymentId: "dev_card_payment_" + Date.now() };
}

// ================= VALIDAR QUANTIDADE DE PRODUTOS =================
async function validarEstoqueProdutos(itens) {
  const erros = [];

  for (const item of itens) {
    const produtoRef = db.firestore().collection("produtos").doc(item.id);
    const produtoDoc = await produtoRef.get();

    if (!produtoDoc.exists) {
      erros.push(`Produto "${item.nome || item.id}" não encontrado`);
      continue;
    }

    const produtoData = produtoDoc.data();
    const estoqueAtual = produtoData.estoque || 0;
    const quantidadeSolicitada = item.quantidade || 1;

    if (estoqueAtual < quantidadeSolicitada) {
      erros.push(`Produto "${produtoData.nome}" tem apenas ${estoqueAtual} em estoque`);
    }
  }

  return erros;
}
