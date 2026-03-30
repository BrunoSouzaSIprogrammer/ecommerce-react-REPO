const db = require("../config/firebase");

// LISTAR
exports.listarProdutos = async (req, res) => {
  try {
    const snapshot = await db.collection("produtos").get();
    const produtos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar produtos" });
  }
};

// CRIAR
exports.criarProduto = async (req, res) => {
  const { nome, preco, categoriaId } = req.body;

  const imagem = req.file ? req.file.filename : null;

  const novoProduto = {
    nome,
    preco,
    categoriaId,
    imagem
  };

  const docRef = await db.collection("produtos").add(novoProduto);

  res.json({
    mensagem: "Produto criado!",
    id: docRef.id
  });
};

// ATUALIZAR
exports.atualizarProduto = async (req, res) => {
  const { id } = req.params;
  const { nome, preco, categoriaId } = req.body;

  await db.collection("produtos").doc(id).update({
    nome,
    preco,
    categoriaId
  });

  res.json({ mensagem: "Produto atualizado" });
};

// DELETAR
exports.deletarProduto = async (req, res) => {
  const { id } = req.params;

  await db.collection("produtos").doc(id).delete();

  res.json({ mensagem: "Produto deletado" });
};

exports.atualizarEstoque = async (req, res) => {
  const { id } = req.params;
  const { estoque } = req.body;

  await db.collection("produtos").doc(id).update({
    estoque
  });

  res.json({ message: "Estoque atualizado" });
};