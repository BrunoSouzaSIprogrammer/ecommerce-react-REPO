exports.resumo = async (req, res) => {
  res.json({
    totalVendas: 15000,
    lucro: 12000,
    comissao: 3000
  });
};