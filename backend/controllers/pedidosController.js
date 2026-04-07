const db = require("../config/firebase");

// LISTAR PEDIDOS
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
        .where("userId", "==", req.user.uid)
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

// CRIAR PEDIDO
exports.criarPedido = async (req, res) => {
  try {
    const { itens, total } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: "Itens são obrigatórios" });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: "Total deve ser maior que zero" });
    }

    const novoPedido = {
      itens,
      total,
      userId: req.user.uid,
      status: "pendente",
      criadoEm: new Date()
    };

    const docRef = await db.firestore().collection("pedidos").add(novoPedido);

    res.json({
      message: "Pedido criado com sucesso",
      id: docRef.id
    });
  } catch (error) {
    console.error("ERRO CRIAR PEDIDO:", error.message);
    res.status(500).json({ error: "Erro ao criar pedido" });
  }
};
