const db = require("../config/firebase");

exports.criarPedido = async (req, res) => {
  try {
    const { itens, total, userId } = req.body;

    const novoPedido = {
      itens,
      total,
      userId,
      status: "pendente",
      criadoEm: new Date()
    };

    const docRef = await db.collection("pedidos").add(novoPedido);

    res.json({
      message: "Pedido criado com sucesso",
      id: docRef.id
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar pedido" });
  }
};