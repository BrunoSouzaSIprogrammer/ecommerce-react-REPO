const express = require("express");
const router = express.Router();
const pedidosController = require("../controllers/pedidosController");
const { autenticar, isAdmin } = require("../middlewares/auth");

router.get("/", autenticar, pedidosController.listarPedidos);
router.post("/", autenticar, pedidosController.criarPedido);

// Rotas exclusivas para ADMIN
router.put("/:pedidoId/confirmar-pix", autenticar, isAdmin, pedidosController.confirmarPagamentoPix);
router.patch("/:pedidoId/status", autenticar, pedidosController.atualizarStatusPedido);

// Configuração de comissão (apenas admin)
router.get("/comissao/config", autenticar, isAdmin, pedidosController.getComissaoConfig);
router.put("/comissao/config", autenticar, isAdmin, pedidosController.setComissaoConfig);

// Resumo financeiro (apenas admin)
router.get("/financeiro/resumo", autenticar, isAdmin, pedidosController.getResumoFinanceiro);

module.exports = router;
