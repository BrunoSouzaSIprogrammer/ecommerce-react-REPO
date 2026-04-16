const frenet = require("../services/frenet");

// POST /frete/calcular
// Body: { cepDestino, itens: [{ id, preco, quantidade, peso?, altura?, largura?, comprimento? }] }
exports.calcularFrete = async (req, res) => {
  try {
    const { cepDestino, itens } = req.body;
    const opcoes = await frenet.calcularFrete({ cepDestino, itens });
    res.json({
      opcoes,
      cepOrigem: process.env.CEP_ORIGEM || null,
      modo: frenet.isStub() ? "stub" : "frenet",
    });
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    res.status(400).json({ erro: error.message || "Erro ao calcular frete" });
  }
};
