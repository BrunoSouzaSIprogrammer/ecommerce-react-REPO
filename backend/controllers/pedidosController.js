const db = require("../config/firebase");

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
      snapshot = await db.firestore()
        .collection("pedidos")
        .where("userId", "==", req.user.id)
        .orderBy("criadoEm", "desc")
        .get();
    }

    const pedidos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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

    // Validações
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

    // Calcula comissão do ADMIN
    const configComissao = await getComissaoConfig();
    const porcentagemComissao = configComissao.porcentagem / 100;
    const valorComissaoAdmin = total * porcentagemComissao;
    const valorLoja = total - valorComissaoAdmin;

    const novoPedido = {
      itens,
      total,
      userId: req.user.id,
      userEmail: req.user.email,
      metodoPagamento,
      dadosPagamento: dadosPagamento || {},
      status: metodoPagamento === "pix" ? "aguardando_pagamento" : "processando",
      statusPagamento: "pendente",
      comissaoAdmin: valorComissaoAdmin,
      valorLoja: valorLoja,
      porcentagemComissao: configComissao.porcentagem,
      criadoEm: db.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: db.firestore.FieldValue.serverTimestamp()
    };

    // Se for PIX, gera a chave PIX (simulado - em produção integrar com API do banco)
    if (metodoPagamento === "pix") {
      novoPedido.pixCode = gerarPixCode(total);
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

    res.json({
      message: "Pedido criado com sucesso",
      id: docRef.id,
      pixCode: novoPedido.pixCode,
      pixVencimento: novoPedido.pixVencimento,
      comissaoAdmin: valorComissaoAdmin,
      valorLoja: valorLoja
    });
  } catch (error) {
    console.error("ERRO CRIAR PEDIDO:", error.message);
    res.status(500).json({ error: "Erro ao criar pedido" });
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

// ================= ATUALIZAR STATUS DO PEDIDO =================
exports.atualizarStatusPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { status } = req.body;

    const statusValidos = ["pendente", "processando", "enviado", "entregue", "cancelado"];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    await db.firestore().collection("pedidos").doc(pedidoId).update({
      status,
      atualizadoEm: db.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Status atualizado com sucesso" });
  } catch (error) {
    console.error("ERRO ATUALIZAR STATUS:", error.message);
    res.status(500).json({ error: "Erro ao atualizar status" });
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
function gerarPixCode(valor) {
  // Em produção, integrar com API do banco para gerar PIX real
  // Este é um código simulado
  const timestamp = Date.now().toString(36).toUpperCase();
  const valorFormatado = valor.toFixed(2).replace('.', '');
  return `PIX-MAZZA-${timestamp}-${valorFormatado}`;
}
