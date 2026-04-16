const { CATEGORIAS, CATEGORIAS_POR_ID } = require("../shared/filtros");

// GET /categorias
// Retorna o catálogo completo de categorias (incluindo a virtual
// "cobra-dagua") com suas definições de filtros. O frontend usa
// isto como source of truth para renderizar filtros dinâmicos.
exports.listarCategorias = (req, res) => {
  res.json(CATEGORIAS);
};

// GET /categorias/:id
// Retorna uma categoria específica com seus filtros.
exports.obterCategoria = (req, res) => {
  const { id } = req.params;
  const cat = CATEGORIAS_POR_ID[id];
  if (!cat) {
    return res.status(404).json({ erro: "Categoria não encontrada" });
  }
  res.json(cat);
};

// POST /categorias
// Mantido como no-op para compatibilidade com chamadas existentes
// do admin — categorias são definidas em código (shared/filtros.js),
// não no Firestore. Retornar 400 evita confusão silenciosa.
exports.criarCategoria = (req, res) => {
  res.status(400).json({
    erro:
      "As categorias são definidas em backend/shared/filtros.js e não podem ser criadas em runtime.",
  });
};
