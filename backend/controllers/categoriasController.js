let categorias = [
  { id: 1, nome: "Camisetas" },
  { id: 2, nome: "Calças" }
];

// LISTAR
exports.listarCategorias = (req, res) => {
  res.json(categorias);
};

// CRIAR
exports.criarCategoria = (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "Nome é obrigatório" });
  }

  const novaCategoria = {
    id: categorias.length + 1,
    nome
  };

  categorias.push(novaCategoria);

  res.json({ mensagem: "Categoria criada", categoria: novaCategoria });
};