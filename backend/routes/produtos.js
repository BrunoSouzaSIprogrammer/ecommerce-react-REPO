const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");

const controller = require("../controllers/produtosController");
const upload = require("../config/upload");

// Público — listagem e leitura
router.get("/", controller.listarProdutos);
router.get("/:id", controller.obterProduto);

// Admin — criação aceita múltiplas imagens (campo "imagens")
// ou uma única (campo "imagem", compat).
router.post(
  "/",
  autenticar,
  isAdmin,
  upload.fields([
    { name: "imagens", maxCount: 10 },
    { name: "imagem", maxCount: 1 },
  ]),
  (req, res, next) => {
    // Normaliza: consolida req.files.imagens + req.files.imagem em req.files
    const imagens = (req.files && req.files.imagens) || [];
    const imagemSingular = (req.files && req.files.imagem) || [];
    req.files = [...imagens, ...imagemSingular];
    next();
  },
  controller.criarProduto
);

// Admin — atualização (metadados, sem troca de imagem)
router.put("/:id", autenticar, isAdmin, controller.atualizarProduto);

// Admin — estoque (rota nova + compat com legada)
router.patch("/:id/estoque", autenticar, isAdmin, controller.atualizarEstoque);
router.put("/estoque/:id", autenticar, isAdmin, controller.atualizarEstoque);

// Admin — delete
router.delete("/:id", autenticar, isAdmin, controller.deletarProduto);

module.exports = router;
