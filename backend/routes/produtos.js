const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");

const controller = require("../controllers/produtosController");
const upload = require("../config/upload");

// Público — listagem
router.get("/", controller.listarProdutos);

// Requer autenticação
router.post("/", autenticar, upload.single("imagem"), controller.criarProduto);
router.put("/estoque/:id", autenticar, controller.atualizarEstoque);

// Requer autenticação + admin
router.delete("/:id", autenticar, isAdmin, controller.deletarProduto);

module.exports = router;
