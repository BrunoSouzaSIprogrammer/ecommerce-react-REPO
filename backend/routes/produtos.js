const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middlewares/auth");

const controller = require("../controllers/produtosController");
const upload = require("../config/upload");

// ROTAS
router.get("/", controller.listarProdutos);
router.post("/", isAdmin, upload.single("imagem"), controller.criarProduto);
router.put("/estoque/:id", controller.atualizarEstoque);
router.delete("/:id", isAdmin, controller.deletarProduto);


module.exports = router;