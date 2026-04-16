const express = require("express");
const router = express.Router();
const pedidosController = require("../controllers/pedidosController");
const { autenticar, isAdmin } = require("../middlewares/auth");

router.get("/", autenticar, pedidosController.listarPedidos);
router.post("/", autenticar, pedidosController.criarPedido);

// Detalhe — usuário dono ou ADMIN (autorização feita no controller).
router.get("/:pedidoId", autenticar, pedidosController.obterPedido);

// Avaliação — cliente, só após recebido.
router.post("/:pedidoId/avaliar", autenticar, pedidosController.avaliarPedido);

// Rastreio — ADMIN cadastra código, cliente/ADMIN consultam status.
router.patch("/:pedidoId/rastreio", autenticar, isAdmin, pedidosController.atualizarRastreio);
router.get("/:pedidoId/rastreio", autenticar, pedidosController.consultarRastreio);

// Rotas exclusivas para ADMIN
router.put("/:pedidoId/confirmar-pix", autenticar, isAdmin, pedidosController.confirmarPagamentoPix);
router.patch("/:pedidoId/status", autenticar, pedidosController.atualizarStatusPedido);

// Configuração de comissão (apenas admin)
router.get("/comissao/config", autenticar, isAdmin, pedidosController.getComissaoConfig);
router.put("/comissao/config", autenticar, isAdmin, pedidosController.setComissaoConfig);

// Resumo financeiro (apenas admin)
router.get("/financeiro/resumo", autenticar, isAdmin, pedidosController.getResumoFinanceiro);

module.exports = router;
